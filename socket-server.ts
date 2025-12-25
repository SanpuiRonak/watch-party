// Load environment variables from .env file
import 'dotenv/config';

import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';
import { RoomManager } from './src/lib/services/roomManager';
import {
  validateRoomId,
  validateUserId,
  sanitizeUsername,
  validateVideoEventType,
  validateCurrentTime,
  validatePlaybackRate,
  validatePermissions,
  secureLogger
} from './src/lib/utils/security';
import { verifyToken, JWTPayload } from './src/lib/utils/jwt';
import { socketRateLimiter, checkRateLimit } from './src/lib/middleware/rateLimiter';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.SERVER_PORT || '3000');

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    const parsedUrl = parse(req.url!, true);
    await handle(req, res, parsedUrl);
  });

  // Define allowed origins based on environment
  const ALLOWED_ORIGINS = process.env.NODE_ENV === 'production'
    ? (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean)
    : ['http://localhost:3000', 'http://127.0.0.1:3000'];

  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, etc.) in development
        if (!origin && process.env.NODE_ENV !== 'production') {
          return callback(null, true);
        }
        
        if (!origin || ALLOWED_ORIGINS.includes(origin)) {
          callback(null, true);
        } else {
          secureLogger.error('CORS blocked origin:', origin);
          callback(new Error('Not allowed by CORS'));
        }
      },
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  const roomManager = new RoomManager();
  const userRoomMap = new Map<string, { roomId: string; userId: string; username: string }>();

  io.on('connection', (socket) => {
    secureLogger.info('Client connected:', socket.id);

    // Rate limiting middleware for socket events
    socket.use(async (packet, next) => {
      try {
        const clientIp = socket.handshake.address;
        await checkRateLimit(socketRateLimiter, clientIp);
        next();
      } catch (error) {
        secureLogger.error('Rate limit exceeded for', socket.handshake.address);
        socket.emit('error', 'Rate limit exceeded. Please slow down.');
        // Don't call next() to block the event
      }
    });

    socket.on('join-room', async (roomId: unknown, userId: unknown, username: unknown) => {
      try {
        // Validate and sanitize inputs to prevent NoSQL injection and XSS
        const validRoomId = validateRoomId(roomId);
        const validUserId = validateUserId(userId);
        const validUsername = sanitizeUsername(username);

        // Check if user is already in the room to avoid duplicate joins
        const existingRoom = await roomManager.getRoom(validRoomId);
        if (existingRoom && existingRoom.participants.some(p => p.id === validUserId)) {
          // User already in room, just send current state
          socket.join(validRoomId);
          userRoomMap.set(socket.id, { roomId: validRoomId, userId: validUserId, username: validUsername });
          socket.emit('room-state', existingRoom);
          return;
        }

        const room = await roomManager.addParticipant(validRoomId, validUserId, validUsername);
        
        if (!room) {
          socket.emit('error', 'Room not found');
          return;
        }

        // Store user-room mapping for disconnect handling
        userRoomMap.set(socket.id, { roomId: validRoomId, userId: validUserId, username: validUsername });
        secureLogger.roomAction('User joined', validRoomId, validUserId);

        socket.join(validRoomId);
        
        // Send updated room state to all participants in the room
        io.to(validRoomId).emit('room-state', room);
        
      } catch (error) {
        secureLogger.error('Error joining room:', error);
        socket.emit('error', 'Failed to join room');
      }
    });

    socket.on('leave-room', async (roomId: unknown, userId: unknown, username: unknown) => {
      try {
        // Validate and sanitize inputs
        const validRoomId = validateRoomId(roomId);
        const validUserId = validateUserId(userId);
        const validUsername = sanitizeUsername(username);

        await roomManager.removeParticipant(validRoomId, validUserId);
        const updatedRoom = await roomManager.getRoom(validRoomId);
        
        socket.leave(validRoomId);
        userRoomMap.delete(socket.id);
        
        if (updatedRoom) {
          // Broadcast updated room state to remaining participants
          io.to(validRoomId).emit('room-state', updatedRoom);
        }
        
        secureLogger.roomAction('User left', validRoomId, validUserId);
      } catch (error) {
        secureLogger.error('Error leaving room:', error);
      }
    });

    socket.on('video-event', async (roomId: unknown, eventType: unknown, currentTime: unknown, userId: unknown, playbackRate?: unknown) => {
      try {
        // Validate and sanitize all inputs to prevent injection attacks
        const validRoomId = validateRoomId(roomId);
        const validEventType = validateVideoEventType(eventType);
        const validCurrentTime = validateCurrentTime(currentTime);
        const validUserId = validateUserId(userId);
        const validPlaybackRate = validatePlaybackRate(playbackRate);

        secureLogger.debug(`[SocketServer] Received video-event: ${validEventType} in room: ${validRoomId}, playbackRate: ${validPlaybackRate}`);
        
        const room = await roomManager.getRoom(validRoomId);
        if (!room) {
          secureLogger.debug(`[SocketServer] Room not found`);
          socket.emit('error', 'Room not found');
          return;
        }

        // Check permissions - owners always have full control
        const isOwner = room.ownerId === validUserId;
        secureLogger.debug(`[SocketServer] Is owner: ${isOwner}`);
        
        if (!isOwner) {
          if ((validEventType === 'play' || validEventType === 'pause') && !room.permissions.canPlay) {
            secureLogger.debug(`User denied ${validEventType} - no permission`);
            return;
          }
          if (validEventType === 'seek' && !room.permissions.canSeek) {
            secureLogger.debug(`User denied seek - no permission`);
            return;
          }
        } else {
          secureLogger.debug(`Owner performing ${validEventType} - always allowed`);
        }

        const videoState = await roomManager.updateVideoState(validRoomId, validEventType, validCurrentTime, validPlaybackRate);
        
        if (videoState) {
          io.to(validRoomId).emit('video-sync', videoState);
          secureLogger.roomAction(`Video ${validEventType} at ${validCurrentTime}s, rate ${validPlaybackRate}x`, validRoomId, validUserId);
        }
      } catch (error) {
        secureLogger.error('Error handling video event:', error);
        socket.emit('error', 'Invalid video event parameters');
      }
    });

    socket.on('permissions-update', async (roomId: unknown, permissions: unknown) => {
      try {
        // Validate and sanitize inputs
        const validRoomId = validateRoomId(roomId);
        const validPermissions = validatePermissions(permissions);

        secureLogger.debug('[SocketServer] Received permissions update for room:', validRoomId);
        const updatedRoom = await roomManager.updatePermissions(validRoomId, validPermissions);
        
        if (updatedRoom) {
          secureLogger.debug('[SocketServer] Broadcasting room-state to room');
          io.to(validRoomId).emit('room-state', updatedRoom);
          secureLogger.roomAction('Permissions updated', validRoomId);
        } else {
          secureLogger.debug('[SocketServer] Failed to update permissions - room not found');
        }
      } catch (error) {
        secureLogger.error('Error updating permissions:', error);
        socket.emit('error', 'Invalid permissions parameters');
      }
    });

    socket.on('disconnect', async () => {
      secureLogger.info('Client disconnected:', socket.id);
      
      // Handle unexpected disconnection
      const userRoom = userRoomMap.get(socket.id);
      
      if (userRoom) {
        const { roomId, userId, username } = userRoom;
        try {
          secureLogger.debug(`Removing participant from room`);
          await roomManager.removeParticipant(roomId, userId);
          const updatedRoom = await roomManager.getRoom(roomId);
          
          if (updatedRoom) {
            secureLogger.debug(`Broadcasting updated room state with ${updatedRoom.participants.length} participants`);
            // Broadcast updated room state to remaining participants
            io.to(roomId).emit('room-state', updatedRoom);
          }
          
          userRoomMap.delete(socket.id);
          secureLogger.roomAction('User disconnected', roomId, userId);
        } catch (error) {
          secureLogger.error('Error handling disconnect:', error);
        }
      }
    });
  });

  httpServer.listen(port, () => {
    secureLogger.info(`> Socket server ready on http://${hostname}:${port}`);
  });
});
