"use client";

import Link from "next/link";
import { Bath, BedDouble, Heart, MapPin, Maximize } from "lucide-react";
import { useState } from "react";
import { formatCompactPrice, getCoverImage, listingLabel, propertyTypeLabel } from "@/lib/utils";
import { api } from "@/lib/api";
import type { PropertyCard } from "@/types";
import { useAuth } from "@/components/providers/auth-provider";

export function PropertyCard({
  property,
  favorited = false,
  onFavorite,
}: {
  property: PropertyCard;
  favorited?: boolean;
  onFavorite?: (id: string, value: boolean) => void;
}) {
  const { user } = useAuth();
  const [saved, setSaved] = useState(favorited);
  const cover = getCoverImage(property.media);

  async function toggleFavorite(e: React.MouseEvent) {
    e.preventDefault();
    if (!user) {
      window.location.href = `/login?next=/properties/${property.id}`;
      return;
    }
    const data = await api<{ favorited: boolean }>(`/api/properties/${property.id}/favorite`, { method: "POST" });
    setSaved(data.favorited);
    onFavorite?.(property.id, data.favorited);
  }

  return (
    <Link href={`/properties/${property.id}`} className="group overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-stone/80">
      <div className="relative h-56 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={cover}
          alt={property.title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <span className="absolute left-3 top-3 rounded-full bg-forest/90 px-3 py-1 text-xs uppercase tracking-wide text-cream">
          {listingLabel(property.listingType)}
        </span>
        <button
          onClick={toggleFavorite}
          className="absolute right-3 top-3 rounded-full bg-white/90 p-2 text-forest"
          aria-label="Save property"
        >
          <Heart className={`h-4 w-4 ${saved ? "fill-coral text-coral" : ""}`} />
        </button>
      </div>
      <div className="space-y-3 p-5">
        <p className="text-xs uppercase tracking-[0.18em] text-gold">{propertyTypeLabel(property.propertyType)}</p>
        <h3 className="font-display text-2xl leading-tight text-ink">{property.title}</h3>
        <p className="flex items-center gap-1 text-sm text-ink/60">
          <MapPin className="h-4 w-4" />
          {property.wardName}, {property.districtName}
        </p>
        <p className="text-lg font-semibold text-forest">{formatCompactPrice(property.price, property.currency)}</p>
        <div className="flex gap-4 text-sm text-ink/70">
          {property.bedrooms > 0 && (
            <span className="flex items-center gap-1">
              <BedDouble className="h-4 w-4" /> {property.bedrooms}
            </span>
          )}
          {property.bathrooms > 0 && (
            <span className="flex items-center gap-1">
              <Bath className="h-4 w-4" /> {property.bathrooms}
            </span>
          )}
          {property.propertySize > 0 && (
            <span className="flex items-center gap-1">
              <Maximize className="h-4 w-4" /> {property.propertySize} m²
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
