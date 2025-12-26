import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useUser } from '@/hooks/useUser';
import { UI_TEXT } from '@/lib/constants';
import { Users } from 'lucide-react';

export function JoinRoomButton() {
  const router = useRouter();
  const { isAuthenticated } = useUser();

  const handleJoinRoom = () => {
    if (!isAuthenticated) {
      // Redirect to user setup if not authenticated
      router.push('/user?returnUrl=/');
      return;
    }

    const roomId = prompt('Enter Room ID:');
    if (roomId) {
      router.push(`/room/${roomId}`);
    }
  };

  return (
    <Button onClick={handleJoinRoom} variant="outline" size="sm" className="flex items-center gap-2">
      <Users className="h-4 w-4" />
      {UI_TEXT.joinRoom}
    </Button>
  );
}
