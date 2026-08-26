// import { createContext, useContext, useEffect, useState } from "react";
// import { AuthContext } from "./AuthContext";
// import toast from "react-hot-toast";



// export const ChatContext = createContext();

// export const ChatProvider = ({children}) => {

//     const [message, setMessage] = useState([]);
//     const [users, setUsers] = useState([]);
//     const [selectedUser, setSelectedUser] = useState(null);
//     const [unseenMessages, setUnseenMessages] = useState({});

//     const { socket, axios } = useContext(AuthContext);

//     // Function to Get List of users for the sidebar:

//     const getUsers = async () => {  
//         try {
//             const { data } = await axios.get("/api/message/users")  // We will get response from from this API Which means we will get the response data, 
//             if(data.success){                                       //  Which means we will get the response data, Let's Destructure this response data from this API End-point.
//                 setUsers(data.users);                               //   After that, when we will check the Response Data if Data.success property is True in backend,
//                 setUnseenMessages(data.unseenMessages);             // // So that we set the users data to setter function that user data we are getting from Response             
//             }                         
//         } catch (error) {
//             toast.error(error.message);
//         }
//     }


//     // Function to Get Messages from SelectedUser: 

//     const getMessage = async (userId) => {  // This function Get the userId from selected user, then only we get the messages from user 
//         try {
//             const { data } = await axios.get(`/api/message/${userId}`);  // we are getting value from this API End-Point then we destructure the response data like this: { data }
//             if(data.success){ 
//                 setMessage(data.messages || []); 
//                 // setMessage(data.message); // This Data.messages we are getting from Response 

//             }
//         } catch (error) {
//             toast.error(error.message);
//         }
//     }    


//     // function to send the Message to SelectedUser:

//     const sendMessage = async (messageData) => {
//         try {
//             const { data } = await axios.post(`/api/message/send/${selectedUser._id}`,messageData);

//             console.log("Response Data :",data);

//             if(data.success){
//                 setMessage((prevMessage) => [...prevMessage, data.newMessage]);
//             }
//             else{
//                 toast.error(data.message);
//             }
//         } catch (error) {
//             toast.error(error.message);
//         }
//     }


//     // Function to Subscribe to Message For selected User:

//     const subscribeToMessage = async () => {
//         if(!socket) return;  // The Socket is Not Connected in that case We Just return 

//         socket.on("newMessage", (newMessage) => { // Suppose The Socket when ON We get the New Message 
//             if(selectedUser && newMessage.senderId === selectedUser._id){
//                 newMessage.seen = true;  // This Method for when ChatBox is open for Seleted user, simple we are already inside the chat of selected user.
//                 setMessage((prevMessage) => [...prevMessage, newMessage]); // This will show previous chat as well with New Message.
//                 axios.put(`/api/message/mark/${newMessage._id}`);
//             }
//             else{
//                 setUnseenMessages((prevUnseenMessage) => ({  // This Method Count the unseen message with the previous if some user is not available any previous messages then count one 
//                                                              //  if it has already any messages then increment by 1 with previous 1
//                     ...prevUnseenMessage, [newMessage.senderId]: 
//                     prevUnseenMessage[newMessage.senderId] ? prevUnseenMessage[newMessage.senderId] + 1 : 1
//                 }));
//             }
//         })
//     }


//     // Function to unsubscribe from messages: 

//     const unsubscribeFromMessage = () => {
//         if(socket) socket.off("newMessage");
//     }

//     useEffect(() => {
//         subscribeToMessage();
//         return () => unsubscribeFromMessage();
//     }, [socket, selectedUser]);  // Whenever the selected user change the above function is called.

//     const value = {
//         message, users, selectedUser, getUsers, setMessage, sendMessage, getMessage,
//         setSelectedUser, unseenMessages, setUnseenMessages 
//     }
//     return(
//         <ChatContext.Provider value={value}>
//             {children}
//         </ChatContext.Provider>
//     )
// }


import { createContext, useContext, useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";

export const ChatContext = createContext();

export const ChatProvider = ({children}) => {
    const [message, setMessage] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [unseenMessages, setUnseenMessages] = useState({});

    const { socket, axios, onlineUsers } = useContext(AuthContext);

    // Function to sort users by online status and last message
    const sortUsers = (userList) => {
        const onlineUserIds = onlineUsers || [];
        
        return [...userList].sort((a, b) => {
            // First: Online users first
            const aOnline = onlineUserIds.includes(a._id);
            const bOnline = onlineUserIds.includes(b._id);
            
            if (aOnline && !bOnline) return -1;
            if (!aOnline && bOnline) return 1;
            
            // Second: Sort by last message time (most recent first)
            const aTime = a.lastMessage ? new Date(a.lastMessage).getTime() : 0;
            const bTime = b.lastMessage ? new Date(b.lastMessage).getTime() : 0;
            return bTime - aTime;
        });
    };

    const getUsers = async () => {
        try {
            const { data } = await axios.get("/api/message/users");
            if (data.success) {
                const sorted = sortUsers(data.users);
                setUsers(sorted);
                setUnseenMessages(data.unseenMessages);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    const getMessage = async (userId) => {
        try {
            const { data } = await axios.get(`/api/message/${userId}`);
            if (data.success) {
                setMessage(data.messages || []);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    const sendMessage = async (messageData) => {
        try {
            const { data } = await axios.post(`/api/message/send/${selectedUser._id}`, messageData);
            
            if (data.success) {
                setMessage((prevMessage) => [...prevMessage, data.newMessage]);
                
                // After sending message, update the lastMessage in users list
                setUsers(prevUsers => {
                    const updatedUsers = prevUsers.map(user => {
                        if (user._id === selectedUser._id) {
                            return {
                                ...user,
                                lastMessage: new Date().toISOString(),
                                lastMessageText: messageData.text || '📷 Image'
                            };
                        }
                        return user;
                    });
                    return sortUsers(updatedUsers);
                });
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    const subscribeToMessage = async () => {
        if (!socket) return;

        socket.on("newMessage", (newMessage) => {
            // Update users list with new message timestamp
            setUsers(prevUsers => {
                const updatedUsers = prevUsers.map(user => {
                    if (user._id === newMessage.senderId) {
                        return {
                            ...user,
                            lastMessage: new Date().toISOString(),
                            lastMessageText: newMessage.text || '📷 Image'
                        };
                    }
                    return user;
                });
                return sortUsers(updatedUsers);
            });

            if (selectedUser && newMessage.senderId === selectedUser._id) {
                newMessage.seen = true;
                setMessage((prevMessage) => [...prevMessage, newMessage]);
                axios.put(`/api/message/mark/${newMessage._id}`);
            } else {
                setUnseenMessages((prevUnseenMessage) => ({
                    ...prevUnseenMessage,
                    [newMessage.senderId]: prevUnseenMessage[newMessage.senderId] ? 
                        prevUnseenMessage[newMessage.senderId] + 1 : 1
                }));
            }
        });
    };

    const unsubscribeFromMessage = () => {
        if (socket) socket.off("newMessage");
    };

    useEffect(() => {
        subscribeToMessage();
        return () => unsubscribeFromMessage();
    }, [socket, selectedUser]);

    // Re-sort users when online users change
    useEffect(() => {
        if (users.length > 0) {
            setUsers(prevUsers => sortUsers(prevUsers));
        }
    }, [onlineUsers]);

    const value = {
        message,
        users,
        selectedUser,
        getUsers,
        setMessage,
        sendMessage,
        getMessage,
        setSelectedUser,
        unseenMessages,
        setUnseenMessages
    };
    
    return (
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    );
};