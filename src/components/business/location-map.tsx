"use client";

import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";

interface LocationMapLoadingProps {
  className?: string;
}

function MapSkeleton({ className }: LocationMapLoadingProps) {
  return (
    <div
      className={cn(
        "w-full h-[500px] rounded-lg border border-border bg-muted animate-pulse",
        className,
      )}
    />
  );
}

export const LocationMap = dynamic(
  () => import("./location-map-impl"),
  {
    ssr: false,
    loading: () => <MapSkeleton />,
  },
);
