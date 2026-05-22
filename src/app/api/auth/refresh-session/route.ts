import { NextRequest, NextResponse } from "next/server";
import {
  buildSessionToken,
  SESSION_COOKIE,
  sessionCookieOptions,
  verifySessionToken,
} from "@/lib/auth/cookie";
import { resolveUserInDatabase } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ ok: false, error: "no_session" }, { status: 401 });
  }

  const tokenUser = await verifySessionToken(token);
  if (!tokenUser) {
    return NextResponse.json({ ok: false, error: "invalid_session" }, { status: 401 });
  }

  const user = resolveUserInDatabase(tokenUser);
  if (!user) {
    return NextResponse.json({ ok: false, error: "user_not_found" }, { status: 401 });
  }

  const response = NextResponse.json({
    ok: true,
    refreshed: user.id !== tokenUser.id,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });

  if (user.id !== tokenUser.id || user.email !== tokenUser.email) {
    response.cookies.set(
      SESSION_COOKIE,
      await buildSessionToken(user),
      sessionCookieOptions()
    );
  }

  return response;
}
