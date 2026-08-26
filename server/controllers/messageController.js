// import Message from "../models/Message.js";
// import User from "../models/User.js";
// import cloudinary from "../lib/cloudinary.js";
// import { io, userSocketMap } from "../server.js";


// // Get All the user Except the logged in user


// export const getUsersForSidebar = async (req, res) => {

//     try {
//         const userId = req.user._id;
//         const filteredUsers = await User.find({_id: {$ne: userId}}).select("-password");
//         // res.status(200).json(filteredUsers);

//         // Count Number of Msg Not Seen :

//         const unseenMessages = {};
//         const promises = filteredUsers.map(async (user) => {
//             const messages = await Message.find({sender: user._id, receiver: userId, seen: false});

//             if(messages.length > 0){
//                 unseenMessages[user._id] = messages.length;
//             }
//         });

//         await Promise.all(promises);
//         res.json({success: true, users: filteredUsers, unseenMessages});

//     } catch (error) {
//         console.error(error.message);
//         res.json({success: false, message: error.message});
//     }

// }

// // Get all messages for selected user

// export const getMessages = async (req, res) => {
    
//     try {
//         const { id: selectedUserId } = req.params;
//         const myId = req.user._id;

//         const messages = await Message.find({
//             $or: [
//                 { senderId: myId, receiverId: selectedUserId },
//                 {senderId: selectedUserId, receiverId: myId}
//             ]
//         });

//         await Message.updateMany({senderId: selectedUserId, receiverId: myId}, {seen: true});

//         res.json({success: true, messages});
//     }
//     catch (error) {
//         console.error(error.message);
//         res.json({success: false, message: error.message}); 
//     }
// }

// // api to mark messages as seen using message id

// export const markMessagesAsSeen = async (req, res) => {

//     try {
//         const { id } = req.params; // message id

//         const message = await Message.findByIdAndUpdate(id, {seen: true});
//         res.json({success: true, message});

//     }
//     catch (error) {
//         console.error(error.message);
//         res.json({success: false, message: error.message});
//     }
// }

// // send Message to the selected user

// export const sendMessage = async (req, res) => {

//     try {
//         const { text, image } = req.body;
//         console.log("Received text:", text);
//         console.log("Received image:", image ? "YES - image exists" : "NO - no image");
//         const receiverId = req.params.id;
//         const senderId = req.user._id;

//         let imageUrl;
//         if(image){
//             console.log("Uploading to Cloudinary...");
//             const uploadResponse = await cloudinary.uploader.upload(image)
//             imageUrl = uploadResponse.secure_url; // After uploading the image to cloudinary we will get the secure_url and store it in imageUrl variable
//             console.log("Cloudinary URL:", imageUrl);
//         }

//         const newMessage = await Message.create({
//             senderId,
//             receiverId,
//             text,
//             image: imageUrl
//         });

//         // Emit the new message to the receiver using Socket.io

//         const receiverSocketId = userSocketMap[receiverId];
//         if(receiverSocketId){
//             io.to(receiverSocketId).emit("newMessage", newMessage);
//         }

//         res.json({success: true, newMessage});
//     }
//     catch (error) {
//         console.error(error.message);
//         res.json({success: false, message: error.message});
//     }
// }



import Message from "../models/Message.js";
import User from "../models/User.js";
import cloudinary from "../lib/cloudinary.js";
import { io, userSocketMap } from "../server.js";

// Get All users except the logged in user - SORTED by online status and last message
export const getUsersForSidebar = async (req, res) => {
    try {
        const userId = req.user._id;
        
        // Get all users except the logged-in user
        const allUsers = await User.find({_id: {$ne: userId}}).select("-password");
        
        // Get the last message for each user to sort by most recent activity
        const usersWithLastMessage = await Promise.all(allUsers.map(async (user) => {
            // Find the last message between current user and this user
            const lastMessage = await Message.findOne({
                $or: [
                    { senderId: userId, receiverId: user._id },
                    { senderId: user._id, receiverId: userId }
                ]
            }).sort({ createdAt: -1 }).limit(1);
            
            return {
                ...user.toObject(),
                lastMessage: lastMessage ? lastMessage.createdAt : null,
                lastMessageText: lastMessage ? lastMessage.text || '📷 Image' : null
            };
        }));
        
        // Sort users: First by online status, then by last message time (most recent first)
        const onlineUserIds = Object.keys(userSocketMap);
        
        const sortedUsers = usersWithLastMessage.sort((a, b) => {
            // First: Online users first
            const aOnline = onlineUserIds.includes(a._id.toString());
            const bOnline = onlineUserIds.includes(b._id.toString());
            
            if (aOnline && !bOnline) return -1;
            if (!aOnline && bOnline) return 1;
            
            // Second: Sort by last message time (most recent first)
            const aTime = a.lastMessage ? new Date(a.lastMessage).getTime() : 0;
            const bTime = b.lastMessage ? new Date(b.lastMessage).getTime() : 0;
            return bTime - aTime;
        });
        
        // Count unseen messages
        const unseenMessages = {};
        const promises = sortedUsers.map(async (user) => {
            const messages = await Message.find({
                senderId: user._id,
                receiverId: userId,
                seen: false
            });
            
            if (messages.length > 0) {
                unseenMessages[user._id] = messages.length;
            }
        });
        
        await Promise.all(promises);
        
        res.json({
            success: true,
            users: sortedUsers,
            unseenMessages
        });
    } catch (error) {
        console.error(error.message);
        res.json({success: false, message: error.message});
    }
};

// Get all messages for selected user
export const getMessages = async (req, res) => {
    try {
        const { id: selectedUserId } = req.params;
        const myId = req.user._id;

        const messages = await Message.find({
            $or: [
                { senderId: myId, receiverId: selectedUserId },
                { senderId: selectedUserId, receiverId: myId }
            ]
        });

        await Message.updateMany({senderId: selectedUserId, receiverId: myId}, {seen: true});

        res.json({success: true, messages});
    } catch (error) {
        console.error(error.message);
        res.json({success: false, message: error.message});
    }
};

// API to mark messages as seen using message id
export const markMessagesAsSeen = async (req, res) => {
    try {
        const { id } = req.params;
        const message = await Message.findByIdAndUpdate(id, {seen: true});
        res.json({success: true, message});
    } catch (error) {
        console.error(error.message);
        res.json({success: false, message: error.message});
    }
};

// Send message to the selected user
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
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadResponse.secure_url;
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
    } catch (error) {
        console.error(error.message);
        res.json({success: false, message: error.message});
    }
};