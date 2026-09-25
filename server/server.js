import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import { connectDB } from "./lib/db.js";
import { initSocket } from "./lib/socket.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";

//create Express app and HTTP server (socket.io needs the raw http server)
const app = express();
const server = http.createServer(app);

//Initialize Socket.io server
initSocket(server);

//Middleware setup
//images are sent as base64 strings, so allow bodies up to 6mb (~4mb image)
app.use(express.json({ limit: "6mb" }));
app.use(cors());

//Routes setup
app.use("/api/status", (req, res) => res.send("Server is live."));
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);

//Payload too large / malformed json -> json error instead of an html page
app.use((err, req, res, next) => {
    if (err.type === "entity.too.large") {
        return res.status(413).json({ success: false, message: "File is too large (max 4MB)" });
    }
    console.log(err.message);
    res.status(err.status || 500).json({ success: false, message: "Something went wrong" });
});

//Connect to MongoDB
await connectDB();

if (process.env.NODE_ENV !== "production") {
    const PORT = process.env.PORT || 5001;
    server.listen(PORT, () => console.log("Server is running on PORT: " + PORT));
}
//export server for vercel
export default server;
