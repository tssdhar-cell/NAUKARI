// Shared by proxy.ts and server code, so it must not import "server-only" or next/headers.
import { jwtVerify, SignJWT } from "jose";

export const SESSION_COOKIE = "naukari_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function key(secret: string) {
  return new TextEncoder().encode(secret);
}

export async function signSessionToken(username: string, secret: string) {
  return new SignJWT({ sub: username })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(key(secret));
}

export async function verifySessionToken(token: string | undefined, secret: string | undefined) {
  if (!token || !secret) return null;
  try {
    const { payload } = await jwtVerify(token, key(secret), { algorithms: ["HS256"] });
    return typeof payload.sub === "string" ? { username: payload.sub } : null;
  } catch {
    return null;
  }
}
