import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/ui/user-avatar';
import { useRouter } from 'next/navigation';
import { Share, X } from 'lucide-react';
import { MESSAGES } from '@/lib/constants';
import { toast } from 'sonner';
import { useUser } from '@/hooks/useUser';

interface Room {
  id: string;
  name: string;
  streamUrl: string;
  createdAt: number;
  accessedAt?: number;
  ownerId: string;
  ownerName: string;
}

interface RoomCardProps {
  room: Room;
  type: 'my-room' | 'recent-room';
  showDeleteButton?: boolean;
  showShareButton?: boolean;
  myRooms?: Room[];
  recentRooms?: Room[];
  onRoomsUpdate?: (type: 'my' | 'recent', rooms: Room[]) => void;
}

export function RoomCard({
  room,
  type,
  showDeleteButton = true,
  showShareButton = true,
  myRooms = [],
  recentRooms = [],
  onRoomsUpdate
}: RoomCardProps) {
  const router = useRouter();
  const { user } = useUser();
  const [showAbsoluteTime, setShowAbsoluteTime] = useState<{[key: string]: boolean}>({});

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const getTimeAgo = (timestamp: number) => {
    const now = 1700000000000; // Fixed timestamp for SSR consistency
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  const getTimestamp = () => {
    if (type === 'recent-room') {
      return room.accessedAt || room.createdAt;
    }
    return room.createdAt;
  };

  const getTimestampLabel = () => {
    if (type === 'recent-room') {
      return showAbsoluteTime[room.id]
        ? `Accessed on ${formatDate(getTimestamp())}`
        : `Accessed ${getTimeAgo(getTimestamp())}`;
    }
    return showAbsoluteTime[room.id]
      ? `Created on ${formatDate(getTimestamp())}`
      : `Created ${getTimeAgo(getTimestamp())}`;
  };

  const shareRoom = async () => {
    const shareUrl = `${window.location.origin}/room/${room.id}`;
    await navigator.clipboard.writeText(shareUrl);
    toast.success(MESSAGES.copiedToClipboard);
  };

  const deleteRoom = () => {
    if (type === 'my-room') {
      const updatedRooms = myRooms.filter(r => r.id !== room.id);
      onRoomsUpdate?.('my', updatedRooms);
      localStorage.setItem(`myRooms_${user?.id}`, JSON.stringify(updatedRooms));
    } else {
      const updatedRooms = recentRooms.filter(r => r.id !== room.id);
      onRoomsUpdate?.('recent', updatedRooms);
      localStorage.setItem(`recentRooms_${user?.id}`, JSON.stringify(updatedRooms));
    }
  };

  const toggleTimeFormat = () => {
    setShowAbsoluteTime(prev => ({
      ...prev,
      [room.id]: !prev[room.id]
    }));
  };

  return (
    <div className="relative flex-shrink-0 min-w-80 max-w-96 p-4 border rounded-lg hover:bg-muted/50 group">
      {showDeleteButton && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            deleteRoom();
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
      {showShareButton && (
        <Button
          variant="outline"
          size="sm"
          className="absolute bottom-2 right-2"
          onClick={(e) => {
            e.stopPropagation();
            shareRoom();
          }}
        >
          <Share className="h-3 w-3" />
        </Button>
      )}
      <div className="flex flex-col h-full pr-12">
        <h4
          className="font-medium break-words cursor-pointer hover:underline"
          onClick={() => router.push(`/room/${room.id}`)}
        >
          {room.name}
        </h4>
        <div className="flex items-center gap-2 mt-auto pt-2 text-xs text-muted-foreground">
          <UserAvatar username={room.ownerName} size="sm" />
          <span className="truncate">{room.ownerName}</span>
          <span className="flex-shrink-0">•</span>
          <span
            className="cursor-pointer border-b border-dotted border-muted-foreground flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              toggleTimeFormat();
            }}
          >
            {getTimestampLabel()}
          </span>
        </div>
      </div>
    </div>
  );
}
