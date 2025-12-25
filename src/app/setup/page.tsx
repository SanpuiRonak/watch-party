'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { UserSetup } from '@/components/user/UserSetup';

export default function SetupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showSetup, setShowSetup] = useState(true);

  const handleComplete = (user: { id: string; username: string }) => {
    // User is set via Redux in UserSetup, cookie is set by API
    setShowSetup(false);
    
    // Redirect to return URL or home
    const returnUrl = searchParams.get('returnUrl');
    router.push(returnUrl || '/');
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
