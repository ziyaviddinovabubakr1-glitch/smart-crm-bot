"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import { hasPermission } from "@/core/permissions/roles";
import { createDeal, updateDeal, updateDealStage } from "@/services/deals";
import type { DealStage, SessionUser } from "@/types";

function sessionUser(session: NonNullable<Awaited<ReturnType<typeof getCurrentSession>>>): SessionUser {
  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role,
  };
}

function ensureWrite(role: SessionUser["role"]) {
  if (!hasPermission(role, "clients:write")) {
    throw new Error("FORBIDDEN");
  }
}

export async function createDealFormAction(formData: FormData) {
  const session = await getCurrentSession();
  if (!session?.user) throw new Error("UNAUTHORIZED");
  ensureWrite(session.user.role);

  const clientId = String(formData.get("client_id") ?? "");
  const deal = await createDeal(sessionUser(session), {
    client_id: clientId,
    title: String(formData.get("title") ?? "Новая сделка"),
    amount: Number(formData.get("amount") ?? 0),
    currency: String(formData.get("currency") ?? "RUB"),
    stage: (formData.get("stage") as DealStage) ?? "new",
    comment: String(formData.get("comment") ?? "") || null,
  });

  revalidatePath("/deals");
  revalidatePath("/dashboard");
  if (clientId) revalidatePath(`/clients/${clientId}`);

  if (deal) redirect(`/deals/${deal.id}`);
}

export async function updateDealFormAction(dealId: string, formData: FormData) {
  const session = await getCurrentSession();
  if (!session?.user) throw new Error("UNAUTHORIZED");
  ensureWrite(session.user.role);

  await updateDeal(sessionUser(session), dealId, {
    title: String(formData.get("title") ?? ""),
    amount: Number(formData.get("amount") ?? 0),
    currency: String(formData.get("currency") ?? "RUB"),
    probability: Number(formData.get("probability") ?? 50),
    payment_status: formData.get("payment_status") as import("@/types").PaymentStatus,
    stage: formData.get("stage") as DealStage,
    close_date: String(formData.get("close_date") ?? "") || null,
    comment: String(formData.get("comment") ?? "") || null,
  });

  revalidatePath(`/deals/${dealId}`);
  revalidatePath("/deals");
  revalidatePath("/dashboard");
}

export async function moveDealStageAction(dealId: string, stage: DealStage) {
  const session = await getCurrentSession();
  if (!session?.user) throw new Error("UNAUTHORIZED");
  ensureWrite(session.user.role);
  await updateDealStage(sessionUser(session), dealId, stage);
  revalidatePath("/deals");
  revalidatePath(`/deals/${dealId}`);
  revalidatePath("/dashboard");
}
