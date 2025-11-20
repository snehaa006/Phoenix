import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
    {
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User", //user model
            required: true,
        }   ,
        recieverId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User", //user model
            required: true,
        },
        text: {
            type: String,
        } ,
        image: {
            type: String,
        },
        seen: {
            type: Boolean,
            default: false,
        }
    }, 
    {
        timestamps: true,
    }
)

const Message = mongoose.model("Message", messageSchema); //user is model name
export default Message;