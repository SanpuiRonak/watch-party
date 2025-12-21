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
  const userRoomMap = new Map<string, { roomId: string; userId: string; username: string }>();

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('join-room', async (roomId: string, userId: string, username: string) => {
      try {
        // Check if user is already in the room to avoid duplicate joins
        const existingRoom = await roomManager.getRoom(roomId);
        if (existingRoom && existingRoom.participants.some(p => p.id === userId)) {
          // User already in room, just send current state
          socket.join(roomId);
          userRoomMap.set(socket.id, { roomId, userId, username });
          socket.emit('room-state', existingRoom);
          return;
        }

        const room = await roomManager.addParticipant(roomId, userId, username);
        
        if (!room) {
          socket.emit('error', 'Room not found');
          return;
        }

        // Store user-room mapping for disconnect handling
        userRoomMap.set(socket.id, { roomId, userId, username });
        console.log(`User ${username} (${userId}) joined room ${roomId}`);

        socket.join(roomId);
        
        // Send updated room state to all participants in the room
        io.to(roomId).emit('room-state', room);
        
      } catch (error) {
        console.error('Error joining room:', error);
        socket.emit('error', 'Failed to join room');
      }
    });

    socket.on('leave-room', async (roomId: string, userId: string, username: string) => {
      try {
        await roomManager.removeParticipant(roomId, userId);
        const updatedRoom = await roomManager.getRoom(roomId);
        
        socket.leave(roomId);
        userRoomMap.delete(socket.id);
        
        if (updatedRoom) {
          // Broadcast updated room state to remaining participants
          io.to(roomId).emit('room-state', updatedRoom);
        }
        
        console.log(`User ${username} (${userId}) left room ${roomId}`);
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

    socket.on('permissions-update', async (roomId: string, permissions: { canPlay: boolean; canSeek: boolean }) => {
      try {
        const updatedRoom = await roomManager.updatePermissions(roomId, permissions);
        
        if (updatedRoom) {
          io.to(roomId).emit('room-state', updatedRoom);
          console.log(`Permissions updated in room ${roomId}:`, permissions);
        }
      } catch (error) {
        console.error('Error updating permissions:', error);
      }
    });

    socket.on('disconnect', async () => {
      console.log('Client disconnected:', socket.id);
      
      // Handle unexpected disconnection
      const userRoom = userRoomMap.get(socket.id);
      
      if (userRoom) {
        const { roomId, userId, username } = userRoom;
        try {
          console.log(`Removing participant ${username} from room ${roomId}`);
          await roomManager.removeParticipant(roomId, userId);
          const updatedRoom = await roomManager.getRoom(roomId);
          
          if (updatedRoom) {
            console.log(`Broadcasting updated room state with ${updatedRoom.participants.length} participants`);
            // Broadcast updated room state to remaining participants
            io.to(roomId).emit('room-state', updatedRoom);
          }
          
          userRoomMap.delete(socket.id);
          console.log(`User ${username} (${userId}) disconnected from room ${roomId}`);
        } catch (error) {
          console.error('Error handling disconnect:', error);
        }
      }
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Socket server ready on http://${hostname}:${port}`);
  });
});