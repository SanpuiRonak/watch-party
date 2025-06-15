'use client';
import { Button, Box } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { IoHome } from 'react-icons/io5';

import { MINIMUM_CONTENT_WIDTH } from '@/constants/stylingConstants';

const GoHomeButton = (): React.ReactElement => {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const handleReturn = React.useCallback((): void => {
        setIsLoading(true);
        router.push('/');
        setIsLoading(false);
    }, [router]);

    return (
        <Button
            variant='solid'
            minW={MINIMUM_CONTENT_WIDTH}
            onClick={handleReturn}
            loading={isLoading}
            loadingText='Returning home...'
        >
            <Box position='absolute' left='4'>
                <IoHome />
            </Box>
            Return home
        </Button>
    );
};

export default GoHomeButton;
