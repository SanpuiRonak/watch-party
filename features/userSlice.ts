import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

import { DATABASE_KEYS } from '@/constants/databaseConstants';
import { getDataFromDB, upsertDataInDB } from '@/database';
import { User } from '@/interfaces/models';

export const userSlice = createApi({
    reducerPath: 'userApi',
    baseQuery: fetchBaseQuery({ baseUrl: '/' }), // Placeholder, not used for IndexedDB
    keepUnusedDataFor: 0,
    endpoints: (builder) => ({
        getUser: builder.query<User | null, void>({
            queryFn: async () => {
                try {
                    const userData = await getDataFromDB<User>(DATABASE_KEYS.USER_DATA);
                    return { data: userData ?? null };
                } catch (error) {
                    return { error: { status: 'FETCH_ERROR', error: String(error) } };
                }
            },
        }),
        saveUser: builder.mutation<string, User>({
            queryFn: async (user) => {
                try {
                    const encryptData = await upsertDataInDB(user, DATABASE_KEYS.USER_DATA);
                    return { data: encryptData };
                } catch (error) {
                    return { error: { status: 'CUSTOM_ERROR', error: String(error) } };
                }
            },
        }),
    }),
});

export const { useGetUserQuery, useSaveUserMutation } = userSlice;
