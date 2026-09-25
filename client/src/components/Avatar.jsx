import { getInitials } from "../lib/utils";

const SIZES = {
  sm: "w-8 h-8 text-xs",
  md: "w-11 h-11 text-sm",
  lg: "w-20 h-20 text-2xl",
  xl: "w-28 h-28 text-4xl",
};
const DOT_SIZES = { sm: "w-2.5 h-2.5", md: "w-3 h-3", lg: "w-4 h-4", xl: "w-5 h-5" };

//a handful of pleasant gradients, picked from the name so each person keeps the same color
const GRADIENTS = [
  "from-indigo-400 to-blue-600",
  "from-fuchsia-400 to-purple-600",
  "from-emerald-400 to-teal-600",
  "from-amber-400 to-orange-600",
  "from-rose-400 to-pink-600",
  "from-sky-400 to-cyan-600",
];
const gradientFor = (name = "") =>
  GRADIENTS[[...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % GRADIENTS.length];

const Avatar = ({ user, size = "md", online = false, src, className = "" }) => {
  const image = src ?? user?.profilePic;
  return (
    <div className={`relative shrink-0 ${className}`}>
      {image ? (
        <img src={image} alt={user?.fullName || ""} className={`${SIZES[size]} rounded-full object-cover ring-1 ring-white/10`} />
      ) : (
        <div className={`${SIZES[size]} rounded-full bg-gradient-to-br ${gradientFor(user?.fullName)} flex items-center justify-center font-semibold text-white ring-1 ring-white/10`}>
          {getInitials(user?.fullName)}
        </div>
      )}
      {online && (
        <span className={`absolute bottom-0 right-0 ${DOT_SIZES[size]} rounded-full bg-emerald-400 ring-2 ring-ink-900`} />
      )}
    </div>
  );
};

export default Avatar;
