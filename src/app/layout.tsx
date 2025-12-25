import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ReduxProvider } from '@/components/providers/ReduxProvider';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Watch Party',
  description: 'Watch videos together in sync with your friends!',
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🎉</text></svg>',
  },
  openGraph: {
    title: 'Watch Party',
    description: 'Watch videos together in sync with your friends! Real-time synchronized video viewing with friends.',
    type: 'website',
    siteName: 'Watch Party',
    images: [
      {
        url: '/tada.png',
        width: 1200,
        height: 630,
        alt: 'Watch Party - Watch videos together in sync!',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Watch Party',
    description: 'Watch videos together in sync with your friends! Real-time synchronized video viewing.',
    images: ['/tada.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          defaultTheme="dark"
        >
          <ReduxProvider>
            {children}
            <Toaster />
          </ReduxProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
