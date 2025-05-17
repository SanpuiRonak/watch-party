"use client"
import { Provider as ChakraUIProvider } from "@/components/ui/provider"
import { Provider as ReduxStoreProvider } from 'react-redux'

import "./globals.css";
import store from "@/store";


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ReduxStoreProvider store={store}>
          <ChakraUIProvider>
            {children}
          </ChakraUIProvider>
        </ReduxStoreProvider>
      </body>
    </html>
  );
}
