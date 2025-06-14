'use client';
import React from 'react';
import { Provider as ReduxStoreProvider } from 'react-redux';

import { Provider as ChakraProvider } from '@/components/ui/provider';
import './globals.css';
import store from '@/store';

export default function RootLayout({
    children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactElement {
    return (
        <html lang='en' suppressHydrationWarning>
            <body>
                <ReduxStoreProvider store={store}>
                    <ChakraProvider>
                        {children}
                    </ChakraProvider>
                </ReduxStoreProvider>
            </body>
        </html>
    );
}
