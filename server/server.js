// import express from 'express';
// import http from 'http';
// import 'dotenv/config';
// import cors from 'cors';
// import { connectDB } from './lib/db.js';
// import userRouter from './routes/userRouter.js';
// import messageRouter from './routes/messageRouter.js';
// import { Server } from 'socket.io';


// // Create Express App abd HTTP Server

// const app = express();
// const server = http.createServer(app);

// // ALLOW MULTIPLE ORIGINS
// const allowedOrigins = [
//   'http://localhost:5173',  // Vite default
//   'http://localhost:3000',  // React default
//   'https://chat-app-frontend-cpsc.onrender.com'  // Your deployed frontend
// ];

// // Create Socket.io Server

// export const io = new Server(server, {
//     cors: {origin: "https://chat-app-frontend-cpsc.onrender.com"}
// });

// // Store online users

// export const userSocketMap = {};

// // Socket.io Connection

// io.on("connection", (socket) => {
//     const userId = socket.handshake.query.userId;
//     console.log("User Connected", userId);

//     if(userId){
//         userSocketMap[userId] = socket.id;
//     }

//     // Emit the online users to all clients

//     io.emit("online-users", Object.keys(userSocketMap));

//     socket.on("disconnect", () => {

//         console.log("User Disconnected", userId);
//         delete userSocketMap[userId];
//         io.emit("online-users", Object.keys(userSocketMap));

//     });
// });

// // Middleware Setup :

// app.use(express.json({limit: '4mb'}));
// app.use(cors());

// // Start the Server

// app.use("/api/status", (req, res) => {
//     res.send("Server is Running");
// });

// // Routes Setup :

// app.use("/api/auth", userRouter);
// app.use("/api/message", messageRouter);

// // Connect to Database

// await connectDB();


// const PORT = process.env.PORT || 5000;
// server.listen(PORT, () => {
//     console.log("Server is Running on "+PORT);
// })


import express from 'express';
import http from 'http';
import 'dotenv/config';
import cors from 'cors';
import { connectDB } from './lib/db.js';
import userRouter from './routes/userRouter.js';
import messageRouter from './routes/messageRouter.js';
import { Server } from 'socket.io';

// ============================================
// CREATE EXPRESS APP AND HTTP SERVER
// ============================================

const app = express();
const server = http.createServer(app);

// ============================================
// ALLOWED ORIGINS (CORS CONFIGURATION)
// ============================================

const allowedOrigins = [
  'http://localhost:5173',     // Vite default
  'http://localhost:3000',     // React default
  'http://localhost:5000',     // Local backend
  process.env.FRONTEND_URL || 'https://chat-app-frontend-cpsc.onrender.com'
];

// ============================================
// CORS MIDDLEWARE
// ============================================

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`⚠️ Blocked CORS request from: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'token'],
}));

// ============================================
// REQUEST LOGGER (FOR DEBUGGING)
// ============================================

app.use((req, res, next) => {
  console.log(`📝 ${req.method} ${req.url}`);
  next();
});

// ============================================
// SOCKET.IO CONFIGURATION
// ============================================

export const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
});

// Store online users
export const userSocketMap = {};

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  console.log(`🔌 User Connected: ${userId}`);

  if (userId) {
    userSocketMap[userId] = socket.id;
  }

  // Emit the online users to all clients
  io.emit("online-users", Object.keys(userSocketMap));

  socket.on("disconnect", () => {
    console.log(`🔌 User Disconnected: ${userId}`);
    delete userSocketMap[userId];
    io.emit("online-users", Object.keys(userSocketMap));
  });

  // Handle errors
  socket.on("error", (error) => {
    console.error(`Socket error for user ${userId}:`, error);
  });
});

// ============================================
// MIDDLEWARE
// ============================================

// Parse JSON and URL-encoded data with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================
// ROUTES
// ============================================

// Health check endpoint
app.use("/api/status", (req, res) => {
  res.json({
    success: true,
    status: "Server is Running",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    env: process.env.NODE_ENV || 'development'
  });
});

// Test endpoint for debugging
app.use("/api/test", (req, res) => {
  res.json({
    success: true,
    message: "API is working!",
    timestamp: new Date().toISOString()
  });
});

// Auth routes
app.use("/api/auth", userRouter);

// Message routes
app.use("/api/message", messageRouter);

// ============================================
// 404 HANDLER (Catch-all for undefined routes)
// ============================================

app.use((req, res) => {
  console.log(`❌ 404: ${req.method} ${req.url}`);
  res.status(404).json({
    success: false,
    message: `Route ${req.url} not found`,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// ============================================
// GLOBAL ERROR HANDLER
// ============================================

app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.stack);
  
  // Send appropriate error response
  const statusCode = err.status || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ============================================
// START SERVER
// ============================================

// Connect to MongoDB
try {
  await connectDB();
  console.log('✅ Database Connected Successfully');
} catch (error) {
  console.error('❌ Database Connection Failed:', error.message);
  process.exit(1);
}

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`\n🚀 Server is Running on Port ${PORT}`);
  console.log(`🔗 URL: http://localhost:${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`\n✅ Allowed CORS Origins:`);
  allowedOrigins.forEach(origin => console.log(`   - ${origin}`));
  console.log(`\n📡 WebSocket Server: ws://localhost:${PORT}`);
  console.log(`📡 WebSocket URL: wss://chat-app-backend-mbkp.onrender.com (Production)`);
  console.log('\n✨ Server ready for connections!\n');
});

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, closing server gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, closing server gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// ============================================
// UNHANDLED ERROR HANDLERS
// ============================================

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  // Keep server running but log the error
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // Keep server running but log the error
});