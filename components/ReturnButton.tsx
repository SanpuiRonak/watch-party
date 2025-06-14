'use client';
import { Button, Box } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import React from 'react';
import { HiArrowLeftCircle } from 'react-icons/hi2';

import { MINIMUM_CONTENT_WIDTH } from '@/constants/stylingConstants';

interface ReturnButtonProps {
  minWidth?: number | string;
  onClick?: () => void;
}

export default function ReturnButton({ minWidth = MINIMUM_CONTENT_WIDTH, onClick }: ReturnButtonProps): React.ReactElement {
    const router = useRouter();

    const handleReturn = React.useCallback((): void => {
        if (onClick) {
            onClick();
        } else {
            router.back();
        }
    }, [onClick, router]);

    return (
        <Button
            variant='outline'
            minW={minWidth}
            onClick={handleReturn}
        >
            <Box position='absolute' left='4'>
                <HiArrowLeftCircle />
            </Box>
            Return
        </Button>
    );
}
