'use client';

import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import React from 'react';

import {
    ColorModeProvider,
    type ColorModeProviderProps,
} from './color-mode';

export function Provider(props: ColorModeProviderProps): React.ReactElement {
    return (
        <ChakraProvider value={defaultSystem}>
            <ColorModeProvider {...props} />
        </ChakraProvider>
    );
}
