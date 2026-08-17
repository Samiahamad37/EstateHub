"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/components/providers/auth-provider";

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="px-4 py-24 text-center">Verifying...</div>}>
      <VerifyEmailClient />
    </Suspense>
  );
}

function VerifyEmailClient() {
  const params = useSearchParams();
  const router = useRouter();
  const { refresh } = useAuth();
  const [status, setStatus] = useState("Verifying your email...");

  useEffect(() => {
    const token = params.get("token");
    if (!token) {
      setStatus("Missing verification token.");
      return;
    }
    api("/api/auth/verify-email", { method: "POST", body: JSON.stringify({ token }) })
      .then(async () => {
        await refresh();
        setStatus("Email verified. Redirecting...");
        router.push("/dashboard");
      })
      .catch((err) => setStatus(err instanceof Error ? err.message : "Verification failed"));
  }, [params, refresh, router]);

  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="font-display text-4xl">Email verification</h1>
      <p className="mt-4 text-ink/70">{status}</p>
    </div>
  );
}
