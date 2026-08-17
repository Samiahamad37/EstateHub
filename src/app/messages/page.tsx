"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/components/providers/auth-provider";
import { fullName } from "@/lib/utils";

type Conversation = {
  id: string;
  lastMessage?: string | null;
  unread: number;
  property?: { title: string } | null;
  userA: { id: string; firstName: string; lastName: string };
  userB: { id: string; firstName: string; lastName: string };
};

type Message = {
  id: string;
  body: string;
  senderId: string;
  createdAt: string;
  sender: { firstName: string; lastName: string };
};

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="px-4 py-16">Loading messages...</div>}>
      <MessagesClient />
    </Suspense>
  );
}

function MessagesClient() {
  const { user } = useAuth();
  const params = useSearchParams();
  const [items, setItems] = useState<Conversation[]>([]);
  const [active, setActive] = useState(params.get("c") ?? "");
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");

  async function loadList() {
    const data = await api<{ items: Conversation[] }>("/api/conversations");
    setItems(data.items);
    if (!active && data.items[0]) setActive(data.items[0].id);
  }

  async function loadThread(id: string) {
    const data = await api<{ conversation: { messages: Message[] } }>(`/api/conversations/${id}`);
    setMessages(data.conversation.messages);
  }

  useEffect(() => {
    void loadList();
  }, []);

  useEffect(() => {
    if (active) void loadThread(active);
  }, [active]);

  const current = items.find((c) => c.id === active);
  const other = useMemo(() => {
    if (!current || !user) return null;
    return current.userA.id === user.id ? current.userB : current.userA;
  }, [current, user]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!active || !body.trim()) return;
    await api(`/api/conversations/${active}`, { method: "POST", body: JSON.stringify({ body }) });
    setBody("");
    await loadThread(active);
    await loadList();
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[280px_1fr]">
      <aside className="rounded-3xl bg-white p-3 ring-1 ring-stone">
        <h1 className="px-2 py-3 font-display text-3xl">Messages</h1>
        {items.map((c) => {
          const person = user && c.userA.id === user.id ? c.userB : c.userA;
          return (
            <button
              key={c.id}
              onClick={() => setActive(c.id)}
              className={`mb-1 w-full rounded-2xl px-3 py-3 text-left ${c.id === active ? "bg-forest text-cream" : "hover:bg-sand"}`}
            >
              <p className="font-medium">{fullName(person)}</p>
              <p className="truncate text-xs opacity-70">{c.property?.title ?? c.lastMessage}</p>
            </button>
          );
        })}
        {!items.length && <p className="p-3 text-sm text-ink/60">No conversations yet.</p>}
      </aside>
      <section className="flex min-h-[520px] flex-col rounded-3xl bg-white ring-1 ring-stone">
        <div className="border-b border-stone px-5 py-4">
          <p className="font-medium">{other ? fullName(other) : "Select a conversation"}</p>
          {current?.property && <p className="text-sm text-ink/60">{current.property.title}</p>}
        </div>
        <div className="flex-1 space-y-3 overflow-auto p-5">
          {messages.map((m) => (
            <div key={m.id} className={`max-w-[75%] rounded-3xl px-4 py-3 ${m.senderId === user?.id ? "ml-auto bg-forest text-cream" : "bg-sand"}`}>
              <p>{m.body}</p>
              <p className="mt-1 text-[11px] opacity-70">{new Date(m.createdAt).toLocaleString()}</p>
            </div>
          ))}
        </div>
        {active && (
          <form onSubmit={send} className="flex gap-2 border-t border-stone p-4">
            <input className="field" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write a message" />
            <button className="btn-primary">Send</button>
          </form>
        )}
      </section>
    </div>
  );
}
