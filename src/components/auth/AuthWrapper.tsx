"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { User } from "@/lib/types";

// TypeScript overloads for better type safety
export function AuthWrapper(props: {
    children: (user: User) => React.ReactNode;
    requireAuth: true;
    redirectTo?: string;
    loadingMessage?: string;
    showLoadingSpinner?: boolean;
}): JSX.Element;

export function AuthWrapper(props: {
    children: React.ReactNode;
    requireAuth: true;
    redirectTo?: string;
    loadingMessage?: string;
    showLoadingSpinner?: boolean;
}): JSX.Element;

export function AuthWrapper(props: {
    children: React.ReactNode;
    requireAuth?: false;
    redirectTo?: string;
    loadingMessage?: string;
    showLoadingSpinner?: boolean;
}): JSX.Element;

export function AuthWrapper({
    children,
    requireAuth = false,
    redirectTo = "/user",
    loadingMessage = "Loading...",
    showLoadingSpinner = true,
}: {
    children: React.ReactNode | ((user: User) => React.ReactNode);
    requireAuth?: boolean;
    redirectTo?: string;
    loadingMessage?: string;
    showLoadingSpinner?: boolean;
}): JSX.Element {
    const router = useRouter();
    const { user, isAuthenticated, isLoading } = useUser();

    // Handle redirects for required auth - hooks must be called in same order always
    useEffect(() => {
        if (requireAuth && !isLoading && !isAuthenticated) {
            const currentPath = window.location.pathname + window.location.search;
            router.replace(`${redirectTo}?returnUrl=${encodeURIComponent(currentPath)}`);
        }
    }, [requireAuth, isAuthenticated, isLoading, redirectTo, router]);

    // Show loading state while checking authentication
    if (isLoading && showLoadingSpinner) {
        return <LoadingSpinner message={loadingMessage} />;
    }

    // Show loading during redirect
    if (requireAuth && !isLoading && !isAuthenticated) {
        return <LoadingSpinner message="Redirecting..." />;
    }

    // When requireAuth is true, ensure user exists before rendering
    if (requireAuth && !user) {
        return <LoadingSpinner message="Loading..." />;
    }

    // Render children with type safety
    if (requireAuth && typeof children === "function") {
        return <>{children(user as User)}</>; // user is guaranteed non-null here
    }

    return <>{children}</>;
}
