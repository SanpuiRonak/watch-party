import { useAppSelector } from '@/lib/store';
import { Share } from 'lucide-react';
import { toast } from 'sonner';
import { MESSAGES } from '@/lib/constants';

export function RoomInfo() {
  const room = useAppSelector(state => state.room.currentRoom);

  const shareRoom = async () => {
    if (!room) return;

    const shareUrl = `${window.location.origin}/room/${room.id}`;
    await navigator.clipboard.writeText(shareUrl);
    toast.success(MESSAGES.copiedToClipboard);
  };

  if (!room) return null;

  return (
    <div
      className="flex items-center gap-2 text-muted-foreground cursor-pointer hover:bg-accent/50 transition-colors rounded-lg p-2 -m-2"
      onClick={shareRoom}
    >
      <span className="text-lg font-medium">{room.name}</span>
      <Share className="h-4 w-4" />
    </div>
  );
}
