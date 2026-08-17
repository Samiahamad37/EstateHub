import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { listProperties } from "@/lib/properties";
import { PropertiesExplorer } from "@/components/property/properties-explorer";

export const dynamic = "force-dynamic";

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const get = (key: string) => {
    const value = sp[key];
    return Array.isArray(value) ? value[0] : value;
  };
  const num = (key: string) => {
    const value = get(key);
    return value ? Number(value) : undefined;
  };

  const [{ items, total, page, pages }, amenities] = await Promise.all([
    listProperties({
      q: get("q"),
      location: get("location"),
      type: get("type"),
      listing: get("listing"),
      minPrice: num("minPrice"),
      maxPrice: num("maxPrice"),
      bedrooms: num("bedrooms"),
      bathrooms: num("bathrooms"),
      minSize: num("minSize"),
      furnished: get("furnished"),
      amenities: get("amenities")?.split(",").filter(Boolean),
      sort: get("sort"),
      page: num("page"),
      region: get("region"),
    }),
    prisma.amenity.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <Suspense fallback={<div className="px-4 py-16">Loading properties...</div>}>
      <PropertiesExplorer
        items={JSON.parse(JSON.stringify(items))}
        total={total}
        page={page}
        pages={pages}
        amenities={amenities}
      />
    </Suspense>
  );
}
