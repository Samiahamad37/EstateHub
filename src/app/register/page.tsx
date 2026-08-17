"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { ROLES } from "@/lib/constants";

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="px-4 py-16 text-center">Loading...</div>}>
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    role: (params.get("role") || "CUSTOMER").toUpperCase(),
    agencyName: "",
  });
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((curr) => ({ ...curr, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const data = await api<{ verifyToken?: string; message: string }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(form),
      });
      if (data.verifyToken) {
        setInfo("Account created. In development you can verify immediately.");
        router.push(`/verify-email?token=${data.verifyToken}`);
        return;
      }
      setInfo(data.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <h1 className="font-display text-5xl">Create your account</h1>
      <form onSubmit={submit} className="mt-8 grid gap-4 md:grid-cols-2">
        <input className="field" placeholder="First name" required value={form.firstName} onChange={(e) => set("firstName", e.target.value)} />
        <input className="field" placeholder="Last name" required value={form.lastName} onChange={(e) => set("lastName", e.target.value)} />
        <input className="field md:col-span-2" type="email" placeholder="Email" required value={form.email} onChange={(e) => set("email", e.target.value)} />
        <input className="field md:col-span-2" type="password" placeholder="Password (8+ chars, 1 uppercase, 1 number)" required value={form.password} onChange={(e) => set("password", e.target.value)} />
        <input className="field" placeholder="Phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        <select className="field" value={form.role} onChange={(e) => set("role", e.target.value)}>
          {ROLES.filter((r) => r !== "ADMIN").map((role) => (
            <option key={role} value={role}>{role}</option>
          ))}
        </select>
        {form.role === "AGENT" && (
          <input className="field md:col-span-2" placeholder="Agency name" value={form.agencyName} onChange={(e) => set("agencyName", e.target.value)} />
        )}
        {error && <p className="md:col-span-2 text-sm text-coral">{error}</p>}
        {info && <p className="md:col-span-2 text-sm text-forest">{info}</p>}
        <button className="btn-primary md:col-span-2">Create account</button>
      </form>
      <p className="mt-4 text-sm">
        Already registered? <Link href="/login" className="text-forest">Sign in</Link>
      </p>
    </div>
  );
}
