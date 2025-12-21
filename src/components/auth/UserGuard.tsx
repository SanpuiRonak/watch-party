'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadUser } from '@/lib/utils/userStorage';

interface UserGuardProps {
  children: React.ReactNode;
}

export function UserGuard({ children }: UserGuardProps) {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const user = loadUser();
    if (!user) {
      const currentPath = window.location.pathname + window.location.search;
      router.push(`/user?returnUrl=${encodeURIComponent(currentPath)}`);
    }
  }, [router]);

  if (!isClient) {
    return <>{children}</>; // Render children on server
  }

  const user = loadUser();
  if (!user) {
    return null; // Prevent flash while redirecting
  }

  return <>{children}</>;
}