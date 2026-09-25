import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        email: {
            type: String, 
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        fullName: {
            type: String, 
            required: true,
            trim: true,
            maxlength: 50,
        },
        password: {
            type: String, 
            required: true,
            minlength: 6,
        },
        profilePic: {
            type: String, //url of profile picture
            default: "",
        },
        bio: {
            type: String,
            default: "",
            maxlength: 160,
        },   
    }, 
    {
        timestamps: true,
    }
)

const User = mongoose.model("User", userSchema); //user is model name
export default User;
