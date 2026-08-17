"use client";

import { useState } from "react";
import type { PropertyMedia } from "@/types";

export function PropertyGallery({ media, title }: { media: PropertyMedia[]; title: string }) {
  const images = media.filter((m) => m.type !== "VIDEO");
  const [active, setActive] = useState(0);
  if (!images.length) return <div className="h-96 rounded-3xl bg-sand" />;

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-3xl bg-sand">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={images[active].url} alt={title} className="h-[420px] w-full object-cover md:h-[540px]" />
      </div>
      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto">
          {images.map((image, index) => (
            <button
              key={image.id}
              onClick={() => setActive(index)}
              className={`h-20 w-28 shrink-0 overflow-hidden rounded-2xl ring-2 ${index === active ? "ring-gold" : "ring-transparent"}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
