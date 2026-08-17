"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { FURNISHED_STATUSES, LISTING_TYPES, PROPERTY_TYPES } from "@/lib/constants";
import { listingLabel, propertyTypeLabel } from "@/lib/utils";

type Meta = {
  amenities: { id: string; name: string }[];
  regions: { id: string; name: string; districts: { id: string; name: string; wards: { id: string; name: string }[] }[] }[];
  categories: { id: string; name: string }[];
};

const empty = {
  title: "",
  description: "",
  propertyType: "HOUSE",
  listingType: "FOR_SALE",
  price: "",
  currency: "TZS",
  address: "",
  regionName: "Dar es Salaam",
  districtName: "Kinondoni",
  wardName: "",
  latitude: "-6.792",
  longitude: "39.208",
  bedrooms: "3",
  bathrooms: "2",
  parkingSpaces: "2",
  propertySize: "150",
  landSize: "0",
  yearBuilt: "2020",
  furnished: "UNFURNISHED",
  videoUrl: "",
};

export function PropertyForm({ propertyId }: { propertyId?: string }) {
  const router = useRouter();
  const [form, setForm] = useState(empty);
  const [amenityIds, setAmenityIds] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<Meta>("/api/meta").then(setMeta);
  }, []);

  useEffect(() => {
    if (!propertyId) return;
    api<{ property: Record<string, unknown> & { amenities: { amenity?: { id: string }; amenityId?: string }[]; media: { url: string }[]; price: number } }>(`/api/properties/${propertyId}`)
      .then(({ property }) => {
        setForm({
          ...empty,
          title: String(property.title ?? ""),
          description: String(property.description ?? ""),
          propertyType: String(property.propertyType ?? "HOUSE"),
          listingType: String(property.listingType ?? "FOR_SALE"),
          price: String(property.price),
          currency: String(property.currency ?? "TZS"),
          address: String(property.address ?? ""),
          regionName: String(property.regionName ?? ""),
          districtName: String(property.districtName ?? ""),
          wardName: String(property.wardName ?? ""),
          latitude: String(property.latitude ?? ""),
          longitude: String(property.longitude ?? ""),
          bedrooms: String(property.bedrooms ?? 0),
          bathrooms: String(property.bathrooms ?? 0),
          parkingSpaces: String(property.parkingSpaces ?? 0),
          propertySize: String(property.propertySize ?? 0),
          landSize: String(property.landSize ?? 0),
          yearBuilt: String(property.yearBuilt ?? ""),
          furnished: String(property.furnished ?? "UNFURNISHED"),
          videoUrl: String(property.videoUrl ?? ""),
        });
        setAmenityIds(property.amenities.map((a) => a.amenity?.id ?? a.amenityId ?? "").filter(Boolean));
        setImages(property.media.map((m) => m.url));
      })
      .catch(() => undefined);
  }, [propertyId]);

  function set<K extends keyof typeof empty>(key: K, value: string) {
    setForm((curr) => ({ ...curr, [key]: value }));
  }

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    const body = new FormData();
    for (const file of Array.from(files)) body.append("files", file);
    const data = await api<{ urls: string[] }>("/api/upload", { method: "POST", body });
    setImages((curr) => [...curr, ...data.urls]);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const payload = {
      ...form,
      price: Number(form.price),
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
      bedrooms: Number(form.bedrooms),
      bathrooms: Number(form.bathrooms),
      parkingSpaces: Number(form.parkingSpaces),
      propertySize: Number(form.propertySize),
      landSize: Number(form.landSize),
      yearBuilt: form.yearBuilt ? Number(form.yearBuilt) : null,
      amenityIds,
      images: images.length ? images : ["https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=1600&q=80"],
    };
    try {
      if (propertyId) {
        await api(`/api/properties/${propertyId}`, { method: "PATCH", body: JSON.stringify(payload) });
      } else {
        await api("/api/properties", { method: "POST", body: JSON.stringify(payload) });
      }
      router.push("/dashboard/properties");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save listing");
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-3xl bg-white p-6 ring-1 ring-stone">
      <h1 className="font-display text-4xl">{propertyId ? "Edit listing" : "Add a property"}</h1>
      <input className="field" placeholder="Title" required value={form.title} onChange={(e) => set("title", e.target.value)} />
      <textarea className="field min-h-32" placeholder="Description" required value={form.description} onChange={(e) => set("description", e.target.value)} />
      <div className="grid gap-3 md:grid-cols-2">
        <select className="field" value={form.propertyType} onChange={(e) => set("propertyType", e.target.value)}>
          {PROPERTY_TYPES.map((t) => <option key={t} value={t}>{propertyTypeLabel(t)}</option>)}
        </select>
        <select className="field" value={form.listingType} onChange={(e) => set("listingType", e.target.value)}>
          {LISTING_TYPES.map((t) => <option key={t} value={t}>{listingLabel(t)}</option>)}
        </select>
        <input className="field" placeholder="Price" value={form.price} onChange={(e) => set("price", e.target.value)} />
        <select className="field" value={form.currency} onChange={(e) => set("currency", e.target.value)}>
          <option>TZS</option><option>USD</option>
        </select>
        <input className="field md:col-span-2" placeholder="Address" value={form.address} onChange={(e) => set("address", e.target.value)} />
        <input className="field" placeholder="Region" value={form.regionName} onChange={(e) => set("regionName", e.target.value)} />
        <input className="field" placeholder="District" value={form.districtName} onChange={(e) => set("districtName", e.target.value)} />
        <input className="field" placeholder="Ward" value={form.wardName} onChange={(e) => set("wardName", e.target.value)} />
        <input className="field" placeholder="Latitude" value={form.latitude} onChange={(e) => set("latitude", e.target.value)} />
        <input className="field" placeholder="Longitude" value={form.longitude} onChange={(e) => set("longitude", e.target.value)} />
        <input className="field" placeholder="Bedrooms" value={form.bedrooms} onChange={(e) => set("bedrooms", e.target.value)} />
        <input className="field" placeholder="Bathrooms" value={form.bathrooms} onChange={(e) => set("bathrooms", e.target.value)} />
        <input className="field" placeholder="Parking" value={form.parkingSpaces} onChange={(e) => set("parkingSpaces", e.target.value)} />
        <input className="field" placeholder="Property size m²" value={form.propertySize} onChange={(e) => set("propertySize", e.target.value)} />
        <input className="field" placeholder="Land size m²" value={form.landSize} onChange={(e) => set("landSize", e.target.value)} />
        <input className="field" placeholder="Year built" value={form.yearBuilt} onChange={(e) => set("yearBuilt", e.target.value)} />
        <select className="field" value={form.furnished} onChange={(e) => set("furnished", e.target.value)}>
          {FURNISHED_STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <input className="field md:col-span-2" placeholder="Video URL (optional)" value={form.videoUrl} onChange={(e) => set("videoUrl", e.target.value)} />
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">Amenities</p>
        <div className="flex flex-wrap gap-2">
          {meta?.amenities.map((a) => (
            <label key={a.id} className="rounded-full bg-sand px-3 py-1 text-sm">
              <input
                type="checkbox"
                className="mr-2"
                checked={amenityIds.includes(a.id)}
                onChange={() => setAmenityIds((curr) => curr.includes(a.id) ? curr.filter((id) => id !== a.id) : [...curr, a.id])}
              />
              {a.name}
            </label>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">Images</p>
        <input type="file" accept="image/jpeg,image/png,image/webp,video/mp4" multiple onChange={(e) => void upload(e.target.files)} />
        <div className="mt-3 flex gap-2 overflow-auto">
          {images.map((url) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={url} src={url} alt="" className="h-20 w-28 rounded-xl object-cover" />
          ))}
        </div>
      </div>
      {error && <p className="text-sm text-coral">{error}</p>}
      <button className="btn-primary">Save listing</button>
    </form>
  );
}
