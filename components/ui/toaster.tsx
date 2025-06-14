'use client';

import {
    Toaster as ChakraToaster,
    Portal,
    Spinner,
    Stack,
    Toast,
    createToaster,
} from '@chakra-ui/react';
import React from 'react';

export const toaster = createToaster({
    placement: 'bottom-end',
    pauseOnPageIdle: true,
});

export const Toaster = (): React.ReactElement => {
    return (
        <Portal>
            <ChakraToaster toaster={toaster} insetInline={{ mdDown: '4' }}>
                {(toast) => (
                    <Toast.Root width={{ md: 'sm' }}>
                        {toast.type === 'loading' ? (
                            <Spinner size='sm' color='blue.solid' />
                        ) : (
                            <Toast.Indicator />
                        )}
                        <Stack gap='1' flex='1' maxWidth='100%'>
                            {toast.title !== undefined && toast.title !== '' && <Toast.Title>{toast.title}</Toast.Title>}
                            {toast.description !== undefined && toast.description !== '' && (
                                <Toast.Description>{toast.description}</Toast.Description>
                            )}
                        </Stack>
                        {toast.action !== undefined && (
                            <Toast.ActionTrigger>{toast.action.label}</Toast.ActionTrigger>
                        )}
                        {toast.meta?.closable === true && <Toast.CloseTrigger />}
                    </Toast.Root>
                )}
            </ChakraToaster>
        </Portal>
    );
};
