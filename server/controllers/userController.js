//functions to sign up, log in, authenticate and update a user's profile
import bcrypt from "bcryptjs"
import User from "../models/User.js";
import { generateToken } from "../lib/utils.js";
import cloudinary from "../lib/cloudinary.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

//SignUp new user
export const signup = async (req, res)=>{
    const fullName = req.body.fullName?.trim();
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;
    const bio = req.body.bio?.trim() || "";

    try{
        if(!fullName || !email || !password){
            return res.json({success: false, message: "Please fill in your name, email and password"})
        }
        if(!EMAIL_REGEX.test(email)){
            return res.json({success: false, message: "Please enter a valid email address"})
        }
        if(password.length < 6){
            return res.json({success: false, message: "Password must be at least 6 characters"})
        }
        if(fullName.length > 50 || bio.length > 160){
            return res.json({success: false, message: "Name must be 50 characters or less and bio 160 or less"})
        }
        if(await User.existsByEmail(email)){
            return res.json({success: false, message: "An account with this email already exists"});
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await User.create({fullName, email, password: hashedPassword, bio});
        const token = generateToken(newUser._id);
        res.json({success: true, userData: newUser, token, message: "Account created successfully"})
    }catch(error){
        console.log(error.message);
        if(/UNIQUE/i.test(error.message)){
            return res.json({success: false, message: "An account with this email already exists"});
        }
        res.json({success: false,  message: error.message})
    }
}

//Controller to login a user
export const login = async (req, res)=> {
    try{
        const email = req.body.email?.trim().toLowerCase();
        const password = req.body.password;
        if(!email || !password){
            return res.json({success: false, message: "Please enter your email and password"})
        }
        const userData = await User.findByEmailWithPassword(email);
        //same message for unknown email and wrong password, so accounts can't be enumerated
        if(!userData || !(await bcrypt.compare(password, userData.password))){
            return res.json({success: false,  message: "Invalid email or password"})
        }
        delete userData.password;
        const token = generateToken(userData._id);
        res.json({success: true, userData, token, message: `Welcome back, ${userData.fullName.split(" ")[0]}!`}) 
    }catch(error){
        console.log(error.message);
        res.json({success: false,  message: error.message})
    }
}

//Controller to check if user is authenticated
export const checkAuth = (req, res) => {
    res.json({success: true, user: req.user});
}

//controller to update user profile details
export const updateProfile = async(req, res)=>{
    try{
        const {profilePic} = req.body;
        const fullName = req.body.fullName?.trim();
        const bio = req.body.bio?.trim() ?? "";
        const userId = req.user._id;

        if(!fullName){
            return res.json({success: false, message: "Name cannot be empty"});
        }

        if(fullName.length > 50){
            return res.json({success: false, message: "Name must be 50 characters or less"});
        }
        if(bio.length > 160){
            return res.json({success: false, message: "Bio must be 160 characters or less"});
        }

        const update = {bio, fullName};
        if(profilePic){
            const upload = await cloudinary.uploader.upload(profilePic);
            update.profilePic = upload.secure_url;
        }
        const updatedUser = await User.update(userId, update);
        res.json({success: true, user: updatedUser});

    }catch(error){
        console.log(error.message);
        res.json({success: false, message: error.message});
    }
}
