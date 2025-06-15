import { configureStore } from '@reduxjs/toolkit';

import peerReducer from '@/features/peerSlice';
import { userSlice } from '@/features/userSlice';

import { roomSlice } from './features/roomSlice';

const store = configureStore({
    reducer: {
        [userSlice.reducerPath]: userSlice.reducer,
        [roomSlice.reducerPath]: roomSlice.reducer,
        peers: peerReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(userSlice.middleware, roomSlice.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
