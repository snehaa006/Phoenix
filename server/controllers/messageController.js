import Message from "../models/message.js";
import cloudinary from "../lib/cloudinary.js"
import { io,userSocketMap } from "../server.js";
import User from "../models/User.js";

//Get All users except logged in users
export const getUsersForSideBar = async(req,res)=>{
    try {
        const userId = req.user._id;
        const filteredUsers = await User.find({_id: {$ne: userId}}).select("-password") //ne is not equal to

        //count no of messages not seen
        const unseenMessages = {}
        const promises = filteredUsers.map(async(user)=>{
            const messages = await Message.find({senderId: user._id, recieverId: userId, seen: false});  
            if(messages.length > 0){
                unseenMessages[user._id] = messages.length
            }
        })
        await  Promise.all(promises);
        res.json({success: true, users: filteredUsers,unseenMessages})
    } catch (error) {
        console.log(error.message);
        res.json({sucess: false, message: error.message});
    }
}

//get all messages for selected user

export const getMessages = async(req, res)=>{
    try {
        const {id: selectedUserId} = req.params; //id is stored in selecteduserid
        const myId = req.user._id;
        const messages = await Message.find({
            $or: [
                {senderId: myId, recieverId: selectedUserId},
                {senderId: selectedUserId, recieverId: myId},
            ]
        })

        await Message.updateMany({senderId: selectedUserId, recieverId: myId}, {seen: true});
        res.json({success: true, messages});
    } catch (error) {
        console.log(error.message);
        res.json({sucess: false, message: error.message});
    }
}

//api to mark message as seen using message id
export const markMessageAsSeen= async(req, res) =>{
    try {
        const {id} = req.params;
        await Message.findByIdAndUpdate(id, {seen: true});
        res.json({success: true});
    } catch (error) {
        console.log(error.message);
        res.json({sucess: false, message: error.message});
    }
}


//send message to selected user
export const sendMessage = async (req, res)=>{
    try {
        const {text, image} = req.body;
        const recieverId = req.params.id;
        const senderId = req.user._id;


        let imageUrl ;
        if(image){
            const uplaodResponse = await cloudinary.uploader.upload(image);
            imageUrl = uplaodResponse.secure_url;
        }

        const newMessage = await Message.create({
            senderId,
            recieverId,
            text, 
            image: imageUrl,
        })

        //Emit new message to reciever's socket
        const recieverSocketId = userSocketMap[recieverId]
        if(recieverSocketId){
            io.to(recieverSocketId).emit("newMessage", newMessage)
        }

        res.json({success: true, newMessage})
    } catch (error) {
        console.log(error.message);
        res.json({sucess: false, message: error.message});
    }
}