'use client';
import { Button } from '@chakra-ui/react';
import { useRouter } from 'next/navigation'; // for client components
import React, { useCallback } from 'react';
import { AiOutlinePlusCircle } from 'react-icons/ai';

import withAuth, { WithUserProp } from '@/components/Authenticator';

interface HomePageProps extends WithUserProp {}

const HomePage = (props: HomePageProps): React.ReactElement => {
    const router = useRouter();

    const navigateToRoomCreationPage = useCallback((): void => {
        router.push('/create-room');
    }, [router]);

    return (
        <div>
            Hello {props.user.name}!
            <Button variant='outline' onClick={navigateToRoomCreationPage}> <AiOutlinePlusCircle />Create Room</Button>
        </div>
    );
};

export default withAuth(HomePage);
