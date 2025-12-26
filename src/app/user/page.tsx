"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/ui/user-avatar";
import { generateUsername } from "@/lib/utils/userStorage";
import { useAppDispatch } from "@/lib/store";
import { clearUser, setUser } from "@/lib/store/slices/userSlice";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { ArrowLeft, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@/hooks/useUser";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { MESSAGES, UI_TEXT } from "@/lib/constants";

export default function UserPage() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { user, isAuthenticated } = useUser();
    const [username, setUsername] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    // Initialize username on client side to prevent hydration mismatch
    useEffect(() => {
        if (isAuthenticated && user) {
            setUsername(user.username);
        } else {
            setUsername(generateUsername());
        }
    }, [isAuthenticated, user]);

    const handleRegenerateUsername = () => {
        setUsername(generateUsername());
    };

    const handleCreateUser = async() => {
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

            const data = await response.json();

            // Set user in Redux store
            dispatch(setUser(data.user));

            // Redirect to original page or home
            const returnUrl = new URLSearchParams(window.location.search).get("returnUrl") || "/";
            router.replace(returnUrl);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to create user");
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateUsername = async() => {
        const trimmedUsername = username.trim().slice(0, 50);

        if (!trimmedUsername) {
            toast.error(MESSAGES.usernameRequired);
            return;
        }

        if (trimmedUsername === user?.username) {
            toast.error("Username is the same as current");
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch("/api/auth/user", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: trimmedUsername }),
                credentials: "include",
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || "Failed to update username");
            }

            const data = await response.json();

            // Update user in Redux store
            dispatch(setUser(data.user));

            toast.success("Username updated successfully");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to update username");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteUser = async() => {
        setIsLoading(true);
        setShowDeleteDialog(false);

        try {
            const response = await fetch("/api/auth/delete-user", {
                method: "DELETE",
                credentials: "include",
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || "Failed to delete user");
            }

            // Clear user from Redux store
            dispatch(clearUser());

            toast.success("User deleted successfully");

            // Redirect to home - will redirect back to user creation since no session
            router.replace("/");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to delete user");
            setIsLoading(false);
        }
    };

    const handleGoBack = () => {
        const returnUrl = new URLSearchParams(window.location.search).get("returnUrl") || "/";
        router.push(returnUrl);
    };

    // If authenticated user, show update/delete interface
    if (isAuthenticated && user) {
        return (
            <div className="min-h-screen bg-background flex flex-col p-4">
                <div className="absolute top-6 left-6">
                    <Button variant="ghost" size="sm" onClick={handleGoBack}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                </div>
                <div className="absolute top-6 right-6">
                    <ThemeToggle />
                </div>

                {/* Top 1/3 - Title */}
                <div className="flex-1 flex items-end justify-center pb-8">
                    <div className="text-center">
                        <h1 className="text-4xl font-bold mb-4">Profile Settings</h1>
                        <p className="text-lg text-muted-foreground">{MESSAGES.updateUserPrompt}</p>
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

                        <div className="flex gap-4">
                            <Button
                                onClick={handleUpdateUsername}
                                className="flex-1"
                                disabled={isLoading || !username.trim()}
                            >
                                {isLoading ? "Updating..." : UI_TEXT.updateUsername}
                            </Button>

                            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                                <DialogTrigger asChild>
                                    <Button
                                        variant="destructive"
                                        className="flex-1"
                                        disabled={isLoading}
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        {UI_TEXT.deleteUser}
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Delete Account</DialogTitle>
                                        <DialogDescription>
                                            Are you sure you want to delete your account? This action cannot be undone and will remove all your data.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <DialogFooter>
                                        <Button
                                            variant="outline"
                                            onClick={() => setShowDeleteDialog(false)}
                                            disabled={isLoading}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            onClick={handleDeleteUser}
                                            disabled={isLoading}
                                        >
                                            {isLoading ? "Deleting..." : "Delete Account"}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>
                </div>

                {/* Bottom 1/3 - Empty */}
                <div className="flex-1" />
            </div>
        );
    }

    // Default: unauthenticated user creation flow
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
                        onClick={handleCreateUser}
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
