import { NextRequest, NextResponse } from "next/server";
import { login } from "@/lib/auth";
import {
  buildSessionToken,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/auth/cookie";
import { jsonError, jsonOk, wantsJson } from "@/lib/api/helpers";
import { getUserById } from "@/services/users";
import { toPublicUser } from "@/services/auth";

export async function POST(request: NextRequest) {
  let email = "";
  let password = "";
  let next = "/dashboard";

  if (wantsJson(request)) {
    try {
      const body = (await request.json()) as { email?: string; password?: string };
      email = String(body.email ?? "");
      password = String(body.password ?? "");
    } catch {
      return jsonError("Invalid JSON body", 400);
    }
  } else {
    const formData = await request.formData();
    email = String(formData.get("email") ?? "");
    password = String(formData.get("password") ?? "");
    next = String(formData.get("next") ?? "/dashboard");
    if (!next.startsWith("/") || next.startsWith("//")) next = "/dashboard";
    if (next === "/") next = "/dashboard";
  }

  const user = await login(email, password);
  if (!user) {
    if (wantsJson(request)) {
      return jsonError("Invalid credentials", 401);
    }
    const url = new URL("/login", request.url);
    url.searchParams.set("error", "invalid");
    url.searchParams.set("next", next);
    return NextResponse.redirect(url);
  }

  const profile = await getUserById(user.id);
  const token = await buildSessionToken(user);
  const cookieOpts = sessionCookieOptions();

  if (wantsJson(request)) {
    const response = jsonOk({
      user: profile ? toPublicUser(profile) : user,
      onboarding_required: profile ? !profile.onboarding_completed : false,
    });
    response.cookies.set(SESSION_COOKIE, token, cookieOpts);
    return response;
  }

  const destination =
    profile && !profile.onboarding_completed ? "/onboarding" : next;
  const response = NextResponse.redirect(new URL(destination, request.url));
  response.cookies.set(SESSION_COOKIE, token, cookieOpts);
  return response;
}
