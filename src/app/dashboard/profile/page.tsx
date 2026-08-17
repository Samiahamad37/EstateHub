"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/components/providers/auth-provider";

export default function ProfilePage() {
  const { user, refresh } = useAuth();
  const [status, setStatus] = useState("");
  const [form, setForm] = useState({
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    phone: user?.phone ?? "",
    bio: user?.bio ?? "",
    agencyName: user?.agencyName ?? "",
    licenseNumber: user?.licenseNumber ?? "",
  });

  if (!user) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await api("/api/profile", { method: "PATCH", body: JSON.stringify(form) });
    await refresh();
    setStatus("Profile saved");
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-3xl bg-white p-6 ring-1 ring-stone">
      <h1 className="font-display text-4xl">Your profile</h1>
      <div className="grid gap-3 md:grid-cols-2">
        <input className="field" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
        <input className="field" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
        <input className="field md:col-span-2" value={user.email} disabled />
        <input className="field md:col-span-2" placeholder="Phone" value={form.phone ?? ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <textarea className="field min-h-28 md:col-span-2" placeholder="Bio" value={form.bio ?? ""} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
        {(user.role === "AGENT" || user.role === "OWNER") && (
          <>
            <input className="field" placeholder="Agency" value={form.agencyName ?? ""} onChange={(e) => setForm({ ...form, agencyName: e.target.value })} />
            <input className="field" placeholder="License number" value={form.licenseNumber ?? ""} onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} />
          </>
        )}
      </div>
      {status && <p className="text-sm text-forest">{status}</p>}
      <button className="btn-primary">Save profile</button>
    </form>
  );
}
