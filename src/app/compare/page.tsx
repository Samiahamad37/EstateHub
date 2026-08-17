import { prisma } from "@/lib/prisma";
import { propertyCardInclude } from "@/lib/properties";
import { formatPrice, listingLabel } from "@/lib/utils";
import { getCoverImage } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>;
}) {
  const { ids } = await searchParams;
  const list = ids?.split(",").filter(Boolean).slice(0, 3) ?? [];
  const properties = list.length
    ? await prisma.property.findMany({
        where: { id: { in: list }, verificationStatus: "APPROVED" },
        include: propertyCardInclude,
      })
    : [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-5xl">Compare properties</h1>
      {!properties.length && <p className="mt-6 text-ink/60">Select up to three listings from search to compare them here.</p>}
      <div className="mt-8 overflow-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr>
              <th className="p-3"> </th>
              {properties.map((p) => (
                <th key={p.id} className="p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={getCoverImage(p.media)} alt="" className="mb-3 h-36 w-full rounded-2xl object-cover" />
                  {p.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              ["Price", (p: (typeof properties)[0]) => formatPrice(p.price, p.currency)],
              ["Type", (p: (typeof properties)[0]) => listingLabel(p.listingType)],
              ["Location", (p: (typeof properties)[0]) => `${p.wardName}, ${p.regionName}`],
              ["Beds", (p: (typeof properties)[0]) => String(p.bedrooms)],
              ["Baths", (p: (typeof properties)[0]) => String(p.bathrooms)],
              ["Size", (p: (typeof properties)[0]) => `${p.propertySize} m²`],
              ["Furnished", (p: (typeof properties)[0]) => p.furnished.replaceAll("_", " ")],
            ].map(([label, fn]) => (
              <tr key={String(label)} className="border-t border-stone">
                <td className="p-3 font-medium">{label as string}</td>
                {properties.map((p) => (
                  <td key={p.id} className="p-3">{(fn as (p: (typeof properties)[0]) => string)(p)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
