import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken } from "@/lib/jwt";
import type { Role } from "@/lib/constants";

export const ACCESS_COOKIE = "estatehub_access";
export const REFRESH_COOKIE = "estatehub_refresh";

export const publicUserSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  avatar: true,
  bio: true,
  role: true,
  emailVerified: true,
  isActive: true,
  agencyName: true,
  licenseNumber: true,
  createdAt: true,
} as const;

export type PublicUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  avatar: string | null;
  bio: string | null;
  role: Role;
  emailVerified: boolean;
  isActive: boolean;
  agencyName: string | null;
  licenseNumber: string | null;
  createdAt: Date;
};

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

function cookieOptions(maxAge: number, path = "/") {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path,
    maxAge,
  };
}

export async function issueSession(user: { id: string; email: string; role: string }) {
  const refreshRecord = await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: "pending",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  const [access, refresh] = await Promise.all([
    signAccessToken({ sub: user.id, email: user.email, role: user.role }),
    signRefreshToken({ sub: user.id, jti: refreshRecord.id }),
  ]);

  const tokenHash = await bcrypt.hash(refresh, 10);
  await prisma.refreshToken.update({
    where: { id: refreshRecord.id },
    data: { tokenHash },
  });

  const jar = await cookies();
  jar.set(ACCESS_COOKIE, access, cookieOptions(15 * 60));
  jar.set(REFRESH_COOKIE, refresh, cookieOptions(7 * 24 * 60 * 60));

  return { access, refresh };
}

export async function clearSession() {
  const jar = await cookies();
  const refresh = jar.get(REFRESH_COOKIE)?.value;
  if (refresh) {
    try {
      const payload = await verifyRefreshToken(refresh);
      await prisma.refreshToken.updateMany({
        where: { id: payload.jti, revoked: false },
        data: { revoked: true },
      });
    } catch {
      // ignore invalid refresh on logout
    }
  }
  jar.set(ACCESS_COOKIE, "", cookieOptions(0));
  jar.set(REFRESH_COOKIE, "", cookieOptions(0));
}

export async function getSession(): Promise<PublicUser | null> {
  const jar = await cookies();
  const token = jar.get(ACCESS_COOKIE)?.value;
  if (!token) return null;

  try {
    const payload = await verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: publicUserSelect,
    });
    if (!user || !user.isActive) return null;
    return user as PublicUser;
  } catch {
    return null;
  }
}

export async function rotateRefreshToken() {
  const jar = await cookies();
  const token = jar.get(REFRESH_COOKIE)?.value;
  if (!token) return null;

  try {
    const payload = await verifyRefreshToken(token);
    const record = await prisma.refreshToken.findUnique({ where: { id: payload.jti } });
    if (!record || record.revoked || record.expiresAt < new Date()) return null;

    const matches = await bcrypt.compare(token, record.tokenHash);
    if (!matches) return null;

    await prisma.refreshToken.update({
      where: { id: record.id },
      data: { revoked: true },
    });

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: publicUserSelect,
    });
    if (!user || !user.isActive) return null;

    await issueSession(user);
    return user as PublicUser;
  } catch {
    return null;
  }
}

export async function requireUser() {
  const user = await getSession();
  if (!user) {
    return { user: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { user, error: null };
}

export async function requireRole(roles: Role[]) {
  const { user, error } = await requireUser();
  if (error || !user) return { user: null, error: error ?? NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if (!roles.includes(user.role)) {
    return { user: null, error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { user, error: null };
}
