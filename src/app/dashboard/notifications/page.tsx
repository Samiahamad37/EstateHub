"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

type Note = { id: string; title: string; body: string; read: boolean; link?: string | null; createdAt: string };

export default function NotificationsPage() {
  const [items, setItems] = useState<Note[]>([]);

  async function load() {
    const data = await api<{ items: Note[] }>("/api/notifications");
    setItems(data.items);
  }

  useEffect(() => {
    void load();
  }, []);

  async function markAll() {
    await api("/api/notifications", { method: "PATCH", body: JSON.stringify({ all: true }) });
    await load();
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-4xl">Notifications</h1>
        <button className="btn-secondary" onClick={markAll}>Mark all read</button>
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <Link
            key={item.id}
            href={item.link || "#"}
            onClick={() => api("/api/notifications", { method: "PATCH", body: JSON.stringify({ id: item.id }) })}
            className={`block rounded-3xl p-5 ring-1 ring-stone ${item.read ? "bg-white" : "bg-sand"}`}
          >
            <p className="font-medium">{item.title}</p>
            <p className="text-sm text-ink/70">{item.body}</p>
          </Link>
        ))}
        {!items.length && <p className="text-ink/60">You are all caught up.</p>}
      </div>
    </div>
  );
}
