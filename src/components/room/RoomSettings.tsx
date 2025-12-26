"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Gauge, Play, SkipForward } from "lucide-react";
import { useAppSelector } from "@/lib/store";
import { RoomPermissions } from "@/lib/types";

interface RoomSettingsProps {
    onUpdatePermissions: (permissions: RoomPermissions) => void;
    isOwner: boolean;
}

export function RoomSettings({ onUpdatePermissions, isOwner }: RoomSettingsProps) {
    const room = useAppSelector(state => state.room.currentRoom);

    const [canPlay, setCanPlay] = useState(room?.permissions.canPlay ?? true);
    const [canSeek, setCanSeek] = useState(room?.permissions.canSeek ?? true);
    const [canChangeSpeed, setCanChangeSpeed] = useState(room?.permissions.canChangeSpeed ?? true);
    const [hasChanges, setHasChanges] = useState(false);

    // Update local state when room permissions change via socket
    useEffect(() => {
        if (room?.permissions && !hasChanges) {
            setCanPlay(room.permissions.canPlay);
            setCanSeek(room.permissions.canSeek);
            setCanChangeSpeed(room.permissions.canChangeSpeed ?? true);
        }
    }, [room?.permissions, hasChanges]);

    useEffect(() => {
        if (room?.permissions) {
            const roomCanChangeSpeed = room.permissions.canChangeSpeed ?? true;
            const hasChangesValue =
                canPlay !== room.permissions.canPlay ||
                canSeek !== room.permissions.canSeek ||
                canChangeSpeed !== roomCanChangeSpeed;
            setHasChanges(hasChangesValue);
        }
    }, [canPlay, canSeek, canChangeSpeed, room?.permissions]);

    const handleSave = () => {
        onUpdatePermissions({ canPlay, canSeek, canChangeSpeed });
        setHasChanges(false);
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <Play className="h-4 w-4" />
                        <span>Allow viewers to play/pause</span>
                    </div>
                    <Switch
                        checked={isOwner ? canPlay : (room?.permissions.canPlay ?? true)}
                        disabled={!isOwner}
                        onCheckedChange={
                            isOwner
                                ? checked => {
                                    setCanPlay(checked);
                                }
                                : undefined
                        }
                    />
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <SkipForward className="h-4 w-4" />
                        <span>Allow viewers to seek</span>
                    </div>
                    <Switch
                        checked={isOwner ? canSeek : (room?.permissions.canSeek ?? true)}
                        disabled={!isOwner}
                        onCheckedChange={isOwner ? setCanSeek : undefined}
                    />
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <Gauge className="h-4 w-4" />
                        <span>Allow viewers to change speed</span>
                    </div>
                    <Switch
                        checked={
                            isOwner ? canChangeSpeed : (room?.permissions.canChangeSpeed ?? true)
                        }
                        disabled={!isOwner}
                        onCheckedChange={isOwner ? setCanChangeSpeed : undefined}
                    />
                </div>
            </div>

            {isOwner && (
                <div className="mt-auto pt-4">
                    <Button
                        onClick={() => {
                            handleSave();
                        }}
                        className="w-full"
                        disabled={!hasChanges}
                    >
                        Apply Changes
                    </Button>
                </div>
            )}
        </div>
    );
}
