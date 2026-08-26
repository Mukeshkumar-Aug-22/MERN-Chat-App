import express from 'express';
import http from 'http';
import 'dotenv/config';
import cors from 'cors';
import { connectDB } from './lib/db.js';
import userRouter from './routes/userRouter.js';
import messageRouter from './routes/messageRouter.js';
import { Server } from 'socket.io';
import mongoose from 'mongoose';

const app = express();
const server = http.createServer(app);

// Allowed Origins
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5000',
  process.env.FRONTEND_URL || 'https://chat-app-frontend-cpsc.onrender.com'
];

// CORS Middleware
app.use(cors({
  origin: function (origin, callback) {
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

// Request Logger
app.use((req, res, next) => {
  console.log(`📝 ${req.method} ${req.url}`);
  next();
});

// Socket.io
export const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
});

export const userSocketMap = {};

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  console.log(`🔌 User Connected: ${userId}`);

  if (userId) {
    userSocketMap[userId] = socket.id;
  }

  io.emit("online-users", Object.keys(userSocketMap));

  socket.on("disconnect", () => {
    console.log(`🔌 User Disconnected: ${userId}`);
    delete userSocketMap[userId];
    io.emit("online-users", Object.keys(userSocketMap));
  });
});

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use("/api/status", (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
  res.json({
    success: true,
    status: "Server is Running",
    timestamp: new Date().toISOString(),
    mongodb: dbStatus,
    env: process.env.NODE_ENV || 'development'
  });
});

app.use("/api/auth", userRouter);
app.use("/api/message", messageRouter);

// 404 Handler
app.use((req, res) => {
  console.log(`❌ 404: ${req.method} ${req.url}`);
  res.status(404).json({
    success: false,
    message: `Route ${req.url} not found`
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// ============================================
// START SERVER - WAIT FOR DB CONNECTION
// ============================================

const startServer = async () => {
  try {
    console.log('⏳ Connecting to database...');
    
    // ✅ WAIT for database connection first
    await connectDB();
    
    console.log('✅ Database ready!');
    
    const PORT = process.env.PORT || 5000;
    
    server.listen(PORT, () => {
      console.log(`\n🚀 Server is Running on Port ${PORT}`);
      console.log(`🔗 URL: http://localhost:${PORT}`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`\n✅ Allowed CORS Origins:`);
      allowedOrigins.forEach(origin => console.log(`   - ${origin}`));
      console.log(`\n✨ Server ready for connections!\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

// Start the server
startServer();

// Graceful Shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, closing server...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, closing server...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});