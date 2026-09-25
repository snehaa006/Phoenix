import React, { useContext, useMemo } from "react";
import { ChatContext } from "../../context/ChatContext.jsx";
import { AuthContext } from "../../context/AuthContext.jsx";
import Avatar from "./Avatar";
import { CloseIcon, ImageIcon, MailIcon } from "./Icons";

//contact details + shared media for the open conversation
const RightSideBar = ({ onClose, onOpenImage }) => {
  const { selectedUser, messages } = useContext(ChatContext);
  const { onlineUsers } = useContext(AuthContext);

  const media = useMemo(() => messages.filter((m) => m.image).map((m) => m.image).reverse(), [messages]);

  if (!selectedUser) return null;
  const online = onlineUsers.includes(selectedUser._id);

  return (
    <aside className="h-full min-h-0 flex flex-col border-l border-white/10 bg-ink-900/80 max-lg:bg-ink-900 animate-fade-in">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <p className="font-medium">Contact info</p>
        <button onClick={onClose} className="icon-btn" aria-label="Close contact info"><CloseIcon /></button>
      </div>

      <div className="flex-1 overflow-y-auto scroll-thin">
        <div className="flex flex-col items-center gap-2 px-6 pt-8 pb-6 text-center">
          <Avatar user={selectedUser} size="xl" online={online} />
          <h2 className="mt-2 text-xl font-semibold">{selectedUser.fullName}</h2>
          <span className={`rounded-full px-2.5 py-0.5 text-xs ${online ? "bg-emerald-400/15 text-emerald-300" : "bg-white/5 text-slate-400"}`}>
            {online ? "Online" : "Offline"}
          </span>
        </div>

        <div className="mx-4 space-y-4 rounded-2xl bg-white/[0.03] p-4 ring-1 ring-white/5">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-slate-500">About</p>
            <p className="mt-1 text-sm text-slate-200 whitespace-pre-wrap">{selectedUser.bio || "No bio yet."}</p>
          </div>
          {selectedUser.email && (
            <div>
              <p className="text-[11px] uppercase tracking-wider text-slate-500">Email</p>
              <a href={`mailto:${selectedUser.email}`} className="mt-1 flex items-center gap-2 text-sm text-brand-300 hover:underline break-all">
                <MailIcon className="w-4 h-4 shrink-0" /> {selectedUser.email}
              </a>
            </div>
          )}
        </div>

        <div className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-wider text-slate-500">Shared media</p>
            <span className="text-xs text-slate-500">{media.length}</span>
          </div>
          {media.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-white/10 py-8 text-slate-500">
              <ImageIcon className="w-6 h-6" />
              <p className="text-xs">Photos you share will show up here</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1.5">
              {media.map((url, i) => (
                <button key={`${url}-${i}`} onClick={() => onOpenImage(url)} className="aspect-square overflow-hidden rounded-lg cursor-zoom-in">
                  <img src={url} alt="" className="h-full w-full object-cover transition hover:scale-105" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default RightSideBar;
