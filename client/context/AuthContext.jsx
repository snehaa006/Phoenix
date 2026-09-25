import axios from "axios"
import { createContext, useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast"; 
import io from "socket.io-client"
import { errorMessage } from "../src/lib/utils.js";

const backendUrl =  import.meta.env.VITE_BACKEND_URL;
axios.defaults.baseURL = backendUrl

export const AuthContext = createContext();

const setAuthHeader = (token)=>{
    if(token) axios.defaults.headers.common["token"] = token;
    else delete axios.defaults.headers.common["token"];
}

export const AuthProvider = ({children})=>{
    const [token , setToken] = useState(()=> localStorage.getItem("token"));
    const [authUser, setAuthUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true); //true until the saved session has been checked
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [socket, setSocket] = useState(null);
    const socketRef = useRef(null);

    // Socket connect → server updates online users → UI updates → logout disconnects
    const connectSocket = useCallback((authToken)=>{
        if(!authToken || socketRef.current) return;
        const newSocket = io(backendUrl, { auth: { token: authToken } });
        newSocket.on("getOnlineUsers", (userIds)=> setOnlineUsers(userIds));
        socketRef.current = newSocket;
        setSocket(newSocket);
    }, [])

    const disconnectSocket = useCallback(()=>{
        socketRef.current?.disconnect();
        socketRef.current = null;
        setSocket(null);
        setOnlineUsers([]);
    }, [])

    const clearSession = useCallback(()=>{
        localStorage.removeItem("token");
        setAuthHeader(null);
        setToken(null);
        setAuthUser(null);
        disconnectSocket();
    }, [disconnectSocket])

    // Login / signup, depending on state ("login" | "signup"). Resolves to true on success.
    const login = async(state, credentials)=>{
        try {
            const {data} = await axios.post(`/api/auth/${state}`, credentials)
            if(!data.success){
                toast.error(data.message)
                return false;
            }
            localStorage.setItem("token", data.token)
            setAuthHeader(data.token);
            setToken(data.token)
            setAuthUser(data.userData)
            connectSocket(data.token)
            toast.success(data.message)
            return true;
        } catch (error) {
            toast.error(errorMessage(error))
            return false;
        }
    }

    const logout = ()=>{
        clearSession();
        toast.success("Logged out");
    }

    // Resolves to true on success
    const updateProfile = async(body)=>{
        try {
            const {data} = await axios.put("/api/auth/update-profile", body);
            if(data.success){
                setAuthUser(data.user);
                toast.success("Profile updated");
                return true;
            }
            toast.error(data.message);
            return false;
        } catch (error) {
            toast.error(errorMessage(error))
            return false;
        }
    }

    //restore the session saved in localStorage (if any) on first load
    useEffect(()=>{
        const restore = async()=>{
            if(!token){
                setAuthLoading(false);
                return;
            }
            setAuthHeader(token);
            try {
                const {data} = await axios.get("/api/auth/check")
                if(data.success){
                    setAuthUser(data.user)
                    connectSocket(token)
                }else{
                    clearSession(); //expired or invalid token
                }
            } catch (error) {
                toast.error(errorMessage(error))
            } finally {
                setAuthLoading(false);
            }
        }
        restore();
        return ()=> socketRef.current?.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
    
    const value = {
        axios,
        authUser,
        authLoading,
        onlineUsers,
        socket,
        login, 
        logout, 
        updateProfile,
    }
    return (
        <AuthContext.Provider value = {value}>
            {children}
        </AuthContext.Provider>
    )
}
