'use client';
import { Heading, Input, Button, Field, Center, VStack, Flex, Box } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import React, { useState, useCallback } from 'react';
import { AiOutlineCloseCircle , AiOutlineVideoCameraAdd } from 'react-icons/ai';

import withAuth from '@/components/Authenticator';
import ReturnButton from '@/components/ReturnButton';
import { MINIMUM_CONTENT_WIDTH } from '@/constants/stylingConstants';
import { useGetRoomsQuery, useSaveRoomMutation } from '@/features/roomSlice';

const CreateRoomPage = (): React.ReactElement => {
    const router = useRouter();
    const [roomName, setRoomName] = useState('');
    const [streamLink, setStreamLink] = useState('');
    const [isRoomNameInvalid, setIsRoomNameInvalid] = useState(false);
    const [isStreamLinkInvalid, setIsStreamLinkInvalid] = useState(false);
    const rooms = useGetRoomsQuery();
    const [saveRoom, { isLoading }] = useSaveRoomMutation();

    const handleRoomNameChange = useCallback((event: React.ChangeEvent<HTMLInputElement>): void => {
        setRoomName(event.target.value);
        setIsRoomNameInvalid(false);
    }, []);

    const handleStreamLinkChange = useCallback((event: React.ChangeEvent<HTMLInputElement>): void => {
        setStreamLink(event.target.value);
        setIsStreamLinkInvalid(false);
    }, []);

    const handleRoomCreation = useCallback(async (): Promise<void> => {
        setIsRoomNameInvalid(false);
        setIsStreamLinkInvalid(false);

        if (!roomName.trim() || !streamLink.trim()) {
            if (!roomName.trim()) setIsRoomNameInvalid(true);
            if (!streamLink.trim()) setIsStreamLinkInvalid(true);
            return;
        }

        const room = {
            name: roomName, 
            streamLink,
            uuid: crypto.randomUUID(),
        };
        
        await saveRoom(room);

        await rooms.refetch();

        router.push(`room/${room.uuid}`);
    }, [roomName, streamLink, saveRoom, rooms, router]);

    return (
        <VStack minH='100vh'>
            <Heading size='2xl' alignSelf='flex-start' p={8}>
                Create Room
            </Heading>

            <Center flex='1' w='100vw'>
                <VStack w='25vw' minW={MINIMUM_CONTENT_WIDTH} gap={5}>
                    <Field.Root invalid={isRoomNameInvalid}>
                        <Field.Label>Room Name</Field.Label>
                        <Input
                            variant='flushed'
                            value={roomName}
                            onChange={handleRoomNameChange}
                        />
                        <Field.ErrorText><AiOutlineCloseCircle />A room name is needed!</Field.ErrorText>
                    </Field.Root>

                    <Field.Root invalid={isStreamLinkInvalid}>
                        <Field.Label>Stream URL</Field.Label>
                        <Input
                            variant='flushed'
                            value={streamLink}
                            onChange={handleStreamLinkChange}
                        />
                        <Field.ErrorText><AiOutlineCloseCircle />The stream URL is required!</Field.ErrorText>
                    </Field.Root>
                </VStack>
            </Center>

            <Box
                position='absolute'
                bottom='8'
                right={{ base: 'auto', md: '8' }}
                left={{ base: '50%', md: 'auto' }}
                transform={{ base: 'translateX(-50%)', md: 'none' }}
            >
                <Flex
                    direction={{ base: 'column', md: 'row' }}
                    gap={4}
                    align='center'
                >
                    <Button
                        colorScheme='blue'
                        minW={MINIMUM_CONTENT_WIDTH}
                        onClick={handleRoomCreation}
                        position='relative'
                        loading={isLoading}
                        loadingText='Creating room...'
                    >
                        <Box position='absolute' left='4'>
                            <AiOutlineVideoCameraAdd />
                        </Box>
                        Create Room
                    </Button>

                    <ReturnButton />
                </Flex>
            </Box>
        </VStack>
    );
};

export default withAuth(CreateRoomPage);
