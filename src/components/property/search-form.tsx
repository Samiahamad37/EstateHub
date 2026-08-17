"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { LISTING_TYPES, PROPERTY_TYPES } from "@/lib/constants";
import { listingLabel, propertyTypeLabel } from "@/lib/utils";

export function SearchForm({ compact = false }: { compact?: boolean }) {
  return (
    <Suspense fallback={<div className="h-14 rounded-2xl bg-white/80" />}>
      <SearchFormFields compact={compact} />
    </Suspense>
  );
}

function SearchFormFields({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const params = useSearchParams();

  function submit(formData: FormData) {
    const next = new URLSearchParams();
    for (const [key, value] of formData.entries()) {
      if (String(value)) next.set(key, String(value));
    }
    router.push(`/properties?${next.toString()}`);
  }

  return (
    <form action={submit} className={compact ? "grid gap-3 md:grid-cols-6" : "grid gap-3 md:grid-cols-12"}>
      <label className={compact ? "md:col-span-2" : "md:col-span-4"}>
        <span className="sr-only">Location</span>
        <input
          name="location"
          defaultValue={params.get("location") ?? ""}
          placeholder="Dar es Salaam, Masaki, Arusha..."
          className="field"
        />
      </label>
      <select name="type" defaultValue={params.get("type") ?? ""} className="field">
        <option value="">All types</option>
        {PROPERTY_TYPES.map((type) => (
          <option key={type} value={type}>
            {propertyTypeLabel(type)}
          </option>
        ))}
      </select>
      <select name="listing" defaultValue={params.get("listing") ?? ""} className="field">
        <option value="">Sale or rent</option>
        {LISTING_TYPES.map((type) => (
          <option key={type} value={type}>
            {listingLabel(type)}
          </option>
        ))}
      </select>
      {!compact && (
        <>
          <input name="minPrice" defaultValue={params.get("minPrice") ?? ""} placeholder="Min price" className="field" />
          <input name="maxPrice" defaultValue={params.get("maxPrice") ?? ""} placeholder="Max price" className="field" />
          <select name="bedrooms" defaultValue={params.get("bedrooms") ?? ""} className="field">
            <option value="">Beds</option>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n}+ beds
              </option>
            ))}
          </select>
        </>
      )}
      <button className="btn-primary md:col-span-2">
        <Search className="h-4 w-4" />
        Search
      </button>
    </form>
  );
}
