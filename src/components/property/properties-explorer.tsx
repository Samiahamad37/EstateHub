"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { LISTING_TYPES, PROPERTY_TYPES, SORT_OPTIONS } from "@/lib/constants";
import { listingLabel, propertyTypeLabel } from "@/lib/utils";
import { PropertyCard } from "@/components/property/property-card";
import { PropertyMap } from "@/components/property/property-map";
import type { PropertyCard as PropertyCardType } from "@/types";

type Props = {
  items: PropertyCardType[];
  total: number;
  page: number;
  pages: number;
  amenities: { id: string; name: string }[];
};

export function PropertiesExplorer({ items, total, page, pages, amenities }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const view = params.get("view") === "map" ? "map" : "list";
  const [compare, setCompare] = useState<string[]>([]);

  const selectedAmenities = params.get("amenities")?.split(",").filter(Boolean) ?? [];

  function update(next: Record<string, string | null>) {
    const sp = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(next)) {
      if (!value) sp.delete(key);
      else sp.set(key, value);
    }
    if (!("page" in next)) sp.delete("page");
    router.push(`/properties?${sp.toString()}`);
  }

  function toggleAmenity(name: string) {
    const set = new Set(selectedAmenities);
    if (set.has(name)) set.delete(name);
    else set.add(name);
    update({ amenities: [...set].join(",") || null });
  }

  const queryString = useMemo(() => params.toString(), [params]);

  return (
    <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[280px_1fr]">
      <aside className="h-fit space-y-4 rounded-3xl bg-white p-5 ring-1 ring-stone">
        <h2 className="font-display text-2xl">Filters</h2>
        <input
          className="field"
          placeholder="Location or keyword"
          defaultValue={params.get("q") ?? params.get("location") ?? ""}
          onBlur={(e) => update({ q: e.target.value || null, location: e.target.value || null })}
        />
        <select className="field" value={params.get("type") ?? ""} onChange={(e) => update({ type: e.target.value || null })}>
          <option value="">Property type</option>
          {PROPERTY_TYPES.map((type) => (
            <option key={type} value={type}>
              {propertyTypeLabel(type)}
            </option>
          ))}
        </select>
        <select className="field" value={params.get("listing") ?? ""} onChange={(e) => update({ listing: e.target.value || null })}>
          <option value="">Listing type</option>
          {LISTING_TYPES.map((type) => (
            <option key={type} value={type}>
              {listingLabel(type)}
            </option>
          ))}
        </select>
        <div className="grid grid-cols-2 gap-2">
          <input className="field" placeholder="Min price" defaultValue={params.get("minPrice") ?? ""} onBlur={(e) => update({ minPrice: e.target.value || null })} />
          <input className="field" placeholder="Max price" defaultValue={params.get("maxPrice") ?? ""} onBlur={(e) => update({ maxPrice: e.target.value || null })} />
        </div>
        <select className="field" value={params.get("bedrooms") ?? ""} onChange={(e) => update({ bedrooms: e.target.value || null })}>
          <option value="">Bedrooms</option>
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <option key={n} value={n}>{n}+</option>
          ))}
        </select>
        <select className="field" value={params.get("bathrooms") ?? ""} onChange={(e) => update({ bathrooms: e.target.value || null })}>
          <option value="">Bathrooms</option>
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>{n}+</option>
          ))}
        </select>
        <input className="field" placeholder="Min size m²" defaultValue={params.get("minSize") ?? ""} onBlur={(e) => update({ minSize: e.target.value || null })} />
        <select className="field" value={params.get("furnished") ?? ""} onChange={(e) => update({ furnished: e.target.value || null })}>
          <option value="">Furnished status</option>
          <option value="FURNISHED">Furnished</option>
          <option value="SEMI_FURNISHED">Semi-furnished</option>
          <option value="UNFURNISHED">Unfurnished</option>
        </select>
        <div>
          <p className="mb-2 text-sm font-medium">Amenities</p>
          <div className="flex max-h-40 flex-col gap-1 overflow-auto text-sm">
            {amenities.map((a) => (
              <label key={a.id} className="flex items-center gap-2">
                <input type="checkbox" checked={selectedAmenities.includes(a.name)} onChange={() => toggleAmenity(a.name)} />
                {a.name}
              </label>
            ))}
          </div>
        </div>
      </aside>

      <div>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-4xl">Properties</h1>
            <p className="text-sm text-ink/60">{total} verified listings</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select className="field !w-auto" value={params.get("sort") ?? "newest"} onChange={(e) => update({ sort: e.target.value })}>
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <button className={`btn-secondary !py-2 ${view === "list" ? "!bg-forest !text-cream" : ""}`} onClick={() => update({ view: null })}>List</button>
            <button className={`btn-secondary !py-2 ${view === "map" ? "!bg-forest !text-cream" : ""}`} onClick={() => update({ view: "map" })}>Map</button>
            {compare.length > 1 && (
              <a className="btn-primary !py-2" href={`/compare?ids=${compare.join(",")}`}>Compare ({compare.length})</a>
            )}
          </div>
        </div>

        {view === "map" ? (
          <PropertyMap markers={items} />
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {items.map((property) => (
              <div key={property.id} className="relative">
                <PropertyCard property={property} />
                <label className="absolute bottom-4 left-8 flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-xs">
                  <input
                    type="checkbox"
                    checked={compare.includes(property.id)}
                    onChange={() =>
                      setCompare((curr) =>
                        curr.includes(property.id)
                          ? curr.filter((id) => id !== property.id)
                          : curr.length >= 3
                            ? curr
                            : [...curr, property.id],
                      )
                    }
                  />
                  Compare
                </label>
              </div>
            ))}
          </div>
        )}

        {pages > 1 && (
          <div className="mt-8 flex justify-center gap-2">
            {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => update({ page: String(n) })}
                className={`h-10 w-10 rounded-full ${n === page ? "bg-forest text-cream" : "bg-white ring-1 ring-stone"}`}
              >
                {n}
              </button>
            ))}
          </div>
        )}
        {!items.length && <p className="py-16 text-center text-ink/60">No properties match these filters.</p>}
        <p className="sr-only">{queryString}</p>
      </div>
    </div>
  );
}
