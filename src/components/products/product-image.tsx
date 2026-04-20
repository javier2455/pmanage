"use client";

import { Package } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductImageProps {
    src?: string | null;
    alt: string;
    size?: "sm" | "md" | "lg";
    className?: string;
}

const SIZE_MAP = {
    sm: { box: "h-9 w-9", icon: "h-4 w-4" },
    md: { box: "h-16 w-16", icon: "h-6 w-6" },
    lg: { box: "h-24 w-24", icon: "h-8 w-8" },
} as const;

export function ProductImage({ src, alt, size = "sm", className }: ProductImageProps) {
    const dims = SIZE_MAP[size];

    if (src) {
        return (
            <div
                className={cn(
                    "relative shrink-0 overflow-hidden rounded-md border border-border bg-muted/30",
                    dims.box,
                    className,
                )}
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={src}
                    alt={alt}
                    className="h-full w-full object-cover"
                    loading="lazy"
                />
            </div>
        );
    }

    return (
        <div
            className={cn(
                "flex shrink-0 items-center justify-center rounded-md border border-dashed border-border bg-muted/40 text-muted-foreground",
                dims.box,
                className,
            )}
            aria-label={`Sin imagen — ${alt}`}
        >
            <Package className={dims.icon} aria-hidden />
        </div>
    );
}
