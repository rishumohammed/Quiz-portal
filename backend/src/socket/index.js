import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import jwt from 'jsonwebtoken';
import messageHandler from './messageHandler.js';
import { redis } from '../db/connection.js';

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Attach Redis Adapter for multi-worker PM2 Cluster mode
  if (process.env.USE_MOCK_REDIS !== 'true' && redis) {
    try {
      const pubClient = redis.duplicate();
      const subClient = redis.duplicate();
      io.adapter(createAdapter(pubClient, subClient));
      console.log('Socket.IO Redis Adapter initialized successfully');
    } catch (err) {
      console.warn('Socket.IO Redis Adapter fallback to default memory adapter:', err.message);
    }
  }

  // Authentication Middleware for Socket.io
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error: Missing token'));
    }

    jwt.verify(token, process.env.JWT_ACCESS_SECRET, (err, decoded) => {
      if (err) {
        return next(new Error('Authentication error: Invalid token'));
      }
      socket.user = decoded;
      next();
    });
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.email} (ID: ${socket.user.id})`);

    // Join personal room for notifications
    socket.join(`user-${socket.user.id}`);

    // Register Handlers
    messageHandler(io, socket);

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.email}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};
