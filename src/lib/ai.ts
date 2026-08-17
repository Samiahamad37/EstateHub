import { prisma } from "@/lib/prisma";
import { PROPERTY_TYPES } from "@/lib/constants";

type AssistantFilters = {
  location?: string;
  propertyType?: string;
  listingType?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  furnished?: string;
};

function parseMillions(text: string) {
  const million = text.match(/(\d+(?:\.\d+)?)\s*(million|m)\b/i);
  if (million) return Number(million[1]) * 1_000_000;
  const billion = text.match(/(\d+(?:\.\d+)?)\s*(billion|b)\b/i);
  if (billion) return Number(billion[1]) * 1_000_000_000;
  const raw = text.match(/tzs\s*([\d,]+)/i) || text.match(/([\d,]+)\s*tzs/i);
  if (raw) return Number(raw[1].replace(/,/g, ""));
  return undefined;
}

export function parseAssistantQuery(message: string): AssistantFilters {
  const text = message.toLowerCase();
  const filters: AssistantFilters = {};

  for (const type of PROPERTY_TYPES) {
    const label = type.replaceAll("_", " ").toLowerCase();
    if (text.includes(label) || text.includes(type.toLowerCase())) {
      filters.propertyType = type;
      break;
    }
  }
  if (text.includes("condo")) filters.propertyType = "APARTMENT";
  if (text.includes("plot") || text.includes("land")) filters.propertyType = filters.propertyType ?? "LAND";

  if (text.includes("rent") && !text.includes("for sale")) filters.listingType = "FOR_RENT";
  if (text.includes("short-term") || text.includes("airbnb") || text.includes("holiday")) {
    filters.listingType = "SHORT_TERM_RENTAL";
  }
  if (text.includes("lease")) filters.listingType = "LEASE";
  if (text.includes("sale") || text.includes("buy") || text.includes("buying")) {
    filters.listingType = filters.listingType ?? "FOR_SALE";
  }

  const under = text.match(/under\s+(\d+(?:\.\d+)?)\s*(million|m|billion|b)?/i);
  if (under) {
    const n = Number(under[1]);
    const unit = (under[2] ?? "").toLowerCase();
    filters.maxPrice = unit.startsWith("b") ? n * 1_000_000_000 : unit ? n * 1_000_000 : parseMillions(text);
  } else {
    const parsed = parseMillions(text);
    if (parsed) filters.maxPrice = parsed;
  }

  const beds = text.match(/(\d+)\s*(bed|br|bedroom)/i);
  if (beds) filters.bedrooms = Number(beds[1]);
  const baths = text.match(/(\d+)\s*(bath|bathroom)/i);
  if (baths) filters.bathrooms = Number(baths[1]);

  if (text.includes("furnished") && !text.includes("unfurnished")) filters.furnished = "FURNISHED";

  const places = [
    "dar es salaam",
    "dar",
    "arusha",
    "mwanza",
    "dodoma",
    "zanzibar",
    "masaki",
    "mikocheni",
    "mbezi",
    "mwenge",
    "sinza",
    "makongo",
    "oyster bay",
    "kunduchi",
    "bagamoyo",
    "ubungo",
    "kariakoo",
    "kinondoni",
    "ilala",
    "temeke",
    "stone town",
  ];
  for (const place of places) {
    if (text.includes(place)) {
      filters.location = place === "dar" ? "Dar es Salaam" : place.replace(/\b\w/g, (c) => c.toUpperCase());
      break;
    }
  }

  return filters;
}

export async function searchByFilters(filters: AssistantFilters, take = 8) {
  return prisma.property.findMany({
    where: {
      verificationStatus: "APPROVED",
      availabilityStatus: { in: ["AVAILABLE", "PENDING"] },
      ...(filters.propertyType ? { propertyType: filters.propertyType } : {}),
      ...(filters.listingType ? { listingType: filters.listingType } : {}),
      ...(filters.bedrooms ? { bedrooms: { gte: filters.bedrooms } } : {}),
      ...(filters.bathrooms ? { bathrooms: { gte: filters.bathrooms } } : {}),
      ...(filters.furnished ? { furnished: filters.furnished } : {}),
      ...(filters.maxPrice ? { price: { lte: filters.maxPrice } } : {}),
      ...(filters.minPrice ? { price: { gte: filters.minPrice } } : {}),
      ...(filters.location
        ? {
            OR: [
              { regionName: { contains: filters.location } },
              { districtName: { contains: filters.location } },
              { wardName: { contains: filters.location } },
              { address: { contains: filters.location } },
              { title: { contains: filters.location } },
            ],
          }
        : {}),
    },
    include: {
      media: { orderBy: { sortOrder: "asc" } },
      listedBy: { select: { id: true, firstName: true, lastName: true, role: true, agencyName: true } },
    },
    orderBy: [{ viewsCount: "desc" }, { createdAt: "desc" }],
    take,
  });
}

