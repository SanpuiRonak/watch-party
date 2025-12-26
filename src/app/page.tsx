"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UserSetup } from "@/components/user/UserSetup";
import { AuthWrapper } from "@/components/auth/AuthWrapper";
import { Header } from "@/components/header/Header";
import { HeaderLogo } from "@/components/header/HeaderLogo";
import { WelcomeMessage } from "@/components/header/WelcomeMessage";
import { CreateRoomButton } from "@/components/header/CreateRoomButton";
import { JoinRoomButton } from "@/components/header/JoinRoomButton";
import { RoomCard } from "@/components/room/RoomCard";
import { EmptyCardSection } from "@/components/ui/EmptyCardSection";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useUser } from "@/hooks/useUser";
import { Clock, User } from "lucide-react";
import { APP_CONFIG, MESSAGES, UI_TEXT } from "@/lib/constants";

interface Room {
    id: string;
    name: string;
    streamUrl: string;
    createdAt: number;
    accessedAt?: number;
    ownerId: string;
    ownerName: string;
}

export default function Home() {
    const router = useRouter();
    const { user, isAuthenticated } = useUser();
    const [showUserSetup, setShowUserSetup] = useState(false);
    const [pendingAction, setPendingAction] = useState<"create" | "join" | null>(null);
    const [myRooms, setMyRooms] = useState<Room[]>([]);
    const [recentRooms, setRecentRooms] = useState<Room[]>([]);
    const handleUserSetupComplete = (_user: { id: string; username: string }) => {
        // User is already set via Redux in UserSetup component
        // Cookie is set by API
        setShowUserSetup(false);

        if (pendingAction === "create") {
            router.push("/create-room");
        } else if (pendingAction === "join") {
            // TODO: Implement join room modal
            router.push("/"); // Redirect to home for now
        }
        setPendingAction(null);
    };

    // Load user's rooms from localStorage
    useEffect(() => {
        if (isAuthenticated && user) {
            const storedMyRooms = localStorage.getItem(`myRooms_${user.id}`);
            const storedRecentRooms = localStorage.getItem(`recentRooms_${user.id}`);

            if (storedMyRooms) {
                setMyRooms(JSON.parse(storedMyRooms));
            }

            if (storedRecentRooms) {
                setRecentRooms(JSON.parse(storedRecentRooms));
            }
        }
    }, [isAuthenticated, user]);

    const handleRoomsUpdate = (type: "my" | "recent", rooms: Room[]) => {
        if (type === "my") {
            setMyRooms(rooms);
        } else {
            setRecentRooms(rooms);
        }
    };

    return (
        <AuthWrapper requireAuth redirectTo="/user" loadingMessage="Loading Watch Party...">
            <main className="min-h-screen bg-background">
                {/* Header - Top 50% */}
                <div className="h-[50vh] flex flex-col px-6 py-6">
                    <div className="-mx-6 -mt-6 mb-6">
                        <Header
                            leftAlignedComponents={[<HeaderLogo key="header-logo" />]}
                            rightAlignedComponents={[
                                <WelcomeMessage key="welcome-message" />,
                                <CreateRoomButton key="create-room" />,
                                <JoinRoomButton key="join-room" />,
                                <ThemeToggle key="theme-toggle" />,
                            ]}
                        />
                    </div>
                    <div className="flex-1 flex items-center justify-center text-center">
                        <div>
                            <h2 className="text-2xl font-semibold text-muted-foreground mb-4">
                                {APP_CONFIG.description}
                            </h2>
                        </div>
                    </div>
                </div>

                {/* Room Sections - Aligned to bottom */}
                <div className="h-[50vh] flex flex-col justify-center px-6">
                    <div className="flex flex-col justify-evenly h-full py-6">
                        {isAuthenticated && (
                            <>
                                {/* My Rooms */}
                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <User className="h-5 w-5" />
                                        <h2 className="text-xl font-semibold">
                                            {UI_TEXT.roomsCreatedByMe}
                                        </h2>
                                    </div>
                                    {myRooms.length > 0 ? (
                                        <div className="flex gap-4 overflow-x-auto pb-2">
                                            {myRooms.map(room => (
                                                <RoomCard
                                                    key={room.id}
                                                    room={room}
                                                    type="my-room"
                                                    myRooms={myRooms}
                                                    recentRooms={recentRooms}
                                                    onRoomsUpdate={handleRoomsUpdate}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <EmptyCardSection
                                            icon={User}
                                            title=""
                                            description={MESSAGES.noRoomsCreated}
                                        />
                                    )}
                                </div>

                                {/* Recent Rooms */}
                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <Clock className="h-5 w-5" />
                                        <h2 className="text-xl font-semibold">
                                            {UI_TEXT.recentRooms}
                                        </h2>
                                    </div>
                                    {recentRooms.length > 0 ? (
                                        <div className="flex gap-4 overflow-x-auto pb-2">
                                            {recentRooms.slice(0, 1000).map(room => (
                                                <RoomCard
                                                    key={room.id}
                                                    room={room}
                                                    type="recent-room"
                                                    myRooms={myRooms}
                                                    recentRooms={recentRooms}
                                                    onRoomsUpdate={handleRoomsUpdate}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <EmptyCardSection
                                            icon={Clock}
                                            title=""
                                            description={MESSAGES.noRecentRooms}
                                        />
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <UserSetup open={showUserSetup} onComplete={handleUserSetupComplete} />
            </main>
        </AuthWrapper>
    );
}
