import React, { useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import assets from "../assets/assets";
import { ChatContext } from "../../context/ChatContext.jsx";
import { AuthContext } from "../../context/AuthContext.jsx";
import Avatar from "./Avatar";
import { BackIcon, CheckCheckIcon, CheckIcon, ClockIcon, CloseIcon, ImageIcon, InfoIcon, SendIcon, Spinner, TrashIcon, ChatIcon } from "./Icons";
import { formatDateLabel, formatMessageTime, isSameDay, readFileAsDataURL, validateImage } from "../lib/utils";

const GROUP_WINDOW = 5 * 60 * 1000; //messages from the same person within 5 min are grouped
const TYPING_IDLE = 2000;

const MessageStatus = ({ msg }) => {
  if (msg.pending) return <ClockIcon className="w-3.5 h-3.5" />;
  if (msg.seen) return <CheckCheckIcon className="w-3.5 h-3.5 text-sky-300" />;
  return <CheckIcon className="w-3.5 h-3.5" />;
};

const ChatContainer = ({ showInfo, onToggleInfo, onOpenImage }) => {
  const { messages, messagesLoading, selectedUser, setSelectedUser, sendMessage, deleteMessage, typingUsers, emitTyping } = useContext(ChatContext);
  const { authUser, onlineUsers } = useContext(AuthContext);

  const [input, setInput] = useState("");
  const [pendingImage, setPendingImage] = useState(null); //data url waiting to be sent
  const [sending, setSending] = useState(false);
  const [showJump, setShowJump] = useState(false);

  const scrollRef = useRef(null);
  const textareaRef = useRef(null);
  const fileRef = useRef(null);
  const nearBottom = useRef(true);
  const drafts = useRef({}); //unsent text per conversation
  const typingState = useRef({ active: false, timer: null });

  const isOnline = selectedUser && onlineUsers.includes(selectedUser._id);
  const isTyping = selectedUser && typingUsers[selectedUser._id];

  const scrollToBottom = useCallback((behavior = "auto") => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior });
  }, []);

  const stopTyping = useCallback(() => {
    clearTimeout(typingState.current.timer);
    if (typingState.current.active) {
      typingState.current.active = false;
      emitTyping(false);
    }
  }, [emitTyping]);

  //switching conversations: restore that chat's draft and focus the composer
  useEffect(() => {
    if (!selectedUser) return;
    setInput(drafts.current[selectedUser._id] || "");
    setPendingImage(null);
    nearBottom.current = true;
    setShowJump(false);
    if (window.matchMedia("(min-width: 768px)").matches) textareaRef.current?.focus();
    return () => stopTyping();
  }, [selectedUser, stopTyping]);

  //keep pinned to the latest message unless the user scrolled up to read history
  const lastMessage = messages[messages.length - 1];
  const prevCount = useRef(0);
  useLayoutEffect(() => {
    const firstLoad = prevCount.current === 0;
    prevCount.current = messages.length;
    if (!lastMessage) return;
    if (firstLoad) {
      scrollToBottom(); //jump straight to the latest message when a chat opens
    } else if (nearBottom.current || lastMessage.senderId === authUser._id) {
      scrollToBottom("smooth");
    } else {
      setShowJump(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastMessage?._id, messages.length]);

  //auto-grow the composer
  useLayoutEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 140) + "px";
  }, [input]);

  const onScroll = () => {
    const el = scrollRef.current;
    nearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (nearBottom.current) setShowJump(false);
  };

  const onInputChange = (e) => {
    const value = e.target.value;
    setInput(value);
    drafts.current[selectedUser._id] = value;
    if (!value) return stopTyping();
    if (!typingState.current.active) {
      typingState.current.active = true;
      emitTyping(true);
    }
    clearTimeout(typingState.current.timer);
    typingState.current.timer = setTimeout(stopTyping, TYPING_IDLE);
  };

  const attachImage = async (file) => {
    const error = validateImage(file);
    if (error) return toast.error(error);
    try {
      setPendingImage(await readFileAsDataURL(file));
      textareaRef.current?.focus();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const onPickImage = (e) => {
    attachImage(e.target.files[0]);
    e.target.value = "";
  };

  //paste a screenshot straight into the composer
  const onPaste = (e) => {
    const file = [...(e.clipboardData?.files || [])].find((f) => f.type.startsWith("image/"));
    if (file) {
      e.preventDefault();
      attachImage(file);
    }
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    const text = input.trim();
    if ((!text && !pendingImage) || sending) return;
    const image = pendingImage;
    const userId = selectedUser._id;
    stopTyping();
    setInput("");
    setPendingImage(null);
    drafts.current[userId] = "";
    setSending(Boolean(image)); //text shows instantly, uploads block double-sends
    const ok = await sendMessage({ text: text || undefined, image: image || undefined });
    setSending(false);
    if (!ok) {
      //give the message back so nothing is lost
      setInput((cur) => cur || text);
      setPendingImage((cur) => cur || image);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) handleSend(e);
  };

  const onDelete = (msg) => {
    if (window.confirm("Delete this message for everyone?")) deleteMessage(msg._id);
  };

  if (!selectedUser) {
    return (
      <div className="h-full max-md:hidden flex flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-brand-500/30 blur-2xl" />
          <img src={assets.logo} alt="" className="relative w-24 h-24" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold">Welcome, {authUser.fullName.split(" ")[0]}</h2>
          <p className="mt-1 text-sm text-slate-400">Pick a conversation on the left to start chatting.</p>
        </div>
        <div className="mt-2 flex flex-wrap justify-center gap-2 text-xs text-slate-400">
          <span className="rounded-full bg-white/5 px-3 py-1">Enter to send</span>
          <span className="rounded-full bg-white/5 px-3 py-1">Shift + Enter for a new line</span>
          <span className="rounded-full bg-white/5 px-3 py-1">Paste images to share</span>
        </div>
      </div>
    );
  }

  return (
    <section className="h-full min-h-0 flex flex-col relative">
      {/* header */}
      <header className="flex items-center gap-3 px-3 md:px-5 py-3 border-b border-white/10 bg-ink-900/40">
        <button onClick={() => setSelectedUser(null)} className="icon-btn md:hidden" aria-label="Back">
          <BackIcon />
        </button>
        <button onClick={onToggleInfo} className="flex flex-1 min-w-0 items-center gap-3 text-left cursor-pointer">
          <Avatar user={selectedUser} online={isOnline} />
          <div className="min-w-0">
            <p className="truncate font-semibold">{selectedUser.fullName}</p>
            <p className={`text-xs ${isTyping ? "text-brand-300" : isOnline ? "text-emerald-400" : "text-slate-500"}`}>
              {isTyping ? "typing…" : isOnline ? "Online" : "Offline"}
            </p>
          </div>
        </button>
        <button onClick={onToggleInfo} className={`icon-btn ${showInfo ? "bg-white/10 text-white" : ""}`} aria-label="Contact info">
          <InfoIcon />
        </button>
      </header>

      {/* messages */}
      <div ref={scrollRef} onScroll={onScroll} className="flex-1 overflow-y-auto scroll-thin px-3 md:px-6 py-4">
        {messagesLoading && messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-500"><Spinner className="w-6 h-6" /></div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-3 text-center text-slate-400">
            <Avatar user={selectedUser} size="lg" />
            <p className="text-sm">This is the start of your conversation with <span className="text-white font-medium">{selectedUser.fullName}</span>.</p>
            <button onClick={() => { setInput("Hey! 👋"); textareaRef.current?.focus(); }} className="btn-ghost bg-white/5 rounded-full text-xs">
              <ChatIcon className="w-4 h-4" /> Say hi
            </button>
          </div>
        ) : (
          messages.map((msg, i) => {
            const prev = messages[i - 1];
            const next = messages[i + 1];
            const mine = msg.senderId === authUser._id;
            const newDay = !prev || !isSameDay(prev.createdAt, msg.createdAt);
            const groupedWithPrev = !newDay && prev.senderId === msg.senderId && new Date(msg.createdAt) - new Date(prev.createdAt) < GROUP_WINDOW;
            const groupedWithNext = next && next.senderId === msg.senderId && isSameDay(next.createdAt, msg.createdAt) && new Date(next.createdAt) - new Date(msg.createdAt) < GROUP_WINDOW;

            return (
              <React.Fragment key={msg._id}>
                {newDay && (
                  <div className="sticky top-0 z-10 flex justify-center py-3">
                    <span className="rounded-full bg-ink-800/90 backdrop-blur px-3 py-1 text-[11px] font-medium text-slate-400 ring-1 ring-white/10">
                      {formatDateLabel(msg.createdAt)}
                    </span>
                  </div>
                )}
                <div className={`group flex items-end gap-2 ${mine ? "justify-end" : "justify-start"} ${groupedWithPrev ? "mt-0.5" : "mt-3"} animate-pop-in`}>
                  {!mine && (
                    <div className="w-8">{!groupedWithNext && <Avatar user={selectedUser} size="sm" />}</div>
                  )}
                  {mine && !msg.pending && (
                    <button onClick={() => onDelete(msg)} className="icon-btn w-7 h-7 opacity-0 group-hover:opacity-100 focus:opacity-100 hover:text-rose-300" aria-label="Delete message">
                      <TrashIcon className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <div className={`max-w-[78%] sm:max-w-[65%] rounded-2xl shadow-sm ${msg.pending ? "opacity-70" : ""} ${
                    mine
                      ? `bg-gradient-to-br from-brand-500 to-brand-600 text-white ${groupedWithNext ? "" : "rounded-br-md"}`
                      : `bg-ink-700/90 text-slate-100 ring-1 ring-white/5 ${groupedWithNext ? "" : "rounded-bl-md"}`
                  } ${msg.image ? "p-1" : "px-3.5 py-2"}`}>
                    {msg.image && (
                      <button onClick={() => onOpenImage(msg.image)} className="block cursor-zoom-in">
                        <img src={msg.image} alt="" onLoad={() => nearBottom.current && scrollToBottom()}
                          className="max-h-72 w-auto max-w-full rounded-xl object-cover" />
                      </button>
                    )}
                    {msg.text && (
                      <p className={`whitespace-pre-wrap break-words text-[15px] leading-snug ${msg.image ? "px-2.5 pt-1.5" : ""}`}>{msg.text}</p>
                    )}
                    <div className={`flex items-center justify-end gap-1 text-[10px] ${mine ? "text-white/70" : "text-slate-400"} ${msg.image ? "px-2.5 pb-1 pt-0.5" : "mt-0.5"}`}>
                      {formatMessageTime(msg.createdAt)}
                      {mine && <MessageStatus msg={msg} />}
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })
        )}
        {isTyping && (
          <div className="mt-3 flex items-end gap-2">
            <Avatar user={selectedUser} size="sm" />
            <div className="flex gap-1 rounded-2xl rounded-bl-md bg-ink-700/90 px-4 py-3 text-slate-300 ring-1 ring-white/5">
              <span className="typing-dot" /><span className="typing-dot [animation-delay:0.15s]" /><span className="typing-dot [animation-delay:0.3s]" />
            </div>
          </div>
        )}
      </div>

      {showJump && (
        <button onClick={() => { scrollToBottom("smooth"); setShowJump(false); }}
          className="absolute bottom-24 left-1/2 -translate-x-1/2 rounded-full bg-brand-500 px-4 py-1.5 text-xs font-medium text-white shadow-lg animate-pop-in cursor-pointer">
          New messages ↓
        </button>
      )}

      {/* composer */}
      <form onSubmit={handleSend} className="border-t border-white/10 bg-ink-900/40 p-3 md:px-5">
        {pendingImage && (
          <div className="mb-2 inline-flex items-start gap-2 rounded-xl bg-white/5 p-2 ring-1 ring-white/10 animate-pop-in">
            <img src={pendingImage} alt="Attachment preview" className="h-20 rounded-lg object-cover" />
            <button type="button" onClick={() => setPendingImage(null)} className="icon-btn w-7 h-7" aria-label="Remove image">
              <CloseIcon className="w-4 h-4" />
            </button>
          </div>
        )}
        <div className="flex items-end gap-2">
          <div className="flex flex-1 items-end rounded-2xl bg-white/5 ring-1 ring-white/10 focus-within:ring-brand-400/50 transition">
            <textarea ref={textareaRef} value={input} onChange={onInputChange} onKeyDown={onKeyDown} onPaste={onPaste}
              rows={1} maxLength={2000} placeholder={`Message ${selectedUser.fullName.split(" ")[0]}…`}
              className="flex-1 resize-none bg-transparent px-4 py-3 text-[15px] text-white placeholder-slate-500 outline-none scroll-thin" />
            <input ref={fileRef} onChange={onPickImage} type="file" accept="image/png, image/jpeg, image/webp, image/gif" hidden />
            <button type="button" onClick={() => fileRef.current?.click()} className="icon-btn m-1.5" aria-label="Attach image">
              <ImageIcon />
            </button>
          </div>
          <button type="submit" disabled={(!input.trim() && !pendingImage) || sending}
            className="btn-primary h-12 w-12 shrink-0 rounded-full p-0" aria-label="Send">
            {sending ? <Spinner /> : <SendIcon className="w-5 h-5 -ml-0.5" />}
          </button>
        </div>
      </form>
    </section>
  );
};

export default ChatContainer;
