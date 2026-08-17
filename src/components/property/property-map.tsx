"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import type { PropertyCard } from "@/types";
import { formatCompactPrice } from "@/lib/utils";

type Marker = {
  id: string;
  latitude: number;
  longitude: number;
  title?: string;
  price?: number;
  currency?: string;
};

export function PropertyMap({
  markers,
  center,
  zoom = 12,
  className = "h-[520px] w-full overflow-hidden rounded-3xl",
}: {
  markers: Marker[] | PropertyCard[];
  center?: [number, number];
  zoom?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || !markers.length) return;
    let map: import("leaflet").Map | undefined;
    let cancelled = false;

    async function setup() {
      const L = await import("leaflet");
      if (cancelled || !ref.current) return;

      const Default = L.Icon.Default.prototype as unknown as { _getIconUrl?: string };
      delete Default._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const first = markers[0];
      map = L.map(ref.current).setView(center ?? [first.latitude, first.longitude], zoom);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap",
      }).addTo(map);

      const bounds = L.latLngBounds([]);
      for (const marker of markers) {
        const pin = L.marker([marker.latitude, marker.longitude]).addTo(map);
        const price =
          "price" in marker && marker.price
            ? `<div>${formatCompactPrice(marker.price, marker.currency || "TZS")}</div>`
            : "";
        pin.bindPopup(
          `<strong>${marker.title ?? "Property"}</strong>${price}<br/><a href="/properties/${marker.id}">View listing</a>`,
        );
        bounds.extend([marker.latitude, marker.longitude]);
      }
      if (markers.length > 1) map.fitBounds(bounds.pad(0.2));
    }

    void setup();
    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [markers, center, zoom]);

  if (!markers.length) {
    return (
      <div className={`${className} flex items-center justify-center bg-sand text-ink/60`}>
        No mapped properties for this search.
      </div>
    );
  }

  return <div ref={ref} className={className} />;
}
