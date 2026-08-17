import { z } from "zod";
import {
  FURNISHED_STATUSES,
  LISTING_TYPES,
  PROPERTY_TYPES,
  ROLES,
  VIEWING_STATUSES,
} from "@/lib/constants";

export const registerSchema = z.object({
  firstName: z.string().min(2).max(60),
  lastName: z.string().min(2).max(60),
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, "Must include an uppercase letter")
    .regex(/[0-9]/, "Must include a number"),
  phone: z.string().min(7).max(20).optional().or(z.literal("")),
  role: z.enum(ROLES).default("CUSTOMER"),
  agencyName: z.string().max(120).optional(),
  licenseNumber: z.string().max(80).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, "Must include an uppercase letter")
    .regex(/[0-9]/, "Must include a number"),
});

export const profileSchema = z.object({
  firstName: z.string().min(2).max(60),
  lastName: z.string().min(2).max(60),
  phone: z.string().max(20).optional().nullable(),
  bio: z.string().max(800).optional().nullable(),
  avatar: z.string().max(500).optional().nullable(),
  agencyName: z.string().max(120).optional().nullable(),
  licenseNumber: z.string().max(80).optional().nullable(),
});

export const propertySchema = z.object({
  title: z.string().min(5).max(140),
  description: z.string().min(20).max(8000),
  propertyType: z.enum(PROPERTY_TYPES),
  listingType: z.enum(LISTING_TYPES),
  price: z.number().positive(),
  currency: z.string().default("TZS"),
  address: z.string().min(4),
  regionName: z.string().min(2),
  districtName: z.string().min(2),
  wardName: z.string().min(2),
  regionId: z.string().optional().nullable(),
  districtId: z.string().optional().nullable(),
  wardId: z.string().optional().nullable(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  bedrooms: z.number().int().min(0).default(0),
  bathrooms: z.number().int().min(0).default(0),
  parkingSpaces: z.number().int().min(0).default(0),
  propertySize: z.number().min(0).default(0),
  landSize: z.number().min(0).default(0),
  yearBuilt: z.number().int().min(1800).max(2100).optional().nullable(),
  furnished: z.enum(FURNISHED_STATUSES).default("UNFURNISHED"),
  availabilityStatus: z.string().default("AVAILABLE"),
  videoUrl: z.string().url().optional().nullable().or(z.literal("")),
  amenityIds: z.array(z.string()).default([]),
  images: z.array(z.string().min(1)).min(1),
  ownerId: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
});

export const viewingSchema = z.object({
  propertyId: z.string(),
  date: z.string().min(8),
  time: z.string().min(4),
  message: z.string().max(1000).optional(),
});

export const viewingStatusSchema = z.object({
  status: z.enum(VIEWING_STATUSES),
});

export const messageSchema = z.object({
  body: z.string().min(1).max(4000),
});

export const conversationSchema = z.object({
  recipientId: z.string(),
  propertyId: z.string().optional(),
  body: z.string().min(1).max(4000),
});

export const assistantSchema = z.object({
  message: z.string().min(2).max(1000),
});
