"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="px-4 py-16 text-center">Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token: params.get("token"), password }),
      });
      router.push("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reset password");
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-display text-5xl">Choose a new password</h1>
      <form onSubmit={submit} className="mt-8 space-y-4">
        <input className="field" type="password" required placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p className="text-sm text-coral">{error}</p>}
        <button className="btn-primary w-full">Update password</button>
      </form>
    </div>
  );
}
