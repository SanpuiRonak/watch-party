import React from "react";

interface HeaderProps {
    leftAlignedComponents?: React.ReactNode[];
    rightAlignedComponents?: React.ReactNode[];
}

export function Header({ leftAlignedComponents = [], rightAlignedComponents = [] }: HeaderProps) {
    return (
        <div className="w-screen bg-neutral-100 dark:bg-neutral-900">
            <div className="px-6 py-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">{leftAlignedComponents}</div>
                    <div className="flex items-center gap-4">{rightAlignedComponents}</div>
                </div>
            </div>
        </div>
    );
}
