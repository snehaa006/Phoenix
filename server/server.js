import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import {Server} from "socket.io";


//create Express app and HTTP server

const app = express();
const server = http.createServer(app) //socket.io supports http server

//Initialize Socekt.io server
export const io = new Server(server, {
    cors: {
        origin: "*",
    }
})
//store online users
export const userSocketMap = {}; //userId: SocketId;


//Socket.io Connection handler
io.on("connection", (socket)=>{
    const userId = socket.handshake.query.userId;
    console.log("User Connected", userId);

    if(userId){ 
        userSocketMap[userId] = socket.id
    }

    //Emit online users to all connected clients
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
    socket.on("disconnect", ()=>{
        console.log("User Disconnected, userId");
        delete userSocketMap[userId];
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
    })
})

//Middleware setup
//(we add express.json so that all requests to this server will be passed using json method)
app.use(express.json({limit: "4mb"}));//maximum limit memory upload for images can be 4mb

app.use(cors());

//Routes setup
app.use("/api/status", (req, res)=> res.send("Server is live.")); //to check whether backend server is running or not, we add api endpoint
app.use("/api/auth", userRouter)
app.use("/api/messages", messageRouter)
//Connect to MongoDB
await connectDB();
const PORT = process.env.PORT || 5001; //if port mentioned then that is use, otherwise 5001
server.listen(PORT,()=> console.log("Server is running on PORT: " + PORT)); //to start server