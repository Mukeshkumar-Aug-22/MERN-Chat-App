// import { createContext, useEffect, useState } from "react";
// import axios from "axios";
// import toast from "react-hot-toast";
// import { io } from 'socket.io-client';

// const backendUrl = import.meta.env.VITE_BACKEND_URL;
// axios.defaults.baseURL = backendUrl;

// export const AuthContext = createContext();

// export const AuthProvider = ({ children }) => {

//     const [token, setToken] = useState(localStorage.getItem("token"));
//     const [authUser, setAuthUser] = useState(null);
//     const [onlineUsers, setOnlineUsers] = useState([]);
//     const [socket, setSocket] = useState(null);

//     const checkAuth = async () => {
//         try {
//             const { data } = await axios.get("/api/auth/check-auth");
//             if(data.success){
//                 setAuthUser(data.user);
//                 connectSocket(data.user);
//             }
//         }
//         catch (error) {
//             toast.error(error.message);
//         }
//     }

//     // ORIGINAL LOGIN - WITHOUT returning a value
//     const login = async (state, credentials) => {
//         try {
//             const { data } = await axios.post(`/api/auth/${state}`, credentials);

//             if(data.success){
//                 setAuthUser(data.userData);
//                 connectSocket(data.userData);
//                 axios.defaults.headers.common["token"] = data.token;
//                 setToken(data.token);
//                 localStorage.setItem("token", data.token);
//                 toast.success(data.message);
//             }
//             else{
//                 toast.error(data.message);
//             }
//         } catch (error) {
//             toast.error(error.message);
//         }
//     }

//     const logout = async () => {
//         localStorage.removeItem("token");
//         setToken(null);
//         setAuthUser(null);
//         setOnlineUsers([]);
//         axios.defaults.headers.common["token"] = null;
//         toast.success("Logged Out Successfully");
//         socket.disconnect();
//     }

//     // ORIGINAL UPDATE PROFILE - Fixed version
//     const updateProfile = async (body) => {
//         try {
//             const { data } = await axios.put("/api/auth/update-profile", body);
//             if(data.success){
//                 setAuthUser(data.user);
//                 toast.success("Profile Updated Successfully");
//             }
//             else {
//                 toast.error(data.message || "Profile update failed");
//             }
//         } catch (error) {
//             toast.error(error.message);
//         }
//     }

//     const connectSocket = (userData) => {
//         if(!userData || socket?.connected) return;

//         const newSocket = io(backendUrl, {
//             query: {
//                 userId: userData._id,
//             }
//         });

//         newSocket.connect();
//         setSocket(newSocket);

//         newSocket.on("online-users", (userIds) => {
//             setOnlineUsers(userIds);
//         });
//     }

//     useEffect(() => {
//         if(token) {
//             axios.defaults.headers.common["token"] = token;
//         }
//         checkAuth();
//     }, []);

//     const value = {
//         axios,
//         authUser,
//         onlineUsers,
//         socket,
//         login,
//         logout,
//         updateProfile
//     }

//     return (
//         <AuthContext.Provider value={value}>
//            {children}
//         </AuthContext.Provider>
//     )
// }


import { createContext, useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { io } from 'socket.io-client';

const backendUrl = import.meta.env.VITE_BACKEND_URL;
axios.defaults.baseURL = backendUrl;

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem("token"));
    const [authUser, setAuthUser] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [socket, setSocket] = useState(null);
    const [loading, setLoading] = useState(true);

    const checkAuth = async () => {
        try {
            if (!token) {
                setLoading(false);
                return;
            }
            
            axios.defaults.headers.common["token"] = token;
            
            const { data } = await axios.get("/api/auth/check-auth");
            if (data.success) {
                setAuthUser(data.user);
                connectSocket(data.user);
            } else {
                localStorage.removeItem("token");
                setToken(null);
            }
        } catch (error) {
            console.error("Auth check failed:", error);
            localStorage.removeItem("token");
            setToken(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (state, credentials) => {
        try {
            const { data } = await axios.post(`/api/auth/${state}`, credentials);

            if (data.success) {
                setAuthUser(data.userData);
                connectSocket(data.userData);
                axios.defaults.headers.common["token"] = data.token;
                setToken(data.token);
                localStorage.setItem("token", data.token);
                toast.success(data.message);
                return true;
            } else {
                toast.error(data.message);
                return false;
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
            return false;
        }
    };

    const logout = async () => {
        localStorage.removeItem("token");
        setToken(null);
        setAuthUser(null);
        setOnlineUsers([]);
        axios.defaults.headers.common["token"] = null;
        if (socket) {
            socket.disconnect();
            setSocket(null);
        }
        toast.success("Logged Out Successfully");
    };

    const updateProfile = async (body) => {
        try {
            const { data } = await axios.put("/api/auth/update-profile", body);
            if (data.success) {
                setAuthUser(data.user);
                toast.success("Profile Updated Successfully");
                return true;
            } else {
                toast.error(data.message || "Profile update failed");
                return false;
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
            return false;
        }
    };

    const connectSocket = (userData) => {
        if (!userData || socket?.connected) return;

        const newSocket = io(backendUrl, {
            query: {
                userId: userData._id,
            },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
        });

        newSocket.connect();
        setSocket(newSocket);

        newSocket.on("online-users", (userIds) => {
            setOnlineUsers(userIds);
        });

        newSocket.on("connect_error", (error) => {
            console.error('Socket connection error:', error);
        });
    };

    useEffect(() => {
        checkAuth();
    }, []);

    const value = {
        authUser,
        onlineUsers,
        socket,
        loading,
        login,
        logout,
        updateProfile
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};