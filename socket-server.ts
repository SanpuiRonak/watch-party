import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';
import { RoomManager } from './src/lib/services/roomManager';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000');

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    const parsedUrl = parse(req.url!, true);
    await handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"]
    }
  });

  const roomManager = new RoomManager();

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

  httpServer.listen(port, () => {
    console.log(`> Socket server ready on http://${hostname}:${port}`);
  });
});