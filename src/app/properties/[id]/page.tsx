import { notFound } from "next/navigation";
import { Bath, BedDouble, Car, Maximize } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { propertyCardInclude } from "@/lib/properties";
import { formatPrice, listingLabel, propertyTypeLabel } from "@/lib/utils";
import { PropertyGallery } from "@/components/property/property-gallery";
import { PropertyMap } from "@/components/property/property-map";
import { PropertyCard } from "@/components/property/property-card";
import { PropertyActions } from "@/components/property/property-actions";

export const dynamic = "force-dynamic";

export default async function PropertyDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  const property = await prisma.property.findUnique({
    where: { id },
    include: propertyCardInclude,
  });
  if (!property) notFound();

  const canView =
    property.verificationStatus === "APPROVED" ||
    session?.role === "ADMIN" ||
    session?.id === property.listedById ||
    session?.id === property.ownerId;
  if (!canView) notFound();

  const favorited = session
    ? Boolean(await prisma.favorite.findUnique({ where: { userId_propertyId: { userId: session.id, propertyId: id } } }))
    : false;

  const similar = await prisma.property.findMany({
    where: {
      id: { not: id },
      verificationStatus: "APPROVED",
      OR: [{ propertyType: property.propertyType }, { regionName: property.regionName }],
    },
    include: propertyCardInclude,
    take: 3,
  });

  await prisma.property.update({ where: { id }, data: { viewsCount: { increment: 1 } } });
  await prisma.propertyView.create({ data: { propertyId: id, userId: session?.id } });

  const agent = property.listedBy;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <PropertyGallery media={property.media} title={property.title} />
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-gold">
            {propertyTypeLabel(property.propertyType)} · {listingLabel(property.listingType)}
          </p>
          <h1 className="mt-2 font-display text-5xl">{property.title}</h1>
          <p className="mt-2 text-ink/60">
            {property.address}, {property.wardName}, {property.districtName}, {property.regionName}
          </p>
          <p className="mt-4 text-3xl font-semibold text-forest">{formatPrice(property.price, property.currency)}</p>
          <div className="mt-6 flex flex-wrap gap-6 text-ink/80">
            {property.bedrooms > 0 && <span className="flex items-center gap-2"><BedDouble /> {property.bedrooms} beds</span>}
            {property.bathrooms > 0 && <span className="flex items-center gap-2"><Bath /> {property.bathrooms} baths</span>}
            {property.parkingSpaces > 0 && <span className="flex items-center gap-2"><Car /> {property.parkingSpaces} parking</span>}
            {property.propertySize > 0 && <span className="flex items-center gap-2"><Maximize /> {property.propertySize} m²</span>}
          </div>
          <div className="prose mt-8 max-w-none text-ink/80">
            <h2 className="font-display text-3xl text-ink">About this property</h2>
            <p className="mt-3 whitespace-pre-wrap">{property.description}</p>
          </div>
          <div className="mt-8">
            <h2 className="font-display text-3xl">Amenities</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {property.amenities.map((item) => (
                <span key={item.amenity.id} className="rounded-full bg-sand px-3 py-1 text-sm">
                  {item.amenity.name}
                </span>
              ))}
            </div>
          </div>
          <div className="mt-8">
            <h2 className="font-display text-3xl">Location</h2>
            <div className="mt-4">
              <PropertyMap markers={[property]} zoom={15} className="h-[360px] overflow-hidden rounded-3xl" />
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="rounded-3xl bg-white p-6 ring-1 ring-stone">
            <p className="text-xs uppercase tracking-[0.2em] text-gold">{agent.role.toLowerCase()}</p>
            <h3 className="font-display text-3xl">
              {agent.firstName} {agent.lastName}
            </h3>
            {agent.agencyName && <p className="text-sm text-ink/60">{agent.agencyName}</p>}
            {agent.phone && <p className="mt-2 text-sm">{agent.phone}</p>}
          </div>
          <PropertyActions propertyId={property.id} agentId={agent.id} title={property.title} favorited={favorited} />
        </div>
      </div>
      {similar.length > 0 && (
        <section className="mt-16">
          <h2 className="font-display text-4xl">Similar properties</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {similar.map((item) => (
              <PropertyCard key={item.id} property={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
