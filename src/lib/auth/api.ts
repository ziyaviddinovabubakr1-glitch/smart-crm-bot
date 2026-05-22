import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/cookie";
import { resolveUserInDatabase } from "@/lib/auth/session";
import type { SessionUser } from "@/types";

export async function getApiSession(request: NextRequest): Promise<SessionUser | null> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const tokenUser = await verifySessionToken(token);
  if (!tokenUser) return null;

  return resolveUserInDatabase(tokenUser);
}

export async function requireApiSession(request: NextRequest) {
  const session = await getApiSession(request);
  if (!session) {
    return { session: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { session, error: null };
}

export function canWrite(session: SessionUser) {
  return session.role !== "viewer";
}
