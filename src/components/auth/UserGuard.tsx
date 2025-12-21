'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loadUser } from '@/lib/utils/userStorage';

interface UserGuardProps {
  children: React.ReactNode;
}

export function UserGuard({ children }: UserGuardProps) {
  const router = useRouter();

  useEffect(() => {
    const user = loadUser();
    if (!user) {
      router.push('/user');
    }
  }, [router]);

  const user = loadUser();
  if (!user) {
    return null; // Prevent flash while redirecting
  }

  return <>{children}</>;
}