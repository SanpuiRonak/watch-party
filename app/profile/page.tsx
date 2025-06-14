'use client';
import { Heading, Input, Button, Field, Center, VStack, Flex, Box } from '@chakra-ui/react';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';
import { AiOutlineCloseCircle } from 'react-icons/ai';
import { FiSave } from 'react-icons/fi';
import { uniqueNamesGenerator, Config, colors, animals } from 'unique-names-generator';

import ReturnButton from '@/components/ReturnButton';
import { MINIMUM_CONTENT_WIDTH } from '@/constants/stylingConstants';
import { useGetUserQuery, useSaveUserMutation } from '@/features/userSlice';

const userNameGenerationConfig: Config = {
    dictionaries: [colors, animals],
    separator: ' ',
    style: 'capital',
};

const randomName: string = uniqueNamesGenerator(userNameGenerationConfig);

export default function ProfilePage(): React.ReactElement {
    const user = useGetUserQuery();
    const [saveUser, { isLoading }] = useSaveUserMutation();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [username, setUsername] = useState<string>('');
    const [isUsernameInvalid, setIsUsernameInvalid] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!user.isFetching) {
            setUsername(user.data?.name ?? randomName);
        }
    }, [user.isFetching, user.data]);

    const handleUserNameChange = React.useCallback((event: React.ChangeEvent<HTMLInputElement>): void => {
        setUsername(event.target.value);
        setIsUsernameInvalid(false);
    }, []);

    const handleUserSubmit = React.useCallback(async (): Promise<void> => {
        if (!username.trim()) {
            setIsUsernameInvalid(true);
            return;
        }

        try {
            await saveUser({
                name: username,
                uuid: user.data?.uuid ?? crypto.randomUUID(),
            });

            await user.refetch();

            const redirectTo = searchParams?.get('redirectTo') ?? '/';
            router.push(redirectTo);
        } catch (error) {
            // TODO toast handling
            console.error('Error saving user:', error);
        }
    }, [username, saveUser, user, searchParams, router]);

    const handleFocus = React.useCallback((): void => {
        if (inputRef.current) {
            const length = inputRef.current.value.length;
            inputRef.current.setSelectionRange(length, length); // Move cursor to the end
        }
    }, [inputRef]);

    return (
        <VStack minH='100vh'>
            <Heading size='2xl' alignSelf='flex-start' p={8}>
                Profile
            </Heading>

            <Center flex='1' w='100vw'>
                <VStack w='25vw' minW={MINIMUM_CONTENT_WIDTH} gap={5}>
                    <Field.Root invalid={isUsernameInvalid}>
                        <Field.Label>Username</Field.Label>
                        <Input
                            ref={inputRef}
                            variant='flushed'
                            value={username}
                            onChange={handleUserNameChange}
                            onFocus={handleFocus}
                            // eslint-disable-next-line jsx-a11y/no-autofocus
                            autoFocus
                        />
                        <Field.ErrorText><AiOutlineCloseCircle />A username is required!</Field.ErrorText>
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
                        onClick={handleUserSubmit}
                        position='relative'
                        loading={isLoading}
                        loadingText='Saving profile...'
                    >
                        <Box position='absolute' left='4'>
                            <FiSave />
                        </Box>
                        Save Profile
                    </Button>

                    <ReturnButton />
                </Flex>
            </Box>
        </VStack>
    );
}
