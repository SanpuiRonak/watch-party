/* eslint-disable jsx-a11y/media-has-caption */
'use client';
import { VStack, Heading } from '@chakra-ui/react';
import { useParams } from 'next/navigation';
import React from 'react';

import withAuth, { WithUserProp } from '@/components/Authenticator';
import useRoom from '@/hooks/useRoom';

interface RoomPageProps extends WithUserProp {}

const RoomPage = (props: RoomPageProps): React.ReactElement => {
    const params = useParams();
    const roomId = params?.roomId as string;
    const room = useRoom(props.user, roomId);

    if(!room.isRoomMetaDataAvailable(room.roomMetaData)) return <div> Loading page </div>;

    return (
        <VStack minH='100vh' gap={8}>
            <Heading size='2xl' px={8}>
                Room : {room.roomMetaData.name}
            </Heading>
            <video controls>
                <source src={room.roomMetaData.streamLink} />
            </video>

        </VStack>
    );
};

export default withAuth(RoomPage);
