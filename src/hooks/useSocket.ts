'use client';

import { useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { socketManager } from '@/lib/socket';
import { useAppDispatch } from '@/lib/store';
import { setRoom, updateVideoState, setConnected } from '@/lib/store/slices/roomSlice';
import { Room, VideoState, RoomPermissions } from '@/lib/types';

export const useSocket = (roomId: string, userId: string, username: string) => {
  const dispatch = useAppDispatch();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = socketManager.connect();
    socketRef.current = socket;

    socket.emit('join-room', roomId, userId, username);

    socket.on('room-state', (room: Room) => {
      console.log('Received room state update:', room.participants.length, 'participants:', room.participants.map(p => p.username));
      console.log('Room permissions:', room.permissions);
      dispatch(setRoom(room));
      dispatch(setConnected(true));
    });

    socket.on('video-sync', (videoState: VideoState) => {
      dispatch(updateVideoState(videoState));
    });

    socket.on('participant-joined', (participant: { id: string; username: string }) => {
      console.log('Participant joined:', participant);
      // Room state will be updated by the server automatically
    });

    socket.on('participant-left', (participant: { id: string; username: string }) => {
      console.log('Participant left:', participant);
      // Room state will be updated by the server automatically
    });

    socket.on('error', (message: string) => {
      console.error('Socket error:', message);
      dispatch(setConnected(false));
    });

    socket.on('connect', () => {
      dispatch(setConnected(true));
    });

    socket.on('disconnect', () => {
      dispatch(setConnected(false));
    });

    return () => {
      socket.off('room-state');
      socket.off('video-sync');
      socket.off('participant-joined');
      socket.off('participant-left');
      socket.off('error');
      socket.off('connect');
      socket.off('disconnect');
      socket.emit('leave-room', roomId, userId, username);
    };
  }, [roomId, userId, username, dispatch]);

  const emitVideoEvent = (eventType: 'play' | 'pause' | 'seek', currentTime: number, playbackRate?: number) => {
    console.log('[useSocket] Emitting video event:', eventType, 'userId:', userId, 'playbackRate:', playbackRate);
    if (socketRef.current) {
      socketRef.current.emit('video-event', roomId, eventType, currentTime, userId, playbackRate);
    }
  };

  const emitPermissionsUpdate = (permissions: RoomPermissions) => {
    console.log('[useSocket] Emitting permissions update:', permissions);
    if (socketRef.current) {
      socketRef.current.emit('permissions-update', roomId, permissions);
    }
  };

  return { emitVideoEvent, emitPermissionsUpdate };
};