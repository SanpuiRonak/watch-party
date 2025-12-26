import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
    message?: string;
    fullScreen?: boolean;
    className?: string;
}

export function LoadingSpinner({
    message = "Loading...",
    fullScreen = true,
    className,
}: LoadingSpinnerProps) {
    const containerClasses = fullScreen
        ? "min-h-screen flex items-center justify-center"
        : "flex items-center justify-center p-4";

    return (
        <div className={cn(containerClasses, className)}>
            <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
                <p>{message}</p>
            </div>
        </div>
    );
}
