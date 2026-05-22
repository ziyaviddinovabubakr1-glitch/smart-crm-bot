import { NextRequest, NextResponse } from "next/server";
import { buildSessionToken, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth/cookie";
import { jsonError, jsonOk, parseJsonBody, wantsJson } from "@/lib/api/helpers";
import { registerUser, toPublicUser } from "@/services/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await parseJsonBody<{
      email?: string;
      password?: string;
      name?: string;
      role?: "admin" | "manager" | "sales" | "viewer";
    }>(request);

    const result = await registerUser({
      email: body.email ?? "",
      password: body.password ?? "",
      name: body.name ?? "",
      role: body.role,
    });

    if (!result.ok) {
      return jsonError(result.error, result.error === "email already registered" ? 409 : 400);
    }

    return jsonOk({ user: toPublicUser(result.user) }, 201);
  } catch {
    return jsonError("Invalid JSON body", 400);
  }
}
