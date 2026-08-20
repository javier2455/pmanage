"use client";

import dynamic from "next/dynamic";

function MapSkeleton() {
  return (
    <div className="w-full h-[500px] rounded-lg border border-border bg-muted animate-pulse" />
  );
}

export const LocationMap = dynamic(
  () => import("./location-map-impl"),
  {
    ssr: false,
    loading: () => <MapSkeleton />,
  },
);
