"use server";

import { redirect } from "next/navigation";
import { login, setSession, clearSession } from "@/lib/auth";

export async function loginAction(_prev: { error?: string } | null, formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  let next = String(formData.get("next") ?? "/dashboard");

  if (!next.startsWith("/") || next.startsWith("//")) {
    next = "/dashboard";
  }

  const user = await login(email, password);
  if (!user) {
    return { error: "Invalid email or password" };
  }

  await setSession(user);
  redirect(next === "/" ? "/dashboard" : next);
}

export async function logoutAction() {
  await clearSession();
  redirect("/login");
}
