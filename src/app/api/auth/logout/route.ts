import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/cookie";
import { jsonOk, wantsJson } from "@/lib/api/helpers";

export async function POST(request: NextRequest) {
  if (wantsJson(request)) {
    const response = jsonOk({ ok: true });
    response.cookies.delete(SESSION_COOKIE);
    return response;
  }

  const response = NextResponse.redirect(new URL("/login", request.url));
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
