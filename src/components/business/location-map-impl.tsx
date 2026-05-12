"use client";

import { useEffect } from "react";
import type { MapMouseEvent } from "maplibre-gl";
import { MapPin } from "lucide-react";

import {
  Map,
  MapControls,
  MapMarker,
  MarkerContent,
  useMap,
} from "@/components/ui/map";

interface LocationMapProps {
  lat: number;
  lng: number;
  zoom?: number;
  readOnly?: boolean;
  onLocationChange?: (lat: number, lng: number) => void;
  className?: string;
}

function MapClickHandler({
  onLocationChange,
}: {
  onLocationChange: (lat: number, lng: number) => void;
}) {
  const { map } = useMap();

  useEffect(() => {
    if (!map) return;
    const handler = (e: MapMouseEvent) => {
      onLocationChange(e.lngLat.lat, e.lngLat.lng);
    };
    map.on("click", handler);
    return () => {
      map.off("click", handler);
    };
  }, [map, onLocationChange]);

  return null;
}

function MapRecenter({ lat, lng }: { lat: number; lng: number }) {
  const { map } = useMap();

  useEffect(() => {
    if (!map) return;
    map.flyTo({
      center: [lng, lat],
      zoom: map.getZoom(),
      animate: true,
    });
  }, [map, lat, lng]);

  return null;
}

export default function LocationMap({
  lat,
  lng,
  zoom = 15,
  readOnly = false,
  onLocationChange,
  className,
}: LocationMapProps) {
  const handleDragEnd = (lngLat: { lng: number; lat: number }) => {
    onLocationChange?.(lngLat.lat, lngLat.lng);
  };

  const handleClick = (nextLat: number, nextLng: number) => {
    onLocationChange?.(nextLat, nextLng);
  };

  return (
    <div
      className={
        className ??
        "w-full h-[500px] rounded-lg border border-border overflow-hidden"
      }
    >
      <Map
        center={[lng, lat]}
        zoom={zoom}
        dragPan={!readOnly}
        scrollZoom={!readOnly}
        doubleClickZoom={!readOnly}
        touchZoomRotate={!readOnly}
        boxZoom={!readOnly}
        keyboard={!readOnly}
        dragRotate={false}
      >
        <MapMarker
          longitude={lng}
          latitude={lat}
          draggable={!readOnly}
          anchor="bottom"
          onDragEnd={!readOnly ? handleDragEnd : undefined}
        >
          <MarkerContent>
            <MapPin
              className="size-8 fill-blue-500 stroke-white drop-shadow-md"
              strokeWidth={1.5}
            />
          </MarkerContent>
        </MapMarker>
        <MapRecenter lat={lat} lng={lng} />
        {!readOnly && onLocationChange && (
          <MapClickHandler onLocationChange={handleClick} />
        )}
        {!readOnly && <MapControls position="top-right" showZoom />}
      </Map>
    </div>
  );
}
