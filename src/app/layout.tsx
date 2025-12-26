import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ReduxProvider } from "@/components/providers/ReduxProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { Toaster } from "sonner";
import { APP_CONFIG } from "@/lib/constants";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    metadataBase: new URL(process.env.NEXT_PUBLIC_ORIGIN || "http://localhost:3000"),
    title: APP_CONFIG.name,
    description: APP_CONFIG.description,
    icons: {
        icon: `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">${APP_CONFIG.logo}</text></svg>`,
    },
    openGraph: {
        title: APP_CONFIG.name,
        description: APP_CONFIG.description,
        type: "website",
        siteName: APP_CONFIG.name,
        images: [
            {
                url: APP_CONFIG.image,
                width: 1200,
                height: 630,
                alt: APP_CONFIG.name,
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: APP_CONFIG.name,
        description: APP_CONFIG.description,
        images: [APP_CONFIG.image],
    },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={inter.className}>
                <ThemeProvider defaultTheme="dark">
                    <ReduxProvider>
                        {children}
                        <Toaster />
                    </ReduxProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
