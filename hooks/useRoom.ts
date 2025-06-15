import { useCallback, useEffect, useMemo } from 'react';
import { joinRoom, selfId } from 'trystero';

import {  ROOM_CONNECTION_CONFIG } from '@/constants/appConstants';
import { addPeer, removePeer } from '@/features/peerSlice';
import { useGetRoomByIdQuery, useSaveRoomMutation } from '@/features/roomSlice';
import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks';
import { User, Peer, RoomMetaData } from '@/interfaces/models';
import { getPeerFromUser } from '@/utils/peerUtils';

const enum RoomActions {
    GET_USER_INFO = 'getUserInfo',
    GET_ROOM_INFO = 'getRoomInfo',
}

type UseRoomReturnType = {
    roomMetaData: RoomMetaData | null | undefined;
    isRoomMetaDataAvailable: (roomMetaData: RoomMetaData | null | undefined) => roomMetaData is RoomMetaData;
}

const useRoom = (user: User, roomId: string): UseRoomReturnType => {
    const peers = useAppSelector((state) => state.peers);
    const dispatch = useAppDispatch();

    const self = useMemo(() => getPeerFromUser(user, selfId), [user]);
    const getRoomId = useCallback((actionType: RoomActions) => `${roomId}:${actionType}`, [roomId]);

    const userInfoExchangeRoom = useMemo(() => joinRoom(ROOM_CONNECTION_CONFIG, getRoomId(RoomActions.GET_USER_INFO)), [getRoomId]);
    const roomMetadataExchangeRoom = useMemo(() => joinRoom(ROOM_CONNECTION_CONFIG,  getRoomId(RoomActions.GET_ROOM_INFO)), [getRoomId]);
    
    const { data: roomMetaData, isLoading ,refetch } = useGetRoomByIdQuery(roomId);
    const [saveRoom] = useSaveRoomMutation();

    const isRoomMetaDataAvailable = useCallback((roomMetaData:  RoomMetaData | null | undefined): roomMetaData is RoomMetaData => {
        if(isLoading) return false;
        if(roomMetaData === null || roomMetaData === undefined) return false;
        return true;
    }, [isLoading]);

    const isRoomOwner = useCallback((roomMetaData:  RoomMetaData | null | undefined): roomMetaData is RoomMetaData => {
        if(!isRoomMetaDataAvailable(roomMetaData)) return false;
        if(roomMetaData.ownerId !== user.uuid) return false;
        return true;
    }, [isRoomMetaDataAvailable, user.uuid]);

    const isPeerRoomOwner = useCallback((roomMetaData: RoomMetaData, peerId: string): boolean => {
        const peer = peers.find((peer) => peer.peerId == peerId);
        if (!peer) return false;
        return peer.userData.uuid === roomMetaData.ownerId;
    }, [peers]);

    // Peer info exchange
    useEffect(() => {
        const [sendUserInfo, getUserInfo] = userInfoExchangeRoom.makeAction<Peer>(RoomActions.GET_USER_INFO);

        getUserInfo((peer) => {
            dispatch(addPeer(peer));    
        });

        sendUserInfo(self);

        userInfoExchangeRoom.onPeerJoin((peerId) => {
            sendUserInfo(self, peerId);
        });

        userInfoExchangeRoom.onPeerLeave((peerId) => {
            dispatch(removePeer(peerId));
        });
    }, [userInfoExchangeRoom, self, dispatch]);

    // Room metadata sync
    useEffect(() => {
        const [sendRoomMetadata, getRoomMetadata] = roomMetadataExchangeRoom.makeAction<RoomMetaData>(RoomActions.GET_ROOM_INFO);

        getRoomMetadata(async (roomMetaData, peerId) => {
            if (isPeerRoomOwner(roomMetaData, peerId)) {
                console.log('set roomMetadata', roomMetaData);
                await saveRoom(roomMetaData);
                await refetch();
            }
        });

        if (isRoomOwner(roomMetaData)) {
            sendRoomMetadata(roomMetaData);

            roomMetadataExchangeRoom.onPeerJoin((peerId) => {
                sendRoomMetadata(roomMetaData, peerId);
            });
        }
    }, [roomMetaData, roomMetadataExchangeRoom, isRoomOwner, isPeerRoomOwner, saveRoom, refetch]);

    return { roomMetaData, isRoomMetaDataAvailable };
};

export default useRoom;
