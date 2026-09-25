import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
    {
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User", //user model
            required: true,
        },
        recieverId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User", //user model
            required: true,
        },
        text: {
            type: String,
            trim: true,
            maxlength: 2000,
        },
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

//conversation lookups and unread counts
messageSchema.index({ senderId: 1, recieverId: 1, createdAt: 1 });
messageSchema.index({ recieverId: 1, seen: 1 });

const Message = mongoose.model("Message", messageSchema);
export default Message;
