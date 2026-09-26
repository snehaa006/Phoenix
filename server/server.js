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

//CORS first, so even error responses carry the headers the browser needs
app.use(cors());
app.options(/.*/, cors());

//images are sent as base64 strings, so allow bodies up to 6mb (~4mb image)
app.use(express.json({ limit: "6mb" }));

app.use("/api/status", (req, res) => res.send("Server is live."));

//Connect to the database lazily; if it fails, report why and retry on the next request
//instead of crashing the whole function (which shows up in the browser as a CORS error)
let dbReady;
const ensureDB = () => {
    dbReady ??= connectDB().catch((error) => {
        dbReady = undefined;
        throw error;
    });
    return dbReady;
};
app.use(async (req, res, next) => {
    try {
        await ensureDB();
        next();
    } catch (error) {
        console.log("Database unavailable:", error.message);
        res.status(503).json({ success: false, message: `Database unavailable: ${error.message}` });
    }
});

//Routes setup
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

if (!process.env.VERCEL) { //Vercel runs the exported server itself
    ensureDB().catch((error) => console.log("Database unavailable:", error.message));
    const PORT = process.env.PORT || 5001;
    server.listen(PORT, () => console.log("Server is running on PORT: " + PORT));
}
//export server for vercel
export default server;
