import { NextRequest } from 'next/server';
import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { RoomManager } from '@/lib/services/roomManager';

const roomManager = new RoomManager();

// Global variable to store the Socket.IO server instance
let io: SocketIOServer;

export async function GET(req: NextRequest) {
  if (!io) {
    // Create HTTP server from Next.js server
    const httpServer = (req as any).socket?.server as HTTPServer;
    
    if (!httpServer) {
      return new Response('Socket.IO server not available', { status: 500 });
    }

    io = new SocketIOServer(httpServer, {
      path: '/api/socket',
      cors: {
        origin: process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
      },
    });

    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      socket.on('join-room', async (roomId: string, userId: string) => {
        try {
          const room = await roomManager.addParticipant(roomId, userId);
          
          if (!room) {
            socket.emit('error', 'Room not found');
            return;
          }

          socket.join(roomId);
          socket.emit('room-state', room);
          
          // Notify other participants
          socket.to(roomId).emit('participant-joined', userId);
          
          console.log(`User ${userId} joined room ${roomId}`);
        } catch (error) {
          console.error('Error joining room:', error);
          socket.emit('error', 'Failed to join room');
        }
      });

      socket.on('leave-room', async (roomId: string, userId: string) => {
        try {
          await roomManager.removeParticipant(roomId, userId);
          socket.leave(roomId);
          
          // Notify other participants
          socket.to(roomId).emit('participant-left', userId);
          
          console.log(`User ${userId} left room ${roomId}`);
        } catch (error) {
          console.error('Error leaving room:', error);
        }
      });

      socket.on('video-event', async (roomId: string, eventType: 'play' | 'pause' | 'seek', currentTime: number) => {
        try {
          const videoState = await roomManager.updateVideoState(roomId, eventType, currentTime);
          
          if (videoState) {
            // Broadcast to all clients in the room
            io.to(roomId).emit('video-sync', videoState);
            console.log(`Video ${eventType} in room ${roomId} at ${currentTime}s`);
          }
        } catch (error) {
          console.error('Error handling video event:', error);
        }
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });
  }

  return new Response('Socket.IO server initialized', { status: 200 });
}