import { NextRequest, NextResponse } from "next/server";
import {
  buildSessionToken,
  SESSION_COOKIE,
  sessionCookieOptions,
  verifySessionToken,
} from "@/lib/auth/cookie";
import { requireApiSession } from "@/lib/auth/api";
import { globalSearch } from "@/services/search";

export async function GET(request: NextRequest) {
  const { session, error } = await requireApiSession(request);
  if (error || !session) return error!;

  const q = request.nextUrl.searchParams.get("q") ?? "";
  const results = await globalSearch(session, q);

  const response = NextResponse.json({ results });

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (token) {
    const tokenUser = await verifySessionToken(token);
    if (tokenUser && tokenUser.id !== session.id) {
      response.cookies.set(
        SESSION_COOKIE,
        await buildSessionToken(session),
        sessionCookieOptions()
      );
    }
  }

  return response;
}