export async function recommendForUser(userId: string, take = 6) {
  const [favorites, views, searches] = await Promise.all([
    prisma.favorite.findMany({
      where: { userId },
      include: { property: { include: { amenities: true } } },
      take: 20,
      orderBy: { createdAt: "desc" },
    }),
    prisma.propertyView.findMany({
      where: { userId },
      include: { property: true },
      take: 30,
      orderBy: { createdAt: "desc" },
    }),
    prisma.searchHistory.findMany({
      where: { userId },
      take: 15,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const signals = [...favorites.map((f) => f.property), ...views.map((v) => v.property)].filter(Boolean);
  const preferredTypes = mode(signals.map((p) => p.propertyType));
  const preferredRegions = mode(signals.map((p) => p.regionName));
  const prices = signals.map((p) => p.price);
  const avgPrice = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : undefined;
  const bedrooms = mode(signals.map((p) => String(p.bedrooms)));

  const searchText = searches.map((s) => `${s.query} ${s.filters ?? ""}`).join(" ").toLowerCase();
  const parsed = parseAssistantQuery(searchText);

  const filters: AssistantFilters = {
    propertyType: parsed.propertyType ?? preferredTypes,
    location: parsed.location ?? preferredRegions,
    bedrooms: parsed.bedrooms ?? (bedrooms ? Number(bedrooms) : undefined),
    maxPrice: parsed.maxPrice ?? (avgPrice ? Math.round(avgPrice * 1.25) : undefined),
    minPrice: avgPrice ? Math.round(avgPrice * 0.5) : undefined,
  };

  const savedIds = new Set(favorites.map((f) => f.propertyId));
  const results = await searchByFilters(filters, take + 8);
  const ranked = results.filter((p) => !savedIds.has(p.id)).slice(0, take);

  const explanation = buildExplanation(filters, ranked.length);
  return { filters, properties: ranked, explanation };
}

function mode(values: string[]) {
  const counts = new Map<string, number>();
  for (const value of values.filter(Boolean)) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  let best: string | undefined;
  let n = 0;
  for (const [key, count] of counts) {
    if (count > n) {
      best = key;
      n = count;
    }
  }
  return best;
}

export function buildExplanation(filters: AssistantFilters, count: number) {
  const bits: string[] = [];
  if (filters.bedrooms) bits.push(`${filters.bedrooms}-bedroom`);
  if (filters.propertyType) bits.push(filters.propertyType.replaceAll("_", " ").toLowerCase());
  else bits.push("homes");
  if (filters.location) bits.push(`in ${filters.location}`);
  if (filters.maxPrice) {
    const m = filters.maxPrice >= 1_000_000 ? `${Math.round(filters.maxPrice / 1_000_000)}M` : String(filters.maxPrice);
    bits.push(`under TZS ${m}`);
  }
  if (!count) {
    return "We could not find an exact match yet, so here are popular verified listings you may like.";
  }
  return `Based on your recent searches, you may be interested in these ${bits.join(" ")}.`;
}

export function adviceForQuestion(message: string) {
  const text = message.toLowerCase();
  if (text.includes("land") && (text.includes("consider") || text.includes("buy") || text.includes("buying"))) {
    return [
      "Confirm title deed, survey plan, and that the seller is the registered owner.",
      "Check land use (residential, agricultural, commercial) with the local authority.",
      "Inspect access roads, water, electricity, and flood risk before paying a deposit.",
      "Budget for legal fees, stamp duty, and possible boundary disputes.",
      "Never pay the full amount without a written sale agreement reviewed by a lawyer.",
    ].join(" ");
  }
  if (text.includes("city center") || text.includes("cbd") || text.includes("near the city")) {
    return "City-center listings trade convenience for noise and price. Look at commute time, parking, and whether the building has backup power and water.";
  }
  return null;
}

export async function runAssistant(message: string, userId?: string) {
  if (process.env.OPENAI_API_KEY) {
    try {
      const ai = await callOpenAI(message);
      if (ai?.filters) {
        const properties = await searchByFilters(ai.filters, 6);
        return {
          reply: ai.reply ?? buildExplanation(ai.filters, properties.length),
          filters: ai.filters,
          properties,
        };
      }
    } catch (error) {
      console.error("OpenAI assistant fallback", error);
    }
  }

  const advice = adviceForQuestion(message);
  const filters = parseAssistantQuery(message);
  const properties = await searchByFilters(filters, 6);
  const reply =
    advice ??
    (properties.length
      ? buildExplanation(filters, properties.length)
      : "I could not find matching listings. Try a different location, price range, or property type.");

  if (userId) {
    await prisma.searchHistory.create({
      data: { userId, query: message, filters: JSON.stringify(filters) },
    });
  }

  return { reply, filters, properties };
}

async function callOpenAI(message: string) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "You are EstateHub's property assistant for Tanzania. Return JSON {reply, filters} where filters may include location, propertyType (HOUSE|APARTMENT|VILLA|LAND|OFFICE|SHOP|WAREHOUSE|COMMERCIAL_BUILDING|HOTEL|FARM|OTHER), listingType (FOR_SALE|FOR_RENT|SHORT_TERM_RENTAL|LEASE), minPrice, maxPrice, bedrooms, bathrooms, furnished.",
        },
        { role: "user", content: message },
      ],
      response_format: { type: "json_object" },
    }),
  });
  if (!response.ok) return null;
  const data = await response.json();
  return JSON.parse(data.choices?.[0]?.message?.content ?? "{}") as {
    reply?: string;
    filters?: AssistantFilters;
  };
}
