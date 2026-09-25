const sameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export function formatMessageTime(date){
    return new Date(date).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute : "2-digit",
        hour12 : false,
    })
}

//"Today", "Yesterday", weekday for the last week, otherwise a full date
export function formatDateLabel(date){
    const d = new Date(date);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if(sameDay(d, now)) return "Today";
    if(sameDay(d, yesterday)) return "Yesterday";
    const diffDays = (now - d) / 86400000;
    if(diffDays < 7) return d.toLocaleDateString("en-US", {weekday: "long"});
    return d.toLocaleDateString("en-US", {day: "numeric", month: "short", year: d.getFullYear() === now.getFullYear() ? undefined : "numeric"});
}

//compact timestamp for the conversation list
export function formatListTime(date){
    const d = new Date(date);
    const now = new Date();
    if(sameDay(d, now)) return formatMessageTime(d);
    const label = formatDateLabel(d);
    if(label === "Yesterday") return label;
    if((now - d) / 86400000 < 7) return d.toLocaleDateString("en-US", {weekday: "short"});
    return d.toLocaleDateString("en-US", {day: "numeric", month: "short"});
}

export function isSameDay(a, b){
    return sameDay(new Date(a), new Date(b));
}

export function getInitials(name = ""){
    return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() || "").join("") || "?";
}

export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

export function readFileAsDataURL(file){
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("Could not read file"));
        reader.readAsDataURL(file);
    });
}

//checks an image picked by the user; returns an error string or null
export function validateImage(file){
    if(!file) return "No file selected";
    if(!file.type.startsWith("image/")) return "Please select an image file";
    if(file.size > MAX_IMAGE_BYTES) return "Image must be smaller than 4MB";
    return null;
}

export function errorMessage(error){
    return error?.response?.data?.message || error?.message || "Something went wrong";
}
