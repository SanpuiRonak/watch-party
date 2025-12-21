'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserSetup } from '@/components/user/UserSetup';
import { useUser } from '@/hooks/useUser';

export default function UserPage() {
  const router = useRouter();
  const { createUser } = useUser();
  const [showSetup, setShowSetup] = useState(true);

  const handleComplete = (username: string) => {
    createUser(username);
    setShowSetup(false);
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome to Watch Party! 🎉</h1>
          <p className="text-muted-foreground">Create your profile to get started</p>
        </div>
        <UserSetup open={showSetup} onComplete={handleComplete} />
      </div>
    </div>
  );
}