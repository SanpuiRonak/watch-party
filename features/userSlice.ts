import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { User } from '@/interface';
import { getUserFromDB, saveUserInDB } from '@/database/actions/userActions';

export const userSlice = createApi({
    reducerPath: 'userApi',
    baseQuery: fetchBaseQuery({ baseUrl: '/', }), // Placeholder, not used for IndexedDB
    keepUnusedDataFor: 0,
    endpoints: (builder) => ({
        getUser: builder.query<User | undefined, void>({
            queryFn: async () => {
                try {
                    const userData = await getUserFromDB();
                    return { data: userData };
                } catch (error) {
                    return { error: { status: 'FETCH_ERROR', error: String(error) } };
                }
            },
        }),
        saveUser: builder.mutation<string, User>({
            queryFn: async (user) => {
                try {
                    const encryptData = await saveUserInDB(user);
                    return { data: encryptData };
            } catch (error) {
                    return { error: { status: 'CUSTOM_ERROR', error: String(error) } };
                }
            },
        }),
    }),
});

export const { useGetUserQuery, useSaveUserMutation } = userSlice;
