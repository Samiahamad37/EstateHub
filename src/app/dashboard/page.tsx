"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "@/lib/api";
import { formatCompactPrice } from "@/lib/utils";
import { useAuth } from "@/components/providers/auth-provider";

type DashboardData = {
  role: string;
  stats: Record<string, number>;
  properties?: { id: string; title: string; viewsCount: number; price: number; currency: string; verificationStatus: string }[];
  viewings?: { id: string; date: string; time: string; status: string; property: { title: string } }[];
  searches?: { id: string; query: string; createdAt: string }[];
  viewsSeries?: { name: string; views: number; favorites: number }[];
  monthly?: { label: string; properties: number; users: number }[];
  byType?: { propertyType: string; _count: number }[];
  recentUsers?: { id: string; firstName: string; lastName: string; email: string; role: string }[];
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    api<DashboardData>("/api/dashboard").then(setData).catch(() => undefined);
  }, []);

  if (!data || !user) return <p>Loading dashboard...</p>;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-gold">Dashboard</p>
        <h1 className="font-display text-4xl">Hello, {user.firstName}</h1>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Object.entries(data.stats).map(([key, value]) => (
          <div key={key} className="rounded-3xl bg-white p-5 ring-1 ring-stone">
            <p className="text-sm capitalize text-ink/60">{key.replace(/[A-Z]/g, (c) => ` ${c}`)}</p>
            <p className="mt-2 text-3xl font-semibold text-forest">{value}</p>
          </div>
        ))}
      </div>

      {data.viewsSeries && (
        <div className="rounded-3xl bg-white p-5 ring-1 ring-stone">
          <h2 className="font-display text-2xl">Property performance</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.viewsSeries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" hide />
                <YAxis />
                <Tooltip />
                <Bar dataKey="views" fill="#1c3d31" />
                <Bar dataKey="favorites" fill="#c4a265" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {data.monthly && (
        <div className="rounded-3xl bg-white p-5 ring-1 ring-stone">
          <h2 className="font-display text-2xl">Monthly platform activity</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.monthly}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="properties" fill="#1c3d31" />
                <Bar dataKey="users" fill="#c4a265" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {data.viewings && (
        <div className="rounded-3xl bg-white p-5 ring-1 ring-stone">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-2xl">Viewing appointments</h2>
            <Link href="/dashboard/viewings" className="text-sm text-forest">Manage</Link>
          </div>
          <div className="space-y-2 text-sm">
            {data.viewings.slice(0, 6).map((v) => (
              <div key={v.id} className="flex justify-between rounded-2xl bg-sand px-4 py-3">
                <span>{v.property.title} · {v.date} {v.time}</span>
                <span className="capitalize">{v.status.toLowerCase()}</span>
              </div>
            ))}
            {!data.viewings.length && <p className="text-ink/60">No appointments yet.</p>}
          </div>
        </div>
      )}

      {data.searches && (
        <div className="rounded-3xl bg-white p-5 ring-1 ring-stone">
          <h2 className="font-display text-2xl">Recent searches</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {data.searches.map((s) => (
              <li key={s.id} className="rounded-2xl bg-sand px-4 py-2">{s.query || "Filtered search"}</li>
            ))}
          </ul>
        </div>
      )}

      {data.properties && (
        <div className="rounded-3xl bg-white p-5 ring-1 ring-stone">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-2xl">Listings</h2>
            <Link href="/dashboard/properties" className="text-sm text-forest">View all</Link>
          </div>
          <div className="space-y-2 text-sm">
            {data.properties.slice(0, 6).map((p) => (
              <div key={p.id} className="flex justify-between rounded-2xl bg-sand px-4 py-3">
                <span>{p.title}</span>
                <span>{formatCompactPrice(p.price, p.currency)} · {p.viewsCount} views</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {user.role === "CUSTOMER" && (
        <Link href="/assistant" className="btn-primary">Get AI recommendations</Link>
      )}
    </div>
  );
}
