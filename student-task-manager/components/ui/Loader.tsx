"use client";

import { Loader2 } from "lucide-react";

interface LoaderProps {
    message?: string;
    size?: number;
}

export const Loader = ({ message = "Loading...", size = 24 }: LoaderProps) => {
    return (
        <div className="flex flex-col items-center justify-center gap-3 p-4" role="status" aria-live="polite">
            <Loader2 className={`animate-spin text-blue-600`} size={size} />
            {message && <p className="text-sm font-medium text-gray-550">{message}</p>}
        </div>
    );
};

export const FullScreenLoader = ({ message = "Loading..." }: { message?: string }) => {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/80 backdrop-blur-sm">
            <Loader message={message} size={40} />
        </div>
    );
};
