import express from 'express';
import http from 'http';
import 'dotenv/config';
import cors from 'cors';
import { connectDB } from './lib/db.js';
import userRouter from './routes/userRouter.js';
import messageRouter from './routes/messageRouter.js';
import { Server } from 'socket.io';


// Create Express App abd HTTP Server

const app = express();
const server = http.createServer(app);

// Create Socket.io Server

export const io = new Server(server, {
    cors: {origin: "*"}
});

// Store online users

export const userSocketMap = {};

// Socket.io Connection

io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;
    console.log("User Connected", userId);

    if(userId){
        userSocketMap[userId] = socket.id;
    }

    // Emit the online users to all clients

    io.emit("online-users", Object.keys(userSocketMap));

    socket.on("disconnect", () => {

        console.log("User Disconnected", userId);
        delete userSocketMap[userId];
        io.emit("online-users", Object.keys(userSocketMap));

    });
});

// Middleware Setup :

app.use(express.json({limit: '4mb'}));
app.use(cors());

// Start the Server

app.use("/api/status", (req, res) => {
    res.send("Server is Running");
});

// Routes Setup :

app.use("/api/auth", userRouter);
app.use("/api/message", messageRouter);

// Connect to Database

await connectDB();


const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log("Server is Running on "+PORT);
})