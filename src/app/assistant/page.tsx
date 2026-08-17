"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { PropertyCard } from "@/components/property/property-card";
import type { PropertyCard as PropertyType } from "@/types";

type Rec = { explanation: string; properties: PropertyType[] };

export default function AssistantPage() {
  const [input, setInput] = useState("");
  const [reply, setReply] = useState("Ask for homes in Dar es Salaam, apartments with three bedrooms, or advice before buying land.");
  const [properties, setProperties] = useState<PropertyType[]>([]);
  const [recs, setRecs] = useState<Rec | null>(null);

  useEffect(() => {
    api<Rec>("/api/ai/recommend")
      .then(setRecs)
      .catch(() => undefined);
  }, []);

  async function ask(e: React.FormEvent) {
    e.preventDefault();
    const data = await api<{ reply: string; properties: PropertyType[] }>("/api/ai/assistant", {
      method: "POST",
      body: JSON.stringify({ message: input }),
    });
    setReply(data.reply);
    setProperties(data.properties);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <p className="text-xs uppercase tracking-[0.25em] text-gold">AI property assistant</p>
      <h1 className="font-display text-5xl">Tell us what you are looking for</h1>
      <form onSubmit={ask} className="mt-6 flex flex-col gap-3 md:flex-row">
        <input className="field" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Find me a house in Dar es Salaam under 300 million" />
        <button className="btn-primary">Ask</button>
      </form>
      <p className="mt-6 max-w-3xl text-lg text-ink/80">{reply}</p>
      <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {properties.map((p) => (
          <PropertyCard key={p.id} property={p} />
        ))}
      </div>
      {recs && (
        <section className="mt-16">
          <h2 className="font-display text-4xl">Recommended for you</h2>
          <p className="mt-2 text-ink/70">{recs.explanation}</p>
          <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {recs.properties.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
