"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/ui/user-avatar";
import { generateUsername } from "@/lib/utils/userStorage";
import { useAppDispatch } from "@/lib/store";
import { setUser } from "@/lib/store/slices/userSlice";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { MESSAGES, UI_TEXT } from "@/lib/constants";

export default function UserPage() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const [username, setUsername] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Initialize username on client side to prevent hydration mismatch
    useEffect(() => {
        setUsername(generateUsername());
    }, []);

    const handleRegenerateUsername = () => {
        setUsername(generateUsername());
    };

    const handleComplete = async() => {
        const trimmedUsername = username.trim().slice(0, 50);

        if (!trimmedUsername) {
            toast.error(MESSAGES.usernameRequired);
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch("/api/auth/create-user", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: trimmedUsername }),
                credentials: "include", // Important for cookies
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || "Failed to create user");
            }

            const user = await response.json();

            // Set user in Redux store
            dispatch(setUser(user));

            // Redirect to original page or home
            const returnUrl = new URLSearchParams(window.location.search).get("returnUrl") || "/";
            router.replace(returnUrl);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to create user");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col p-4">
            <div className="absolute top-6 right-6">
                <ThemeToggle />
            </div>

            {/* Top 1/3 - Title */}
            <div className="flex-1 flex items-end justify-center pb-8">
                <div className="text-center">
                    <h1 className="text-4xl font-bold mb-4">{MESSAGES.welcome}</h1>
                    <p className="text-lg text-muted-foreground">{MESSAGES.createUserPrompt}</p>
                </div>
            </div>

            {/* Center - Fields */}
            <div className="flex items-start justify-center pt-8">
                <div className="w-full max-w-md space-y-6">
                    <div className="flex w-full space-x-2 items-center">
                        <div className="flex-shrink-0">
                            <UserAvatar username={username} size="lg" />
                        </div>
                        <Input
                            value={username}
                            onChange={e => setUsername(e.target.value.slice(0, 50))}
                            placeholder={UI_TEXT.usernamePlaceholder}
                            maxLength={50}
                        />
                        <Button variant="outline" size="icon" onClick={handleRegenerateUsername}>
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                    </div>

                    <Button
                        onClick={handleComplete}
                        className="w-full"
                        disabled={isLoading || !username.trim()}
                    >
                        {isLoading ? MESSAGES.creatingUser : UI_TEXT.continue}
                    </Button>
                </div>
            </div>

            {/* Bottom 1/3 - Empty */}
            <div className="flex-1" />
        </div>
    );
}
