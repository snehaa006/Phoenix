import express from 'express';
import { checkAuth, login, signup, updateProfile } from '../controllers/userController.js';
import { protectRoute } from '../middleware/auth.js';

const userRouter = express.Router();

//api endpoints

userRouter.post("/signup", signup) //to create data
userRouter.post("/login", login)
userRouter.put("/update-profile", protectRoute, updateProfile); //put bcz we have to update data
userRouter.get("/check", protectRoute, checkAuth); //to get data

export default userRouter;