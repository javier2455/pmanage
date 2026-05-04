"use client";

import { useEffect, useState } from "react";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import L from "leaflet";

import "leaflet/dist/leaflet.css";

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

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
  useMapEvents({
    click: (e) => {
      onLocationChange(e.latlng.lat, e.latlng.lng);
    },
  });
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
  const [position, setPosition] = useState<[number, number]>([lat, lng]);

  useEffect(() => {
    setPosition([lat, lng]);
  }, [lat, lng]);

  const handleMarkerDragEnd = (e: L.DragEndEvent) => {
    const newPosition = e.target.getLatLng();
    setPosition([newPosition.lat, newPosition.lng]);
    onLocationChange?.(newPosition.lat, newPosition.lng);
  };

  const handleClick = (nextLat: number, nextLng: number) => {
    setPosition([nextLat, nextLng]);
    onLocationChange?.(nextLat, nextLng);
  };

  return (
    <div
      className={
        className ??
        "w-full h-[500px] rounded-lg border border-border overflow-hidden"
      }
    >
      <MapContainer
        center={position}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
        className="z-0"
        dragging={!readOnly}
        scrollWheelZoom={!readOnly}
        doubleClickZoom={!readOnly}
        zoomControl={!readOnly}
        touchZoom={!readOnly}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker
          position={position}
          draggable={!readOnly}
          eventHandlers={!readOnly ? { dragend: handleMarkerDragEnd } : undefined}
        />
        {!readOnly && onLocationChange && (
          <MapClickHandler onLocationChange={handleClick} />
        )}
      </MapContainer>
    </div>
  );
}
