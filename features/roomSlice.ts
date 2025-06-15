import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

import { DATABASE_KEYS } from '@/constants/databaseConstants';
import { getDataFromDB, upsertDataInDB } from '@/database';
import { RoomMetaData } from '@/interfaces/models';

// TODO rename to room metadata
export const roomSlice = createApi({
    reducerPath: 'roomApi',
    baseQuery: fetchBaseQuery({ baseUrl: '/' }), // Placeholder, not used for IndexedDB
    keepUnusedDataFor: 0,
    endpoints: (builder) => ({
        getRooms: builder.query<RoomMetaData[] | null, void>({
            queryFn: async () => {
                try {
                    const roomData = await getDataFromDB<RoomMetaData[]>(DATABASE_KEYS.ROOM_DATA);
                    return { data: roomData ?? null };
                } catch (error) {
                    return { error: { status: 'FETCH_ERROR', error: String(error) } };
                }
            },
        }),
        getRoomById: builder.query<RoomMetaData | null, string>({
            queryFn: async (roomId) => {
                try {
                    const roomData = await getDataFromDB<RoomMetaData[]>(DATABASE_KEYS.ROOM_DATA);
                    if (!roomData) return { data: null };
                    const room = roomData.find((room) => room.uuid === roomId);
                    return { data: room ?? null };
                } catch (error) {
                    return { error: { status: 'FETCH_ERROR', error: String(error) } };
                }
            },
        }),
        saveRoom: builder.mutation<string, RoomMetaData>({
            queryFn: async (room) => {
                try {
                    const existingRooms = await getDataFromDB<RoomMetaData[]>(DATABASE_KEYS.ROOM_DATA) ?? [];
                    const updatedRooms = [...existingRooms, room];
                    const encryptData = await upsertDataInDB<RoomMetaData[]>(updatedRooms, DATABASE_KEYS.ROOM_DATA);
                    return { data: encryptData };
                } catch (error) {
                    return { error: { status: 'CUSTOM_ERROR', error: String(error) } };
                }
            },
        }),
    }),
});

export const { useGetRoomsQuery, useGetRoomByIdQuery, useSaveRoomMutation } = roomSlice;
