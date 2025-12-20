'use client';

import { useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { socketManager } from '@/lib/socket';
import { useAppDispatch } from '@/lib/store';
import { setRoom, updateVideoState, setConnected } from '@/lib/store/slices/roomSlice';
import { Room, VideoState } from '@/lib/types';

export const useSocket = (roomId: string, userId: string) => {
  const dispatch = useAppDispatch();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = socketManager.connect();
    socketRef.current = socket;

    socket.emit('join-room', roomId, userId);

    socket.on('room-state', (room: Room) => {
      dispatch(setRoom(room));
      dispatch(setConnected(true));
    });

    socket.on('video-sync', (videoState: VideoState) => {
      dispatch(updateVideoState(videoState));
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
      socket.off('error');
      socket.off('connect');
      socket.off('disconnect');
      socket.emit('leave-room', roomId, userId);
    };
  }, [roomId, userId, dispatch]);

  const emitVideoEvent = (eventType: 'play' | 'pause' | 'seek', currentTime: number) => {
    if (socketRef.current) {
      socketRef.current.emit('video-event', roomId, eventType, currentTime);
    }
  };

  return { emitVideoEvent };
};