import mongoose from "mongoose";
import Message from "../models/message.js";
import cloudinary from "../lib/cloudinary.js"
import { emitToUser } from "../lib/socket.js";
import User from "../models/User.js";

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

//Get all users except the logged in one, with unread counts and the last message of each conversation
export const getUsersForSideBar = async(req,res)=>{
    try {
        const userId = req.user._id;
        const [users, conversations] = await Promise.all([
            User.find({_id: {$ne: userId}}).select("-password"),
            Message.aggregate([
                {$match: {$or: [{senderId: userId}, {recieverId: userId}]}},
                {$sort: {createdAt: -1}},
                {$group: {
                    //the "other" person in the conversation
                    _id: {$cond: [{$eq: ["$senderId", userId]}, "$recieverId", "$senderId"]},
                    lastMessage: {$first: "$$ROOT"},
                    unseen: {$sum: {$cond: [{$and: [{$eq: ["$recieverId", userId]}, {$eq: ["$seen", false]}]}, 1, 0]}},
                }},
            ]),
        ]);

        const unseenMessages = {};
        const lastMessages = {};
        for(const convo of conversations){
            if(convo.unseen > 0) unseenMessages[convo._id] = convo.unseen;
            lastMessages[convo._id] = convo.lastMessage;
        }
        res.json({success: true, users, unseenMessages, lastMessages})
    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message});
    }
}

//get all messages for selected user (and mark the ones they sent me as seen)
export const getMessages = async(req, res)=>{
    try {
        const {id: selectedUserId} = req.params;
        if(!isValidId(selectedUserId)){
            return res.json({success: false, message: "Invalid user"});
        }
        const myId = req.user._id;
        const messages = await Message.find({
            $or: [
                {senderId: myId, recieverId: selectedUserId},
                {senderId: selectedUserId, recieverId: myId},
            ]
        }).sort({createdAt: 1})

        const {modifiedCount} = await Message.updateMany({senderId: selectedUserId, recieverId: myId, seen: false}, {seen: true});
        if(modifiedCount > 0){
            //read receipts for the sender
            emitToUser(selectedUserId, "messagesSeen", {by: String(myId)});
        }
        res.json({success: true, messages});
    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message});
    }
}

//api to mark a single message as seen using message id
export const markMessageAsSeen= async(req, res) =>{
    try {
        const {id} = req.params;
        if(!isValidId(id)){
            return res.json({success: false, message: "Invalid message"});
        }
        //only the receiver can mark a message as seen
        const message = await Message.findOneAndUpdate({_id: id, recieverId: req.user._id}, {seen: true}, {new: true});
        if(message){
            emitToUser(message.senderId, "messagesSeen", {by: String(req.user._id), messageId: String(message._id)});
        }
        res.json({success: true});
    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message});
    }
}

//send message to selected user
export const sendMessage = async (req, res)=>{
    try {
        const text = req.body.text?.trim();
        const {image} = req.body;
        const recieverId = req.params.id;
        const senderId = req.user._id;

        if(!text && !image){
            return res.json({success: false, message: "Message cannot be empty"});
        }
        if(!isValidId(recieverId) || !(await User.exists({_id: recieverId}))){
            return res.json({success: false, message: "User not found"});
        }

        let imageUrl;
        if(image){
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadResponse.secure_url;
        }

        const newMessage = await Message.create({
            senderId,
            recieverId,
            text, 
            image: imageUrl,
        })

        //deliver to the receiver, and to the sender's other open tabs
        emitToUser(recieverId, "newMessage", newMessage);
        emitToUser(senderId, "newMessage", newMessage);

        res.json({success: true, newMessage})
    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message});
    }
}

//delete a message (only the sender can delete it, for everyone)
export const deleteMessage = async (req, res)=>{
    try {
        const {id} = req.params;
        if(!isValidId(id)){
            return res.json({success: false, message: "Invalid message"});
        }
        const message = await Message.findOneAndDelete({_id: id, senderId: req.user._id});
        if(!message){
            return res.json({success: false, message: "Message not found"});
        }
        const payload = {messageId: String(message._id)};
        emitToUser(message.recieverId, "messageDeleted", payload);
        emitToUser(message.senderId, "messageDeleted", payload);
        res.json({success: true, messageId: payload.messageId});
    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message});
    }
}
