"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Building2, Heart, Menu, MessageCircle, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

const links = [
  { href: "/properties", label: "Properties" },
  { href: "/properties?view=map", label: "Map" },
  { href: "/assistant", label: "AI Assistant" },
];

export function SiteHeader() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) return;
    api<{ unread: number }>("/api/notifications")
      .then((d) => setUnread(d.unread))
      .catch(() => undefined);
  }, [user, pathname]);

  async function handleLogout() {
    await logout();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 border-b border-stone/70 bg-cream/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-display text-2xl text-forest">
          <Building2 className="h-6 w-6 text-gold" />
          EstateHub
        </Link>
        <nav className="hidden items-center gap-7 text-sm font-medium text-ink/80 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn("hover:text-forest", pathname.startsWith(link.href.split("?")[0]) && "text-forest")}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <Link href="/favorites" className="rounded-full p-2 hover:bg-sand" aria-label="Favorites">
                <Heart className="h-5 w-5" />
              </Link>
              <Link href="/messages" className="rounded-full p-2 hover:bg-sand" aria-label="Messages">
                <MessageCircle className="h-5 w-5" />
              </Link>
              <Link href="/dashboard/notifications" className="relative rounded-full p-2 hover:bg-sand">
                <Bell className="h-5 w-5" />
                {unread > 0 && (
                  <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-coral" />
                )}
              </Link>
              <Link href="/dashboard" className="btn-secondary !py-2 !px-4 text-sm">
                Dashboard
              </Link>
              <button onClick={handleLogout} className="text-sm text-ink/70 hover:text-forest">
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium hover:text-forest">
                Sign in
              </Link>
              <Link href="/register" className="btn-primary !py-2 !px-4 text-sm">
                Join EstateHub
              </Link>
            </>
          )}
        </div>
        <button className="md:hidden" onClick={() => setOpen((v) => !v)} aria-label="Menu">
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <div className="space-y-3 border-t border-stone bg-cream px-4 py-4 md:hidden">
          {links.map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="block">
              {link.label}
            </Link>
          ))}
          {user ? (
            <>
              <Link href="/dashboard" onClick={() => setOpen(false)} className="block">
                Dashboard
              </Link>
              <button onClick={handleLogout}>Sign out</button>
            </>
          ) : (
            <Link href="/login" onClick={() => setOpen(false)} className="block">
              Sign in
            </Link>
          )}
        </div>
      )}
    </header>
  );
}

export function AssistantChip() {
  return (
    <Link
      href="/assistant"
      className="fixed bottom-5 right-5 z-40 hidden items-center gap-2 rounded-full bg-forest px-4 py-3 text-sm text-cream shadow-lg md:flex"
    >
      <Sparkles className="h-4 w-4 text-gold" />
      Ask EstateHub AI
    </Link>
  );
}
