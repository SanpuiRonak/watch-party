import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { Peer } from '@/interfaces/models';

type PeerState = Peer[];

const initialState: PeerState = [];

export const peerSlice = createSlice({
    name: 'peers',
    initialState,
    reducers: {
        addPeer: (state, action: PayloadAction<Peer>) => {
            state.push(action.payload);
        },
        removePeer: (state, action: PayloadAction<string>) => {
            state = state.filter((peer) => peer.peerId !== action.payload);
        },
        setPeers: (state, action: PayloadAction<Peer[]>) => {
            state = action.payload;
        },
        clearPeers: (state) => {
            return state;
        },
    },
});

export const { addPeer, removePeer, setPeers, clearPeers } = peerSlice.actions;
export default peerSlice.reducer;
