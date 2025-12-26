import Link from "next/link";
import { useUser } from "@/hooks/useUser";

export function WelcomeMessage() {
    const { user, isAuthenticated } = useUser();

    if (!isAuthenticated || !user) {
        return null;
    }

    return (
        <p className="text-sm text-muted-foreground">
            Welcome back,{" "}
            <Link
                href="/user"
                className="underline hover:text-foreground transition-colors"
            >
                {user.username}
            </Link>
            !
        </p>
    );
}
