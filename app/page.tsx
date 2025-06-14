/* eslint-disable jsx-a11y/media-has-caption */
'use client';
import { Button } from '@chakra-ui/react';
import { useRouter } from 'next/navigation'; // for client components
import React, { useCallback } from 'react';
import { AiOutlinePlusCircle } from 'react-icons/ai';

import withAuth from '@/components/Authenticator';
import { useGetUserQuery } from '@/features/userSlice';

// import {joinRoom} from 'trystero/torrent' // (trystero-torrent.min.js)
// import { useEffect } from "react";

const Home = (): React.ReactElement => {
    const user = useGetUserQuery();
    const router = useRouter();

    const navigateToRoomCreationPage = useCallback((): void => {
        router.push('/create-room');
    }, [router]);

    return (
        <div>
            Hello {user.data?.name}!
            <Button variant='outline' onClick={navigateToRoomCreationPage}> <AiOutlinePlusCircle />Create Room</Button>
            <video controls>
                <source src='https://upload.wikimedia.org/wikipedia/commons/transcoded/c/c0/Big_Buck_Bunny_4K.webm/Big_Buck_Bunny_4K.webm.1080p.vp9.webm' />
            </video>

        </div>
    );
};

export default withAuth(Home);
