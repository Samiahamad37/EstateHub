"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [status, setStatus] = useState("");

  useEffect(() => {
    api<{ items: Record<string, string> }>("/api/admin/settings").then((d) => setSettings(d.items));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await api("/api/admin/settings", { method: "PATCH", body: JSON.stringify(settings) });
    setStatus("Settings saved");
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-3xl bg-white p-6 ring-1 ring-stone">
      <h1 className="font-display text-4xl">System settings</h1>
      {Object.entries(settings).map(([key, value]) => (
        <label key={key} className="block">
          <span className="mb-1 block text-sm capitalize">{key}</span>
          <input className="field" value={value} onChange={(e) => setSettings({ ...settings, [key]: e.target.value })} />
        </label>
      ))}
      {status && <p className="text-sm text-forest">{status}</p>}
      <button className="btn-primary">Save settings</button>
    </form>
  );
}
