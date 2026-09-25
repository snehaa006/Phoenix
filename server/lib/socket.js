import jwt from "jsonwebtoken";
import { Server } from "socket.io";

// userId -> Set of socket ids (a user can be connected from several tabs/devices)
const userSockets = new Map();

export let io;

export const getOnlineUserIds = () => [...userSockets.keys()];

export const isOnline = (userId) => userSockets.has(String(userId));

// Emit an event to every socket belonging to a user
export const emitToUser = (userId, event, payload) => {
    const sockets = userSockets.get(String(userId));
    if (!io || !sockets) return;
    for (const socketId of sockets) {
        io.to(socketId).emit(event, payload);
    }
};

const resolveUserId = (socket) => {
    const token = socket.handshake.auth?.token;
    if (!token) return null;
    try {
        return String(jwt.verify(token, process.env.JWT_SECRET).userId);
    } catch {
        return null;
    }
};

export const initSocket = (server) => {
    io = new Server(server, {
        cors: { origin: "*" },
    });

    io.on("connection", (socket) => {
        const userId = resolveUserId(socket);
        if (!userId) {
            socket.disconnect(true);
            return;
        }

        if (!userSockets.has(userId)) userSockets.set(userId, new Set());
        userSockets.get(userId).add(socket.id);
        io.emit("getOnlineUsers", getOnlineUserIds());

        // Typing indicators are relayed straight to the other participant
        socket.on("typing", ({ to } = {}) => {
            if (to) emitToUser(to, "typing", { from: userId });
        });
        socket.on("stopTyping", ({ to } = {}) => {
            if (to) emitToUser(to, "stopTyping", { from: userId });
        });

        socket.on("disconnect", () => {
            const sockets = userSockets.get(userId);
            if (sockets) {
                sockets.delete(socket.id);
                if (sockets.size === 0) userSockets.delete(userId);
            }
            io.emit("getOnlineUsers", getOnlineUserIds());
        });
    });

    return io;
};
