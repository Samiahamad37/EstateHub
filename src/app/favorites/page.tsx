"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { PropertyCard } from "@/components/property/property-card";
import type { PropertyCard as PropertyType } from "@/types";

export default function FavoritesPage() {
  const [items, setItems] = useState<PropertyType[]>([]);

  useEffect(() => {
    api<{ items: PropertyType[] }>("/api/favorites").then((d) => setItems(d.items));
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-4xl">Saved properties</h1>
      <p className="mt-2 text-ink/60">You will be notified if a saved home drops in price.</p>
      <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {items.map((property) => (
          <PropertyCard key={property.id} property={property} favorited onFavorite={(id, saved) => !saved && setItems((curr) => curr.filter((p) => p.id !== id))} />
        ))}
      </div>
      {!items.length && <p className="mt-10 text-ink/60">No saved properties yet.</p>}
    </div>
  );
}
