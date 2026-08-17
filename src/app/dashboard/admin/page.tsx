"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/components/providers/auth-provider";

type UserRow = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
};
type PropertyRow = { id: string; title: string; verificationStatus: string; listedBy?: { firstName: string; lastName: string } };
type ReportRow = { id: string; reason: string; status: string; details?: string | null; property?: { title: string } | null };
type Category = { id: string; name: string };

export default function AdminPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [properties, setProperties] = useState<PropertyRow[]>([]);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState("");

  async function load() {
    const [u, p, r, c] = await Promise.all([
      api<{ items: UserRow[] }>("/api/admin/users"),
      api<{ items: PropertyRow[] }>("/api/properties?status=PENDING&pageSize=48"),
      api<{ items: ReportRow[] }>("/api/admin/reports"),
      api<{ items: Category[] }>("/api/admin/categories"),
    ]);
    setUsers(u.items);
    setProperties(p.items);
    setReports(r.items);
    setCategories(c.items);
  }

  useEffect(() => {
    void load();
  }, []);

  if (user && user.role !== "ADMIN") return <p>Admin access required.</p>;

  return (
    <div className="space-y-8">
      <h1 className="font-display text-4xl">Admin console</h1>

      <section className="rounded-3xl bg-white p-5 ring-1 ring-stone">
        <h2 className="font-display text-2xl">Users & agents</h2>
        <div className="mt-3 overflow-auto">
          <table className="w-full text-left text-sm">
            <thead><tr><th className="py-2">Name</th><th>Email</th><th>Role</th><th>Status</th></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-stone">
                  <td className="py-2">{u.firstName} {u.lastName}</td>
                  <td>{u.email}</td>
                  <td>
                    <select
                      className="field !py-1"
                      value={u.role}
                      onChange={async (e) => {
                        await api("/api/admin/users", { method: "PATCH", body: JSON.stringify({ id: u.id, role: e.target.value }) });
                        await load();
                      }}
                    >
                      {["CUSTOMER", "AGENT", "OWNER", "ADMIN"].map((r) => <option key={r}>{r}</option>)}
                    </select>
                  </td>
                  <td>
                    <button
                      className="text-forest"
                      onClick={async () => {
                        await api("/api/admin/users", { method: "PATCH", body: JSON.stringify({ id: u.id, isActive: !u.isActive }) });
                        await load();
                      }}
                    >
                      {u.isActive ? "Active" : "Disabled"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-3xl bg-white p-5 ring-1 ring-stone">
        <h2 className="font-display text-2xl">Pending listing approvals</h2>
        <div className="mt-3 space-y-2">
          {properties.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-2xl bg-sand px-4 py-3">
              <span>{p.title}</span>
              <span className="space-x-3">
                <button className="text-forest" onClick={async () => { await api(`/api/properties/${p.id}`, { method: "PATCH", body: JSON.stringify({ verificationStatus: "APPROVED" }) }); await load(); }}>Approve</button>
                <button className="text-coral" onClick={async () => { await api(`/api/properties/${p.id}`, { method: "PATCH", body: JSON.stringify({ verificationStatus: "REJECTED" }) }); await load(); }}>Reject</button>
              </span>
            </div>
          ))}
          {!properties.length && <p className="text-sm text-ink/60">No pending listings.</p>}
        </div>
      </section>

      <section className="rounded-3xl bg-white p-5 ring-1 ring-stone">
        <h2 className="font-display text-2xl">Categories</h2>
        <form
          className="mt-3 flex gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            await api("/api/admin/categories", { method: "POST", body: JSON.stringify({ name: newCategory }) });
            setNewCategory("");
            await load();
          }}
        >
          <input className="field" placeholder="New category" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} />
          <button className="btn-primary">Add</button>
        </form>
        <div className="mt-3 flex flex-wrap gap-2">
          {categories.map((c) => (
            <span key={c.id} className="rounded-full bg-sand px-3 py-1 text-sm">{c.name}</span>
          ))}
        </div>
      </section>

      <section className="rounded-3xl bg-white p-5 ring-1 ring-stone">
        <h2 className="font-display text-2xl">Reports</h2>
        <div className="mt-3 space-y-2">
          {reports.map((r) => (
            <div key={r.id} className="rounded-2xl bg-sand px-4 py-3 text-sm">
              <p className="font-medium">{r.reason} · {r.property?.title ?? "General"} · {r.status}</p>
              <p>{r.details}</p>
              {r.status === "PENDING" && (
                <button className="mt-2 text-forest" onClick={async () => { await api("/api/admin/reports", { method: "PATCH", body: JSON.stringify({ id: r.id, status: "RESOLVED" }) }); await load(); }}>Resolve</button>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
