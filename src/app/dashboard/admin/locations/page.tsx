"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type Region = { id: string; name: string; districts: { id: string; name: string; wards: { id: string; name: string }[] }[] };

export default function LocationsPage() {
  const [items, setItems] = useState<Region[]>([]);
  const [region, setRegion] = useState("");

  async function load() {
    const data = await api<{ items: Region[] }>("/api/admin/locations");
    setItems(data.items);
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div>
      <h1 className="font-display text-4xl">Locations</h1>
      <form
        className="mt-6 flex gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          await api("/api/admin/locations", { method: "POST", body: JSON.stringify({ type: "region", name: region }) });
          setRegion("");
          await load();
        }}
      >
        <input className="field" placeholder="New region" value={region} onChange={(e) => setRegion(e.target.value)} />
        <button className="btn-primary">Add region</button>
      </form>
      <div className="mt-6 space-y-4">
        {items.map((r) => (
          <div key={r.id} className="rounded-3xl bg-white p-5 ring-1 ring-stone">
            <h2 className="font-display text-2xl">{r.name}</h2>
            {r.districts.map((d) => (
              <div key={d.id} className="mt-3">
                <p className="font-medium">{d.name}</p>
                <p className="text-sm text-ink/60">{d.wards.map((w) => w.name).join(", ") || "No wards"}</p>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
