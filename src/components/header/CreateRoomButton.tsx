import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/useUser";
import { UI_TEXT } from "@/lib/constants";
import { Plus } from "lucide-react";

export function CreateRoomButton() {
    const router = useRouter();
    const { isAuthenticated } = useUser();

    const handleCreateRoom = () => {
        if (!isAuthenticated) {
            // Redirect to user setup if not authenticated
            router.push("/user?returnUrl=/create-room");
            return;
        }
        router.push("/create-room");
    };

    return (
        <Button onClick={handleCreateRoom} size="sm" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            {UI_TEXT.createRoom}
        </Button>
    );
}
