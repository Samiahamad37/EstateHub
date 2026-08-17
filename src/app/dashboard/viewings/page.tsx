"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/components/providers/auth-provider";

type Viewing = {
  id: string;
  date: string;
  time: string;
  status: string;
  message?: string | null;
  property: { title: string };
  customer: { firstName: string; lastName: string; email: string };
};

export default function ViewingsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Viewing[]>([]);

  async function load() {
    const data = await api<{ items: Viewing[] }>("/api/viewings");
    setItems(data.items);
  }

  useEffect(() => {
    void load();
  }, []);

  async function setStatus(id: string, status: string) {
    await api(`/api/viewings/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
    await load();
  }

  const manager = user && user.role !== "CUSTOMER";

  return (
    <div>
      <h1 className="font-display text-4xl">Viewing appointments</h1>
      <div className="mt-6 space-y-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-3xl bg-white p-5 ring-1 ring-stone">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium">{item.property.title}</p>
                <p className="text-sm text-ink/60">
                  {item.date} at {item.time} · {item.customer.firstName} {item.customer.lastName}
                </p>
                {item.message && <p className="mt-2 text-sm">{item.message}</p>}
              </div>
              <span className="rounded-full bg-sand px-3 py-1 text-sm capitalize">{item.status.toLowerCase()}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {manager && item.status === "PENDING" && (
                <>
                  <button className="btn-primary !py-2" onClick={() => setStatus(item.id, "CONFIRMED")}>Approve</button>
                  <button className="btn-secondary !py-2" onClick={() => setStatus(item.id, "REJECTED")}>Reject</button>
                </>
              )}
              {manager && item.status === "CONFIRMED" && (
                <button className="btn-secondary !py-2" onClick={() => setStatus(item.id, "COMPLETED")}>Mark completed</button>
              )}
              {item.status !== "CANCELLED" && item.status !== "COMPLETED" && (
                <button className="btn-ghost !py-2" onClick={() => setStatus(item.id, "CANCELLED")}>Cancel</button>
              )}
            </div>
          </div>
        ))}
        {!items.length && <p className="text-ink/60">No viewing requests yet.</p>}
      </div>
    </div>
  );
}
