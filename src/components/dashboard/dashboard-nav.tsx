"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bell,
  Building2,
  CalendarDays,
  Heart,
  LayoutDashboard,
  MapPinned,
  MessageCircle,
  Plus,
  Settings,
  Shield,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PublicUser } from "@/types";

export function DashboardNav({ user }: { user: PublicUser }) {
  const pathname = usePathname();
  const items = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/viewings", label: "Viewings", icon: CalendarDays },
    { href: "/messages", label: "Messages", icon: MessageCircle },
    { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
    { href: "/dashboard/profile", label: "Profile", icon: UserRound },
  ];

  if (user.role === "CUSTOMER") {
    items.splice(1, 0, { href: "/favorites", label: "Saved homes", icon: Heart });
  }
  if (user.role === "AGENT" || user.role === "OWNER" || user.role === "ADMIN") {
    items.splice(1, 0, { href: "/dashboard/properties", label: "My listings", icon: Building2 });
    items.splice(2, 0, { href: "/dashboard/properties/new", label: "Add property", icon: Plus });
  }
  if (user.role === "ADMIN") {
    items.push(
      { href: "/dashboard/admin", label: "Admin console", icon: Shield },
      { href: "/dashboard/admin/locations", label: "Locations", icon: MapPinned },
      { href: "/dashboard/admin/settings", label: "Settings", icon: Settings },
      { href: "/dashboard/admin", label: "Analytics", icon: BarChart3 },
    );
  }

  const unique = items.filter((item, index, all) => all.findIndex((x) => x.href === item.href && x.label === item.label) === index);

  return (
    <aside className="w-full shrink-0 rounded-3xl bg-white p-4 ring-1 ring-stone md:w-64">
      <p className="px-3 text-xs uppercase tracking-[0.2em] text-gold">{user.role.toLowerCase()}</p>
      <p className="px-3 pb-4 font-display text-2xl">
        {user.firstName} {user.lastName}
      </p>
      <nav className="space-y-1">
        {unique.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={`${item.href}-${item.label}`}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm",
                active ? "bg-forest text-cream" : "hover:bg-sand",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
