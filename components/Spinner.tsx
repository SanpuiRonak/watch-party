'use client';
import { Flex, Spinner as ChakraSpinner } from '@chakra-ui/react';
import React from 'react';

const Spinner = (): React.ReactElement => {
    return (
        <Flex
            direction='column'
            align='center'
            justify='center'
            h='100vh'
            w='100vw'
        >
            <ChakraSpinner size='xl' />
        </Flex>
    );
};

export default Spinner;
