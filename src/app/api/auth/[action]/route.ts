import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  clearSession,
  getSession,
  hashPassword,
  issueSession,
  publicUserSelect,
  rotateRefreshToken,
  verifyPassword,
} from "@/lib/auth";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "@/lib/validators";
import { createRawToken, hashToken, sendPasswordResetEmail, sendVerificationEmail } from "@/lib/email";
import { notify } from "@/lib/notifications";

type Ctx = { params: Promise<{ action: string }> };

function limit(request: NextRequest, action: string, max: number) {
  const result = rateLimit(clientKey(request, action), max, 60_000);
  if (!result.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(result.retryAfter ?? 60) } },
    );
  }
  return null;
}

export async function GET(request: NextRequest, ctx: Ctx) {
  const { action } = await ctx.params;

  if (action === "me") {
    const user = await getSession();
    if (user) return NextResponse.json({ user });
    const refreshed = await rotateRefreshToken();
    if (refreshed) return NextResponse.json({ user: refreshed });
    return NextResponse.json({ user: null });
  }

  if (action === "verify-email") {
    const token = request.nextUrl.searchParams.get("token");
    if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });
    return verifyEmail(token);
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

export async function POST(request: NextRequest, ctx: Ctx) {
  const { action } = await ctx.params;

  if (action === "register") {
    const blocked = limit(request, "register", 8);
    if (blocked) return blocked;
    const parsed = registerSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }
      const data = parsed.data;
      const payload = {
        ...data,
        phone: data.phone || undefined,
        agencyName: data.agencyName || undefined,
        licenseNumber: data.licenseNumber || undefined,
      };
      if (payload.role === "ADMIN") {
      return NextResponse.json({ error: "Admin accounts cannot be self-registered" }, { status: 400 });
    }

    const exists = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
    if (exists) return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });

    const user = await prisma.user.create({
      data: {
        email: payload.email.toLowerCase(),
        passwordHash: await hashPassword(payload.password),
        firstName: payload.firstName,
        lastName: payload.lastName,
        phone: payload.phone,
        role: payload.role,
        agencyName: payload.agencyName,
        licenseNumber: payload.licenseNumber,
      },
      select: publicUserSelect,
    });

    const raw = createRawToken();
    await prisma.verificationToken.create({
      data: {
        email: user.email,
        tokenHash: hashToken(raw),
        type: "EMAIL",
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
    const mail = await sendVerificationEmail(user.email, raw);
    await notify({
      userId: user.id,
      title: "Welcome to EstateHub",
      body: "Verify your email to unlock inquiries, viewings, and saved homes.",
      type: "system",
      link: "/dashboard",
    });

    return NextResponse.json({
      user,
      message: "Account created. Please verify your email.",
      ...(process.env.NODE_ENV !== "production" ? { verifyToken: raw, emailPreview: mail.preview } : {}),
    });
  }

  if (action === "login") {
    const blocked = limit(request, "login", 10);
    if (blocked) return blocked;
    const parsed = loginSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 400 });
    }
    const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
    if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }
    if (!user.isActive) {
      return NextResponse.json({ error: "This account has been disabled" }, { status: 403 });
    }
    if (!user.emailVerified) {
      return NextResponse.json(
        { error: "Please verify your email before signing in.", needsVerification: true },
        { status: 403 },
      );
    }
    await issueSession(user);
    const safe = await prisma.user.findUnique({ where: { id: user.id }, select: publicUserSelect });
    return NextResponse.json({ user: safe });
  }

  if (action === "logout") {
    await clearSession();
    return NextResponse.json({ ok: true });
  }

  if (action === "refresh") {
    const user = await rotateRefreshToken();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ user });
  }

  if (action === "forgot-password") {
    const blocked = limit(request, "forgot", 5);
    if (blocked) return blocked;
    const parsed = forgotPasswordSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Enter a valid email" }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
    const generic = { message: "If that email exists, we sent a reset link." };
    if (!user) return NextResponse.json(generic);

    const raw = createRawToken();
    await prisma.verificationToken.create({
      data: {
        email: user.email,
        tokenHash: hashToken(raw),
        type: "RESET",
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });
    const mail = await sendPasswordResetEmail(user.email, raw);
    return NextResponse.json({
      ...generic,
      ...(process.env.NODE_ENV !== "production" ? { resetToken: raw, emailPreview: mail.preview } : {}),
    });
  }

  if (action === "reset-password") {
    const parsed = resetPasswordSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }
    const tokenHash = hashToken(parsed.data.token);
    const record = await prisma.verificationToken.findFirst({
      where: { tokenHash, type: "RESET", expiresAt: { gt: new Date() } },
    });
    if (!record) return NextResponse.json({ error: "Reset link is invalid or expired" }, { status: 400 });

    await prisma.user.update({
      where: { email: record.email },
      data: { passwordHash: await hashPassword(parsed.data.password) },
    });
    await prisma.verificationToken.deleteMany({ where: { email: record.email, type: "RESET" } });
    await prisma.refreshToken.updateMany({
      where: { user: { email: record.email } },
      data: { revoked: true },
    });
    return NextResponse.json({ message: "Password updated. You can sign in now." });
  }

  if (action === "verify-email") {
    const body = await request.json().catch(() => ({}));
    const token = String(body.token ?? "");
    if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });
    return verifyEmail(token);
  }

  if (action === "resend-verification") {
    const blocked = limit(request, "resend", 5);
    if (blocked) return blocked;
    const body = await request.json().catch(() => ({}));
    const email = String(body.email ?? "").toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.emailVerified) {
      return NextResponse.json({ message: "If the account exists, a new link was sent." });
    }
    const raw = createRawToken();
    await prisma.verificationToken.create({
      data: {
        email,
        tokenHash: hashToken(raw),
        type: "EMAIL",
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
    const mail = await sendVerificationEmail(email, raw);
    return NextResponse.json({
      message: "If the account exists, a new link was sent.",
      ...(process.env.NODE_ENV !== "production" ? { verifyToken: raw, emailPreview: mail.preview } : {}),
    });
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

async function verifyEmail(token: string) {
  const record = await prisma.verificationToken.findFirst({
    where: { tokenHash: hashToken(token), type: "EMAIL", expiresAt: { gt: new Date() } },
  });
  if (!record) return NextResponse.json({ error: "Verification link is invalid or expired" }, { status: 400 });

  const user = await prisma.user.update({
    where: { email: record.email },
    data: { emailVerified: true },
    select: publicUserSelect,
  });
  await prisma.verificationToken.deleteMany({ where: { email: record.email, type: "EMAIL" } });
  await issueSession(user);
  return NextResponse.json({ user, message: "Email verified" });
}
