"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/components/providers/auth-provider";
import { DEMO_ACCOUNTS } from "@/lib/constants";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="px-4 py-16 text-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { refresh } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
      await refresh();
      router.push(params.get("next") || "/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-display text-5xl">Welcome back</h1>
      <p className="mt-2 text-ink/60">Sign in to manage listings, viewings and messages.</p>
      <form onSubmit={submit} className="mt-8 space-y-4">
        <input className="field" type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="field" type="password" required placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p className="text-sm text-coral">{error}</p>}
        <button className="btn-primary w-full" disabled={loading}>{loading ? "Signing in..." : "Sign in"}</button>
      </form>
      <div className="mt-4 flex justify-between text-sm">
        <Link href="/forgot-password" className="text-forest">Forgot password</Link>
        <Link href="/register" className="text-forest">Create account</Link>
      </div>
      <div className="mt-8 rounded-3xl bg-white p-4 text-sm ring-1 ring-stone">
        <p className="font-medium">Demo accounts</p>
        <p className="text-ink/60">Password for all: EstateHub@2026</p>
        <ul className="mt-2 space-y-1">
          {DEMO_ACCOUNTS.map((a) => (
            <li key={a.email}>
              <button className="text-left hover:text-forest" onClick={() => { setEmail(a.email); setPassword(a.password); }}>
                {a.role}: {a.email}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
