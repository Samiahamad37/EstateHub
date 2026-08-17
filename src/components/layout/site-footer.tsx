import Link from "next/link";
import { Building2 } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-stone bg-forest text-cream">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 font-display text-2xl">
            <Building2 className="h-5 w-5 text-gold" />
            EstateHub
          </div>
          <p className="mt-3 max-w-xs text-sm text-cream/70">
            A modern marketplace for buying, renting, and managing property across Tanzania.
          </p>
        </div>
        <div>
          <h3 className="text-sm uppercase tracking-[0.2em] text-gold">Explore</h3>
          <div className="mt-4 space-y-2 text-sm text-cream/80">
            <Link href="/properties?listing=FOR_SALE" className="block hover:text-white">For sale</Link>
            <Link href="/properties?listing=FOR_RENT" className="block hover:text-white">For rent</Link>
            <Link href="/properties?view=map" className="block hover:text-white">Map search</Link>
            <Link href="/assistant" className="block hover:text-white">AI assistant</Link>
          </div>
        </div>
        <div>
          <h3 className="text-sm uppercase tracking-[0.2em] text-gold">Partners</h3>
          <div className="mt-4 space-y-2 text-sm text-cream/80">
            <Link href="/register?role=AGENT" className="block hover:text-white">List as an agent</Link>
            <Link href="/register?role=OWNER" className="block hover:text-white">List as an owner</Link>
            <Link href="/login" className="block hover:text-white">Partner login</Link>
          </div>
        </div>
        <div>
          <h3 className="text-sm uppercase tracking-[0.2em] text-gold">Contact</h3>
          <p className="mt-4 text-sm text-cream/80">support@estatehub.com</p>
          <p className="text-sm text-cream/80">Dar es Salaam, Tanzania</p>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-cream/50">
        © {new Date().getFullYear()} EstateHub. All rights reserved.
      </div>
    </footer>
  );
}
