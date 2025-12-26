import { useAppSelector } from "@/lib/store";
import { MESSAGES } from "@/lib/constants";

export function ConnectionStatus() {
    const isConnected = useAppSelector(state => state.room.isConnected);

    return (
        <div className="flex items-center space-x-2">
            <div
                className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}
            />
            <span className="text-sm text-muted-foreground">
                {isConnected ? MESSAGES.connected : MESSAGES.disconnected}
            </span>
        </div>
    );
}
