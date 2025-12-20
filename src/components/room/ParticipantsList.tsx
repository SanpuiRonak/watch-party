'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Crown, Users } from 'lucide-react';
import { useAppSelector } from '@/lib/store';

export function ParticipantsList() {
  const room = useAppSelector(state => state.room.currentRoom);
  const currentUser = useAppSelector(state => state.user.currentUser);

  if (!room || !currentUser) return null;

  return (
    <div className="bg-card rounded-lg p-4">
      <div className="flex items-center space-x-2 mb-4">
        <Users className="h-4 w-4" />
        <h3 className="font-semibold">Participants ({room.participants.length})</h3>
      </div>
      
      <div className="space-y-2">
        {room.participants.map((participantId) => {
          const isOwner = participantId === room.ownerId;
          const isCurrentUser = participantId === currentUser.id;
          
          return (
            <div key={participantId} className="flex items-center space-x-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className={isCurrentUser ? currentUser.avatar : 'bg-gray-500'}>
                  {isCurrentUser ? currentUser.username.slice(0, 2).toUpperCase() : 'U'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">
                    {isCurrentUser ? currentUser.username : `User ${participantId.slice(0, 8)}`}
                    {isCurrentUser && ' (You)'}
                  </span>
                  {isOwner && (
                    <Crown className="h-3 w-3 text-yellow-500" />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}