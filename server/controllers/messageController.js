import Message from "../models/Message.js";
import User from "../models/User.js";
import cloudinary from "../lib/cloudinary.js";
import { io, userSocketMap } from "../server.js";


// Get All the user Except the logged in user


export const getUsersForSidebar = async (req, res) => {

    try {
        const userId = req.user._id;
        const filteredUsers = await User.find({_id: {$ne: userId}}).select("-password");
        // res.status(200).json(filteredUsers);

        // Count Number of Msg Not Seen :

        const unseenMessages = {};
        const promises = filteredUsers.map(async (user) => {
            const messages = await Message.find({sender: user._id, receiver: userId, seen: false});

            if(messages.length > 0){
                unseenMessages[user._id] = messages.length;
            }
        });

        await Promise.all(promises);
        res.json({success: true, users: filteredUsers, unseenMessages});

    } catch (error) {
        console.error(error.message);
        res.json({success: false, message: error.message});
    }

}

// Get all messages for selected user

export const getMessages = async (req, res) => {
    
    try {
        const { id: selectedUserId } = req.params;
        const myId = req.user._id;

        const messages = await Message.find({
            $or: [
                { senderId: myId, receiverId: selectedUserId },
                {senderId: selectedUserId, receiverId: myId}
            ]
        });

        await Message.updateMany({senderId: selectedUserId, receiverId: myId}, {seen: true});

        res.json({success: true, messages});
    }
    catch (error) {
        console.error(error.message);
        res.json({success: false, message: error.message}); 
    }
}

// api to mark messages as seen using message id

export const markMessagesAsSeen = async (req, res) => {

    try {
        const { id } = req.params; // message id

        const message = await Message.findByIdAndUpdate(id, {seen: true});
        res.json({success: true, message});

    }
    catch (error) {
        console.error(error.message);
        res.json({success: false, message: error.message});
    }
}

// send Message to the selected user

export const sendMessage = async (req, res) => {

    try {
        const { text, image } = req.body;
        console.log("Received text:", text);
        console.log("Received image:", image ? "YES - image exists" : "NO - no image");
        const receiverId = req.params.id;
        const senderId = req.user._id;

        let imageUrl;
        if(image){
            console.log("Uploading to Cloudinary...");
            const uploadResponse = await cloudinary.uploader.upload(image)
            imageUrl = uploadResponse.secure_url; // After uploading the image to cloudinary we will get the secure_url and store it in imageUrl variable
            console.log("Cloudinary URL:", imageUrl);
        }

        const newMessage = await Message.create({
            senderId,
            receiverId,
            text,
            image: imageUrl
        });

        // Emit the new message to the receiver using Socket.io

        const receiverSocketId = userSocketMap[receiverId];
        if(receiverSocketId){
            io.to(receiverSocketId).emit("newMessage", newMessage);
        }

        res.json({success: true, newMessage});
    }
    catch (error) {
        console.error(error.message);
        res.json({success: false, message: error.message});
    }
}