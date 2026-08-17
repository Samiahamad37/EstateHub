"use client";

import { useState } from "react";
import { api } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [token, setToken] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const data = await api<{ message: string; resetToken?: string }>("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
    setMessage(data.message);
    setToken(data.resetToken ?? "");
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-display text-5xl">Reset password</h1>
      <form onSubmit={submit} className="mt-8 space-y-4">
        <input className="field" type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <button className="btn-primary w-full">Send reset link</button>
      </form>
      {message && <p className="mt-4 text-sm text-forest">{message}</p>}
      {token && (
        <p className="mt-2 text-sm">
          Dev reset link: <a className="underline" href={`/reset-password?token=${token}`}>Continue</a>
        </p>
      )}
    </div>
  );
}
