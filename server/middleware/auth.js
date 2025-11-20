import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protectRoute = async (req, res, next) => {
    try {
        const token = req.headers.token; // token from frontend

        if (!token) {
            return res.json({ success: false, message: "No token provided" });
        }

        // Decode token (no .select here)
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
        res.json({ success: false, message: error.message });
    }
};
