import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import assets from "../assets/assets";
import { AuthContext } from "../../context/AuthContext.jsx";
import { ChatContext } from "../../context/ChatContext.jsx";
import Avatar from "./Avatar";
import { CloseIcon, DotsIcon, ImageIcon, LogoutIcon, SearchIcon, UserIcon, CheckIcon, CheckCheckIcon } from "./Icons";
import { formatListTime } from "../lib/utils";

const FILTERS = ["All", "Unread", "Online"];

const SideBar = () => {
  const { users, usersLoading, selectedUser, setSelectedUser, unseenMessages, lastMessages, typingUsers } = useContext(ChatContext);
  const { authUser, logout, onlineUsers } = useContext(AuthContext);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  //close the menu when clicking anywhere else
  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e) => !menuRef.current?.contains(e.target) && setMenuOpen(false);
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  //search + filter, most recent conversations first
  const visibleUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users
      .filter((u) => !q || u.fullName.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q))
      .filter((u) => filter !== "Unread" || unseenMessages[u._id] > 0)
      .filter((u) => filter !== "Online" || onlineUsers.includes(u._id))
      .sort((a, b) => {
        const ta = lastMessages[a._id] ? new Date(lastMessages[a._id].createdAt).getTime() : 0;
        const tb = lastMessages[b._id] ? new Date(lastMessages[b._id].createdAt).getTime() : 0;
        return tb - ta || a.fullName.localeCompare(b.fullName);
      });
  }, [users, query, filter, unseenMessages, onlineUsers, lastMessages]);

  const preview = (user) => {
    if (typingUsers[user._id]) return <span className="text-brand-300">typing…</span>;
    const last = lastMessages[user._id];
    if (!last) return <span className="italic text-slate-500">{user.bio || "Say hi 👋"}</span>;
    const mine = last.senderId === authUser._id;
    return (
      <span className="flex items-center gap-1 min-w-0">
        {mine && (last.seen
          ? <CheckCheckIcon className="w-3.5 h-3.5 shrink-0 text-brand-300" />
          : <CheckIcon className="w-3.5 h-3.5 shrink-0" />)}
        {last.image && !last.text && <ImageIcon className="w-3.5 h-3.5 shrink-0" />}
        <span className="truncate">{last.text || "Photo"}</span>
      </span>
    );
  };

  return (
    <aside className={`h-full flex flex-col min-h-0 border-r border-white/10 bg-ink-900/60 ${selectedUser ? "max-md:hidden" : ""}`}>
      {/* header */}
      <div className="p-4 pb-3 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src={assets.logo} alt="" className="w-9 h-9" />
            <span className="text-xl font-semibold tracking-wide">Phoenix</span>
          </div>
          <div ref={menuRef} className="relative">
            <button onClick={() => setMenuOpen((o) => !o)} className="icon-btn" aria-label="Menu" aria-expanded={menuOpen}>
              <DotsIcon />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 z-30 w-48 rounded-xl border border-white/10 bg-ink-800 p-1.5 shadow-xl shadow-black/40 animate-pop-in">
                <button onClick={() => navigate("/profile")} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-200 hover:bg-white/5 cursor-pointer">
                  <UserIcon className="w-4 h-4" /> Edit profile
                </button>
                <button onClick={logout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-rose-300 hover:bg-rose-500/10 cursor-pointer">
                  <LogoutIcon className="w-4 h-4" /> Log out
                </button>
              </div>
            )}
          </div>
        </div>

        {/* search */}
        <div className="relative">
          <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} type="text" placeholder="Search people…"
            className="field pl-10 pr-9 rounded-full" />
          {query && (
            <button onClick={() => setQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 icon-btn w-7 h-7" aria-label="Clear search">
              <CloseIcon className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* filters */}
        <div className="flex gap-1.5">
          {FILTERS.map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition cursor-pointer ${filter === f ? "bg-brand-500/20 text-brand-300 ring-1 ring-brand-400/30" : "text-slate-400 hover:bg-white/5 hover:text-slate-200"}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* conversation list */}
      <div className="flex-1 overflow-y-auto scroll-thin px-2 pb-2">
        {usersLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
              <div className="w-11 h-11 rounded-full bg-white/10" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-1/2 rounded bg-white/10" />
                <div className="h-2.5 w-3/4 rounded bg-white/5" />
              </div>
            </div>
          ))
        ) : visibleUsers.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-slate-500">
            {query ? `No one matches “${query}”` : filter === "Unread" ? "You're all caught up ✨" : filter === "Online" ? "Nobody is online right now" : "No other users yet. Invite a friend!"}
          </p>
        ) : (
          visibleUsers.map((user) => {
            const unseen = unseenMessages[user._id] || 0;
            const last = lastMessages[user._id];
            const active = selectedUser?._id === user._id;
            return (
              <button key={user._id} onClick={() => setSelectedUser(user)}
                className={`w-full flex items-center gap-3 rounded-xl p-3 text-left transition cursor-pointer ${active ? "bg-brand-500/15 ring-1 ring-brand-400/20" : "hover:bg-white/5"}`}>
                <Avatar user={user} online={onlineUsers.includes(user._id)} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className={`truncate ${unseen ? "font-semibold text-white" : "font-medium text-slate-100"}`}>{user.fullName}</p>
                    {last && <span className={`shrink-0 text-[11px] ${unseen ? "text-brand-300" : "text-slate-500"}`}>{formatListTime(last.createdAt)}</span>}
                  </div>
                  <div className="flex items-center justify-between gap-2 text-[13px] text-slate-400">
                    <div className="min-w-0 flex-1 truncate">{preview(user)}</div>
                    {unseen > 0 && (
                      <span className="shrink-0 min-w-5 h-5 px-1.5 rounded-full bg-brand-500 text-[11px] font-semibold text-white flex items-center justify-center">
                        {unseen > 99 ? "99+" : unseen}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* current user */}
      <button onClick={() => navigate("/profile")} className="m-2 mt-0 flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-3 text-left hover:bg-white/5 transition cursor-pointer">
        <Avatar user={authUser} size="sm" online />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{authUser.fullName}</p>
          <p className="truncate text-xs text-slate-500">{authUser.email}</p>
        </div>
      </button>
    </aside>
  );
};

export default SideBar;
