import { and, eq, gt, lt } from "drizzle-orm";
import type { AppDatabase } from "../db";
import { userSessions, users } from "../db/schema";
import { sha256Hex } from "../security/rateLimit";

export const SESSION_COOKIE = "luy_session";
export const OAUTH_STATE_COOKIE = "luy_oauth_state";
export const OAUTH_NEXT_COOKIE = "luy_oauth_next";
export const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

export type SessionUser = {
  id: string;
  githubId: string;
  username: string;
  email: string | null;
  avatarUrl: string | null;
  role: "user" | "admin";
  status: "active" | "banned";
  createdAt: string;
};

export function generateSecureToken(byteLength = 32): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function constantTimeEqual(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const aBytes = encoder.encode(a);
  const bBytes = encoder.encode(b);
  if (aBytes.length !== bBytes.length) return false;
  let diff = 0;
  for (let i = 0; i < aBytes.length; i += 1) {
    diff |= (aBytes[i] ?? 0) ^ (bBytes[i] ?? 0);
  }
  return diff === 0;
}

export function sanitizeNextPath(next: string | null | undefined): string {
  if (!next) return "/";
  const trimmed = next.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.includes("\\")) {
    return "/";
  }
  for (let i = 0; i < trimmed.length; i += 1) {
    const code = trimmed.charCodeAt(i);
    if (code < 0x20 || code === 0x7f) return "/";
  }
  return trimmed;
}

export function isAdminGithubId(githubId: string, envAdminIds?: string | null): boolean {
  if (!envAdminIds) return false;
  const allowSet = new Set(
    envAdminIds
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
  );
  return allowSet.has(githubId);
}

export function parseCookieHeader(cookieHeader: string | null | undefined, name: string): string | null {
  if (!cookieHeader) return null;
  const prefix = `${name}=`;
  for (const part of cookieHeader.split(";")) {
    const trimmed = part.trim();
    if (trimmed.startsWith(prefix)) {
      const raw = trimmed.slice(prefix.length);
      try {
        return decodeURIComponent(raw);
      } catch {
        return raw;
      }
    }
  }
  return null;
}

export function formatCookieHeader(
  name: string,
  value: string,
  options: { maxAge: number; secure: boolean },
): string {
  return `${name}=${encodeURIComponent(value)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${options.maxAge}${options.secure ? "; Secure" : ""}`;
}

export function isHttpsUrl(url: string | undefined): boolean {
  if (!url) return false;
  return url.startsWith("https://");
}

export async function getSessionUserFromToken(
  db: AppDatabase,
  rawToken: string | null | undefined,
): Promise<SessionUser | null> {
  if (!rawToken?.trim()) return null;
  const tokenHash = await sha256Hex(rawToken.trim());
  const now = new Date();

  const row = await db
    .select({
      id: users.id,
      githubId: users.githubId,
      username: users.username,
      email: users.email,
      avatarUrl: users.avatarUrl,
      role: users.role,
      status: users.status,
      createdAt: users.createdAt,
    })
    .from(userSessions)
    .innerJoin(users, eq(userSessions.userId, users.id))
    .where(and(eq(userSessions.sessionToken, tokenHash), gt(userSessions.expiresAt, now)))
    .get();

  if (!row || row.status === "banned") {
    return null;
  }

  return {
    id: row.id,
    githubId: row.githubId,
    username: row.username,
    email: row.email,
    avatarUrl: row.avatarUrl,
    role: row.role,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function createSession(
  db: AppDatabase,
  userId: string,
): Promise<{ rawToken: string; expiresAt: Date }> {
  const rawToken = generateSecureToken(32);
  const tokenHash = await sha256Hex(rawToken);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_MAX_AGE_SECONDS * 1000);

  await db.delete(userSessions).where(and(eq(userSessions.userId, userId), lt(userSessions.expiresAt, now)));

  await db.insert(userSessions).values({
    userId,
    sessionToken: tokenHash,
    expiresAt,
    createdAt: now,
  });

  return { rawToken, expiresAt };
}

export async function deleteSessionByToken(db: AppDatabase, rawToken: string): Promise<void> {
  if (!rawToken.trim()) return;
  const tokenHash = await sha256Hex(rawToken.trim());
  await db.delete(userSessions).where(eq(userSessions.sessionToken, tokenHash));
}

export async function revokeUserSessions(db: AppDatabase, userId: string): Promise<void> {
  await db.delete(userSessions).where(eq(userSessions.userId, userId));
}
