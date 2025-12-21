'use client';

import { UserAvatar } from '@/components/ui/user-avatar';
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
        {room.participants.map((participant) => {
          const isOwner = participant.id === room.ownerId;
          const isCurrentUser = participant.id === currentUser.id;
          
          return (
            <div key={participant.id} className="flex items-center space-x-3">
              <UserAvatar 
                username={participant.username} 
                size="md" 
              />
              
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">
                    {participant.username}
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