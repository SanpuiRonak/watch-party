import React from "react";
import { LucideIcon } from "lucide-react";

interface EmptyCardSectionProps {
    icon: LucideIcon;
    title: string;
    description: string;
    className?: string;
}

export function EmptyCardSection({
    icon: Icon,
    title: _title,
    description,
    className = "",
}: EmptyCardSectionProps) {
    return (
        <div className={`flex flex-col items-center justify-center h-32 gap-3 ${className}`}>
            <Icon className="h-12 w-12 text-muted-foreground/30" />
            <p className="text-base text-muted-foreground text-center">{description}</p>
        </div>
    );
}
