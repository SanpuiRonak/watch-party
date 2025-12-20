import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Room, VideoState } from '@/lib/types';

interface RoomState {
  currentRoom: Room | null;
  serverVideoState: VideoState | null;
  isConnected: boolean;
}

const initialState: RoomState = {
  currentRoom: null,
  serverVideoState: null,
  isConnected: false,
};

const roomSlice = createSlice({
  name: 'room',
  initialState,
  reducers: {
    setRoom: (state, action: PayloadAction<Room>) => {
      state.currentRoom = action.payload;
      state.serverVideoState = action.payload.videoState;
    },
    updateVideoState: (state, action: PayloadAction<VideoState>) => {
      state.serverVideoState = action.payload;
      if (state.currentRoom) {
        state.currentRoom.videoState = action.payload;
      }
    },
    setConnected: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
    },
    clearRoom: (state) => {
      state.currentRoom = null;
      state.serverVideoState = null;
      state.isConnected = false;
    },
  },
});

export const { setRoom, updateVideoState, setConnected, clearRoom } = roomSlice.actions;
export default roomSlice.reducer;