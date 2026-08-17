"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatCompactPrice } from "@/lib/utils";

type Listing = {
  id: string;
  title: string;
  price: number;
  currency: string;
  verificationStatus: string;
  availabilityStatus: string;
  viewsCount: number;
  favoritesCount: number;
};

export default function MyPropertiesPage() {
  const [items, setItems] = useState<Listing[]>([]);

  useEffect(() => {
    api<{ items: Listing[] }>("/api/properties?mine=1&pageSize=48").then((d) => setItems(d.items));
  }, []);

  async function remove(id: string) {
    if (!confirm("Delete this listing?")) return;
    await api(`/api/properties/${id}`, { method: "DELETE" });
    setItems((curr) => curr.filter((p) => p.id !== id));
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-4xl">My listings</h1>
        <Link href="/dashboard/properties/new" className="btn-primary">Add property</Link>
      </div>
      <div className="overflow-hidden rounded-3xl bg-white ring-1 ring-stone">
        <table className="w-full text-left text-sm">
          <thead className="bg-sand">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th>Price</th>
              <th>Status</th>
              <th>Views</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t border-stone">
                <td className="px-4 py-3">{item.title}</td>
                <td>{formatCompactPrice(item.price, item.currency)}</td>
                <td>{item.verificationStatus} / {item.availabilityStatus}</td>
                <td>{item.viewsCount}</td>
                <td className="space-x-3 px-4 py-3">
                  <Link href={`/properties/${item.id}`} className="text-forest">View</Link>
                  <Link href={`/dashboard/properties/${item.id}/edit`} className="text-forest">Edit</Link>
                  <button onClick={() => remove(item.id)} className="text-coral">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!items.length && <p className="p-6 text-ink/60">No listings yet.</p>}
      </div>
    </div>
  );
}
