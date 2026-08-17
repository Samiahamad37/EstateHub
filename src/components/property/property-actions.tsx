"use client";

import { useRouter } from "next/navigation";
import { Heart, Share2 } from "lucide-react";
import { useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/components/providers/auth-provider";

export function PropertyActions({
  propertyId,
  agentId,
  title,
  favorited,
}: {
  propertyId: string;
  agentId: string;
  title: string;
  favorited: boolean;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const [saved, setSaved] = useState(favorited);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("10:00");
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState("");
  const [status, setStatus] = useState("");

  async function favorite() {
    if (!user) return router.push(`/login?next=/properties/${propertyId}`);
    const data = await api<{ favorited: boolean }>(`/api/properties/${propertyId}/favorite`, { method: "POST" });
    setSaved(data.favorited);
  }

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title, url });
      return;
    }
    await navigator.clipboard.writeText(url);
    setStatus("Link copied");
  }

  async function requestViewing(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return router.push(`/login?next=/properties/${propertyId}`);
    try {
      await api("/api/viewings", {
        method: "POST",
        body: JSON.stringify({ propertyId, date, time, message }),
      });
      setStatus("Viewing requested. You will be notified when the agent responds.");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Could not request viewing");
    }
  }

  async function contactAgent(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return router.push(`/login?next=/properties/${propertyId}`);
    try {
      const data = await api<{ conversationId: string }>("/api/conversations", {
        method: "POST",
        body: JSON.stringify({ recipientId: agentId, propertyId, body: contact }),
      });
      router.push(`/messages?c=${data.conversationId}`);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Could not send message");
    }
  }

  return (
    <div className="space-y-4 rounded-3xl bg-white p-6 ring-1 ring-stone">
      <div className="flex gap-2">
        <button onClick={favorite} className="btn-secondary flex-1">
          <Heart className={`h-4 w-4 ${saved ? "fill-coral text-coral" : ""}`} />
          {saved ? "Saved" : "Favorite"}
        </button>
        <button onClick={share} className="btn-secondary">
          <Share2 className="h-4 w-4" />
        </button>
      </div>
      <form onSubmit={requestViewing} className="space-y-3">
        <h3 className="font-display text-2xl">Schedule a Viewing</h3>
        <input type="date" required className="field" value={date} onChange={(e) => setDate(e.target.value)} />
        <input type="time" required className="field" value={time} onChange={(e) => setTime(e.target.value)} />
        <textarea className="field min-h-24" placeholder="Message to the agent" value={message} onChange={(e) => setMessage(e.target.value)} />
        <button className="btn-primary w-full">Schedule a Viewing</button>
      </form>
      <form onSubmit={contactAgent} className="space-y-3 border-t border-stone pt-4">
        <h3 className="font-medium">Contact agent</h3>
        <textarea required className="field min-h-24" placeholder="Introduce yourself and ask a question" value={contact} onChange={(e) => setContact(e.target.value)} />
        <button className="btn-secondary w-full">Send message</button>
      </form>
      {status && <p className="text-sm text-forest">{status}</p>}
    </div>
  );
}
