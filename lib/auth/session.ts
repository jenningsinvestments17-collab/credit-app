import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { hashOpaqueToken } from "@/lib/auth/tokens";
import { createSessionRecord, findActiveSessionById, revokeSession, touchSession } from "@/lib/db/auth";

export const AUTH_SESSION_COOKIE = "credu_auth_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 12;

type AuthCookiePayload = {
  sessionId: string;
  token: string;
  userId: string;
  role: "client" | "admin" | "super_admin";
  userType: "client" | "admin";
};

function sign(value: string) {
  return createHmac("sha256", env.APP_SESSION_SECRET).update(value).digest("base64url");
}

function encodePayload(payload: AuthCookiePayload) {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decodePayload(value: string) {
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as AuthCookiePayload;
}

export function createSignedAuthCookie(payload: AuthCookiePayload) {
  const encoded = encodePayload(payload);
  return `${encoded}.${sign(encoded)}`;
}

export function verifySignedAuthCookie(cookieValue: string | undefined | null) {
  if (!cookieValue) {
    return null;
  }

  const [encoded, signature] = cookieValue.split(".");

  if (!encoded || !signature) {
    return null;
  }

  const expected = sign(encoded);
  const left = Buffer.from(signature, "utf8");
  const right = Buffer.from(expected, "utf8");

  if (left.length !== right.length || !timingSafeEqual(left, right)) {
    return null;
  }

  try {
    return decodePayload(encoded);
  } catch {
    return null;
  }
}

export async function issueAuthSession(input: {
  userId: string;
  role: "client" | "admin" | "super_admin";
  userType: "client" | "admin";
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  const sessionId = randomUUID();
  const token = randomUUID() + randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await createSessionRecord({
    id: sessionId,
    userId: input.userId,
    sessionTokenHash: hashOpaqueToken(token),
    ipAddress: input.ipAddress,
    userAgent: input.userAgent,
    expiresAt,
  });

  const cookieValue = createSignedAuthCookie({
    sessionId,
    token,
    userId: input.userId,
    role: input.role,
    userType: input.userType,
  });

  cookies().set(AUTH_SESSION_COOKIE, cookieValue, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });

  return { sessionId, token, expiresAt };
}

export function clearAuthSessionCookie() {
  cookies().delete(AUTH_SESSION_COOKIE);
}

export function getAuthCookiePayload() {
  const raw = cookies().get(AUTH_SESSION_COOKIE)?.value;
  return verifySignedAuthCookie(raw);
}

export async function getAuthenticatedSession() {
  const payload = getAuthCookiePayload();

  if (!payload) {
    return null;
  }

  const session = await findActiveSessionById(payload.sessionId);

  if (!session) {
    return null;
  }

  if (session.expiresAt.getTime() <= Date.now()) {
    await revokeSession(session.id);
    return null;
  }

  if (session.sessionTokenHash !== hashOpaqueToken(payload.token)) {
    await revokeSession(session.id);
    return null;
  }

  await touchSession(session.id).catch(() => null);
  return session;
}

export async function revokeCurrentSession() {
  const payload = getAuthCookiePayload();

  if (payload) {
    await revokeSession(payload.sessionId).catch(() => null);
  }

  clearAuthSessionCookie();
}
