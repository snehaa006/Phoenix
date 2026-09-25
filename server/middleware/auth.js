import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protectRoute = async (req, res, next) => {
    try {
        const token = req.headers.token; // token from frontend

        if (!token) {
            return res.json({ success: false, message: "Not authorized, please log in" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Find user and remove password
        const user = await User.findById(decoded.userId).select("-password");

        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        req.user = user; // attach for controller use
        next();
    } catch (error) {
        console.log(error.message);
        const message = error.name === "TokenExpiredError" ? "Session expired, please log in again" : "Not authorized, please log in";
        res.json({ success: false, message });
    }
};
