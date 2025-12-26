'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface AuthWrapperProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
  loadingMessage?: string;
  showLoadingSpinner?: boolean;
}

export function AuthWrapper({
  children,
  requireAuth = false,
  redirectTo = '/user',
  loadingMessage = "Loading...",
  showLoadingSpinner = true
}: AuthWrapperProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useUser();

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

  return <>{children}</>;
}
