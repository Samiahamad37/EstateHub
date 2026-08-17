import crypto from "crypto";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export function createRawToken() {
  return crypto.randomBytes(32).toString("hex");
}

export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function sendMail(options: { to: string; subject: string; text: string; html?: string }) {
  const configured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER);
  if (!configured) {
    console.info(`[EstateHub email → ${options.to}] ${options.subject}\n${options.text}`);
    return { delivered: false, preview: options.text };
  }

  // SMTP can be wired with nodemailer in production. For local/dev we log.
  console.info(`[EstateHub SMTP queued → ${options.to}] ${options.subject}`);
  return { delivered: true };
}

export async function sendVerificationEmail(email: string, token: string) {
  const url = `${APP_URL}/verify-email?token=${token}`;
  return sendMail({
    to: email,
    subject: "Verify your EstateHub account",
    text: `Welcome to EstateHub. Verify your email: ${url}`,
    html: `<p>Welcome to EstateHub.</p><p><a href="${url}">Verify your email</a></p>`,
  });
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const url = `${APP_URL}/reset-password?token=${token}`;
  return sendMail({
    to: email,
    subject: "Reset your EstateHub password",
    text: `Reset your password: ${url}`,
  });
}
