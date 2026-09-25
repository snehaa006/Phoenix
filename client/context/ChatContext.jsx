import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AuthContext } from "./AuthContext.jsx";
import toast from "react-hot-toast";
import { errorMessage } from "../src/lib/utils.js";

export const ChatContext = createContext();

const TYPING_TIMEOUT = 4000;

export const ChatProvider = ({children})=>{
    const [messages, setMessages] = useState([]);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [users, setUsers] = useState([]);
    const [usersLoading, setUsersLoading] = useState(true);
    const [selectedUser, setSelectedUserState] = useState(null)
    const [unseenMessages, setUnseenMessages] = useState({}) //userId -> number of unseen messages
    const [lastMessages, setLastMessages] = useState({}) //userId -> last message of the conversation
    const [typingUsers, setTypingUsers] = useState({}) //userId -> true while they are typing to me

    const {socket, axios, authUser, onlineUsers} = useContext(AuthContext);
    const myId = authUser?._id;

    //refs so socket handlers always see current values without re-subscribing
    const selectedUserRef = useRef(null);
    const usersRef = useRef([]);
    const typingTimers = useRef({});
    useEffect(()=>{ usersRef.current = users }, [users]);

    //function to get all users for sidebar
    const getUsers = useCallback(async()=>{
        try {
            const {data} = await axios.get("/api/messages/users");
            if(data.success){
                setUsers(data.users)
                setUnseenMessages(data.unseenMessages || {})
                setLastMessages(data.lastMessages || {})
            }else{
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(errorMessage(error));
        } finally {
            setUsersLoading(false);
        }
    }, [axios])

    //function to get messages for a user
    const getMessages = useCallback(async(userId)=>{
        setMessagesLoading(true);
        try {
            const {data} = await axios.get(`/api/messages/${userId}`);
            //ignore the response if the user switched chats in the meantime
            if(selectedUserRef.current?._id !== userId) return;
            if(data.success){
                setMessages(data.messages);
                setUnseenMessages((prev)=> ({...prev, [userId]: 0}));
            }else{
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(errorMessage(error));
        } finally {
            if(selectedUserRef.current?._id === userId) setMessagesLoading(false);
        }
    }, [axios])

    //open (or close, with null) a conversation
    const setSelectedUser = useCallback((user)=>{
        if(user?._id === selectedUserRef.current?._id) return;
        selectedUserRef.current = user;
        setSelectedUserState(user);
        setMessages([]);
        if(user){
            setUnseenMessages((prev)=> ({...prev, [user._id]: 0}));
            getMessages(user._id);
        }
    }, [getMessages])

    //send a message to the selected user; shows it immediately and swaps in the saved one
    const sendMessage  = useCallback(async(messageData)=>{
        const receiver = selectedUserRef.current;
        if(!receiver || !myId) return false;
        const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const tempMessage = {
            _id: tempId,
            senderId: myId,
            recieverId: receiver._id,
            text: messageData.text,
            image: messageData.image,
            seen: false,
            createdAt: new Date().toISOString(),
            pending: true,
        };
        setMessages((prev)=> [...prev, tempMessage]);
        try {
            const {data} = await axios.post(`/api/messages/send/${receiver._id}`, messageData);
            if(!data.success) throw new Error(data.message);
            const saved = data.newMessage;
            setMessages((prev)=> prev.some((m)=> m._id === saved._id)
                ? prev.filter((m)=> m._id !== tempId) //already delivered through the socket
                : prev.map((m)=> m._id === tempId ? saved : m));
            setLastMessages((prev)=> ({...prev, [receiver._id]: saved}));
            return true;
        } catch (error) {
            setMessages((prev)=> prev.filter((m)=> m._id !== tempId));
            toast.error(errorMessage(error));
            return false;
        }
    }, [axios, myId])

    const deleteMessage = useCallback(async(messageId)=>{
        try {
            const {data} = await axios.delete(`/api/messages/${messageId}`);
            if(!data.success) throw new Error(data.message);
            setMessages((prev)=> prev.filter((m)=> m._id !== messageId));
            getUsers(); //refresh last-message previews
        } catch (error) {
            toast.error(errorMessage(error));
        }
    }, [axios, getUsers])

    const emitTyping = useCallback((isTyping)=>{
        const to = selectedUserRef.current?._id;
        if(socket && to) socket.emit(isTyping ? "typing" : "stopTyping", {to});
    }, [socket])

    const setTyping = useCallback((userId, isTyping)=>{
        clearTimeout(typingTimers.current[userId]);
        if(isTyping){
            //safety net in case the stopTyping event never arrives
            typingTimers.current[userId] = setTimeout(()=> setTyping(userId, false), TYPING_TIMEOUT);
        }
        setTypingUsers((prev)=> {
            if(!!prev[userId] === isTyping) return prev;
            const next = {...prev};
            if(isTyping) next[userId] = true; else delete next[userId];
            return next;
        });
    }, [])

    //load conversations once logged in, reset everything on logout
    useEffect(()=>{
        if(myId){
            setUsersLoading(true);
            getUsers();
        }else{
            selectedUserRef.current = null;
            setSelectedUserState(null);
            setMessages([]);
            setUsers([]);
            setUnseenMessages({});
            setLastMessages({});
            setTypingUsers({});
        }
    }, [myId, getUsers])

    //someone we don't know yet came online (e.g. a new sign-up) -> refresh the list
    useEffect(()=>{
        if(!myId || usersLoading) return;
        const known = new Set(usersRef.current.map((u)=> u._id));
        if(onlineUsers.some((id)=> id !== myId && !known.has(id))) getUsers();
    }, [onlineUsers, myId, usersLoading, getUsers])

    //real-time events
    useEffect(()=>{
        if(!socket || !myId) return;

        const onNewMessage = (newMessage)=>{
            const fromMe = newMessage.senderId === myId;
            const otherId = fromMe ? newMessage.recieverId : newMessage.senderId;
            const isOpen = selectedUserRef.current?._id === otherId;

            if(!fromMe) setTyping(otherId, false);

            if(isOpen){
                if(!fromMe){
                    newMessage = {...newMessage, seen: true};
                    axios.put(`/api/messages/mark/${newMessage._id}`).catch(()=>{});
                }
                setMessages((prev)=> prev.some((m)=> m._id === newMessage._id) ? prev : [...prev, newMessage]);
            }else if(!fromMe){
                setUnseenMessages((prev)=> ({...prev, [otherId]: (prev[otherId] || 0) + 1}));
            }
            setLastMessages((prev)=> ({...prev, [otherId]: newMessage}));

            if(!usersRef.current.some((u)=> u._id === otherId)) getUsers();
        }

        //the other person read my messages
        const onMessagesSeen = ({by, messageId})=>{
            const matches = (m)=> m.senderId === myId && m.recieverId === by && (!messageId || m._id === messageId);
            setMessages((prev)=> prev.some((m)=> matches(m) && !m.seen) ? prev.map((m)=> matches(m) ? {...m, seen: true} : m) : prev);
            setLastMessages((prev)=> prev[by] && matches(prev[by]) ? {...prev, [by]: {...prev[by], seen: true}} : prev);
        }

        const onMessageDeleted = ({messageId})=>{
            setMessages((prev)=> prev.filter((m)=> m._id !== messageId));
            getUsers();
        }

        const onTyping = ({from})=> setTyping(from, true);
        const onStopTyping = ({from})=> setTyping(from, false);

        socket.on("newMessage", onNewMessage);
        socket.on("messagesSeen", onMessagesSeen);
        socket.on("messageDeleted", onMessageDeleted);
        socket.on("typing", onTyping);
        socket.on("stopTyping", onStopTyping);
        return ()=>{
            socket.off("newMessage", onNewMessage);
            socket.off("messagesSeen", onMessagesSeen);
            socket.off("messageDeleted", onMessageDeleted);
            socket.off("typing", onTyping);
            socket.off("stopTyping", onStopTyping);
        }
    }, [socket, myId, axios, getUsers, setTyping])

    //unread count in the browser tab title
    const totalUnseen = useMemo(()=> Object.values(unseenMessages).reduce((sum, n)=> sum + (n || 0), 0), [unseenMessages]);
    useEffect(()=>{
        document.title = totalUnseen > 0 ? `(${totalUnseen}) Phoenix` : "Phoenix";
    }, [totalUnseen])

    const value = {
        messages, messagesLoading, users, usersLoading, selectedUser, setSelectedUser,
        getUsers, sendMessage, deleteMessage, unseenMessages, lastMessages,
        typingUsers, emitTyping, totalUnseen,
    }
    return (<ChatContext.Provider value = {value}>
        {children}
    </ChatContext.Provider>)
}
