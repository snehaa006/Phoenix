import { useEffect } from "react";
import { CloseIcon, DownloadIcon } from "./Icons";

//fullscreen image viewer, closes on Escape or backdrop click
const Lightbox = ({ src, onClose }) => {
  useEffect(() => {
    if (!src) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [src, onClose]);

  if (!src) return null;
  return (
    <div onClick={onClose} className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-fade-in">
      <div className="absolute top-4 right-4 flex gap-2">
        <a href={src} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="icon-btn bg-white/10" title="Open original">
          <DownloadIcon className="w-5 h-5" />
        </a>
        <button onClick={onClose} className="icon-btn bg-white/10" title="Close">
          <CloseIcon className="w-5 h-5" />
        </button>
      </div>
      <img src={src} alt="" onClick={(e) => e.stopPropagation()} className="max-h-[90vh] max-w-[92vw] rounded-xl object-contain shadow-2xl animate-pop-in" />
    </div>
  );
};

export default Lightbox;
