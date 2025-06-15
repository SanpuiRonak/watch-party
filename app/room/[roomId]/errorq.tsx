'use client';
import { VStack, Heading } from '@chakra-ui/react';
import React from 'react';

import GoHomeButton from '@/components/GoHomeButton';
import SadCatImage from '@/components/SadCatImage';

const RoomErrorPage = (): React.ReactElement => {
    return (
        <VStack h='100vh' gap={8} justify='center' align='center'>
            <Heading size='3xl' >
                {/* TODO fix padding issue on small screens */}
                <VStack>
                    Oops! This room could not be found!
                    <Heading size='xl'>
                        Here is a cat to accompany you instead.
                    </Heading>
                </VStack>
            </Heading>
            <SadCatImage  />
            <GoHomeButton />
        </VStack>
    );
};

export default RoomErrorPage;
