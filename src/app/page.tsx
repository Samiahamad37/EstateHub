import Link from "next/link";
import { ArrowRight, Bot, CalendarCheck, MapPinned, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { propertyCardInclude } from "@/lib/properties";
import { PropertyCard } from "@/components/property/property-card";
import { SearchForm } from "@/components/property/search-form";
import { PROPERTY_TYPES } from "@/lib/constants";
import { propertyTypeLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [featured, saleCount, rentCount, agentCount] = await Promise.all([
    prisma.property.findMany({
      where: { verificationStatus: "APPROVED" },
      include: propertyCardInclude,
      orderBy: { viewsCount: "desc" },
      take: 6,
    }),
    prisma.property.count({ where: { verificationStatus: "APPROVED", listingType: "FOR_SALE" } }),
    prisma.property.count({
      where: { verificationStatus: "APPROVED", listingType: { in: ["FOR_RENT", "SHORT_TERM_RENTAL"] } },
    }),
    prisma.user.count({ where: { role: "AGENT" } }),
  ]);

  return (
    <div>
      <section className="relative overflow-hidden bg-forest text-cream">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=2000&q=80)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-forest via-forest/85 to-forest/40" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 md:py-32">
          <p className="text-sm uppercase tracking-[0.35em] text-gold">Tanzania property marketplace</p>
          <h1 className="mt-4 max-w-3xl font-display text-5xl leading-[1.05] md:text-7xl">
            Find the home that fits the life you want next.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-cream/80">
            Search verified sales, rentals, land and commercial space. Talk to agents, schedule viewings, and get AI recommendations.
          </p>
          <div className="mt-10 rounded-3xl bg-cream/95 p-4 text-ink shadow-2xl md:p-6">
            <SearchForm />
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-12 sm:px-6 md:grid-cols-3">
        {[
          { label: "Homes for sale", value: saleCount },
          { label: "Rental listings", value: rentCount },
          { label: "Active agents", value: agentCount },
        ].map((item) => (
          <div key={item.label} className="rounded-3xl bg-white p-6 ring-1 ring-stone">
            <p className="text-3xl font-semibold text-forest">{item.value}</p>
            <p className="text-sm text-ink/60">{item.label}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-gold">Featured</p>
            <h2 className="font-display text-4xl">Homes people are viewing now</h2>
          </div>
          <Link href="/properties" className="hidden items-center gap-2 text-sm font-medium text-forest md:flex">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {featured.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <h2 className="font-display text-4xl">Browse by property type</h2>
        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
          {PROPERTY_TYPES.map((type) => (
            <Link
              key={type}
              href={`/properties?type=${type}`}
              className="rounded-2xl bg-white px-4 py-5 text-sm ring-1 ring-stone hover:border-gold hover:ring-gold"
            >
              {propertyTypeLabel(type)}
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 md:grid-cols-4">
          {[
            { icon: MapPinned, title: "Search with a map", body: "Filter by type, price and amenities, then switch to map view." },
            { icon: CalendarCheck, title: "Schedule viewings", body: "Request a visit. Agents confirm, reject or complete appointments." },
            { icon: Bot, title: "Ask the AI assistant", body: "Describe the home you want in plain language and get matches." },
            { icon: ShieldCheck, title: "Verified listings", body: "Admins approve properties before they go live on the marketplace." },
          ].map((item) => (
            <div key={item.title}>
              <item.icon className="h-6 w-6 text-gold" />
              <h3 className="mt-4 font-display text-2xl">{item.title}</h3>
              <p className="mt-2 text-sm text-ink/70">{item.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
