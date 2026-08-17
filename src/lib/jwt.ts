import { SignJWT, jwtVerify } from "jose";

export type AccessPayload = {
  sub: string;
  email: string;
  role: string;
};

export type RefreshPayload = {
  sub: string;
  jti: string;
};

function accessSecret() {
  return new TextEncoder().encode(process.env.JWT_ACCESS_SECRET ?? "dev-access");
}

function refreshSecret() {
  return new TextEncoder().encode(process.env.JWT_REFRESH_SECRET ?? "dev-refresh");
}

export async function signAccessToken(payload: AccessPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(accessSecret());
}

export async function signRefreshToken(payload: RefreshPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(refreshSecret());
}

export async function verifyAccessToken(token: string) {
  const { payload } = await jwtVerify(token, accessSecret());
  return payload as AccessPayload & { iat: number; exp: number };
}

export async function verifyRefreshToken(token: string) {
  const { payload } = await jwtVerify(token, refreshSecret());
  return payload as RefreshPayload & { iat: number; exp: number };
}
