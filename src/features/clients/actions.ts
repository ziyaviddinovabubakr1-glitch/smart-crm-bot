"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  getCurrentSession,
  resolveUserInDatabase,
  setSession,
} from "@/lib/auth";
import { hasPermission } from "@/core/permissions/roles";
import {
  archiveClient,
  createClient,
  parseClientBody,
  updateClient,
} from "@/services/clients";
import { createDeal, updateDealStage } from "@/services/deals";
import { addClientNote, createInteraction, updateInteractionStatus } from "@/services/interactions";
import type { DealStage, InteractionStatus, InteractionType, Client, SessionUser } from "@/types";

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

export type CreateClientFormState = {
  success?: boolean;
  error?: string;
  message?: string;
  clientId?: string;
} | null;

export type CreateClientResult = {
  success: boolean;
  error?: string;
  message?: string;
  data?: Client;
};

function readField(formData: FormData, snake: string, camel: string): string {
  return String(formData.get(snake) ?? formData.get(camel) ?? "").trim();
}

function readOptionalField(formData: FormData, snake: string, camel: string): string | undefined {
  const value = String(formData.get(snake) ?? formData.get(camel) ?? "").trim();
  return value || undefined;
}

export async function createClientFromForm(formData: FormData): Promise<CreateClientResult> {
  try {
    const session = await getCurrentSession();

    if (!session?.user?.id) {
      return {
        success: false,
        error: "Пользователь не авторизован. Выйдите и войдите снова.",
      };
    }

    ensureWrite(session.user.role);

    const firstName = readField(formData, "first_name", "firstName");
    const lastName = readField(formData, "last_name", "lastName");
    const email = readField(formData, "email", "email") || null;
    const phone = readField(formData, "phone", "phone");
    const company = readField(formData, "company", "company") || null;

    if (!firstName || !phone) {
      return {
        success: false,
        error: "Имя и телефон обязательны для заполнения",
      };
    }

    const resolvedUser = resolveUserInDatabase(sessionUser(session));
    if (!resolvedUser) {
      return {
        success: false,
        error: "Пользователь не найден в базе. Выйдите и войдите снова.",
      };
    }

    const client = await createClient(resolvedUser, {
      first_name: firstName,
      last_name: lastName,
      company,
      phone,
      email,
      source: readOptionalField(formData, "source", "source") as never,
      status: readOptionalField(formData, "status", "status") as never,
      tags: String(formData.get("tags") ?? "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    });

    await setSession(resolvedUser);
    revalidatePath("/clients", "page");
    revalidatePath(`/clients/${client.id}`, "page");
    revalidatePath("/dashboard", "page");

    return {
      success: true,
      data: client,
      message: `Клиент ${firstName} успешно создан!`,
    };
  } catch (error) {
    console.error("[CREATE_CLIENT_ERROR]", error);

    if (error instanceof Error && error.message === "USER_NOT_FOUND") {
      return {
        success: false,
        error: "Пользователь не найден в базе. Выйдите и войдите снова.",
      };
    }

    if (error instanceof Error) {
      if (error.message.includes("CHECK constraint failed: source")) {
        return {
          success: false,
          error: "Некорректный источник клиента. Выберите другой источник или оставьте «Вручную».",
        };
      }

      try {
        const validation = JSON.parse(error.message) as Record<string, string>;
        if (typeof validation === "object" && validation !== null) {
          return {
            success: false,
            error: Object.values(validation).join(". "),
          };
        }
      } catch {
        // not validation JSON
      }

      if (error.message === "FORBIDDEN") {
        return { success: false, error: "Недостаточно прав для создания клиента" };
      }

      return {
        success: false,
        error: error.message || "Не удалось создать клиента",
      };
    }

    return { success: false, error: "Неизвестная ошибка" };
  }
}

/** Direct call from client components (returns result, no redirect). */
export async function createClientAction(formData: FormData): Promise<CreateClientResult> {
  return createClientFromForm(formData);
}

/** useActionState handler — redirects to client card on success. */
export async function submitClientQuickForm(
  _prevState: CreateClientFormState,
  formData: FormData
): Promise<CreateClientFormState> {
  const result = await createClientFromForm(formData);

  if (!result.success || !result.data) {
    return {
      success: false,
      error: result.error ?? "Не удалось создать клиента",
    };
  }

  const name = result.data.first_name.trim();
  const params = new URLSearchParams({ view: "table", created: result.data.id });
  if (name) params.set("search", name);
  redirect(`/clients?${params.toString()}`);
}

export async function updateClientAction(id: string, formData: FormData) {
  const session = await getCurrentSession();
  if (!session?.user) throw new Error("UNAUTHORIZED");
  ensureWrite(session.user.role);

  await updateClient(sessionUser(session), id, parseClientBody(Object.fromEntries(formData.entries())));
  revalidatePath(`/clients/${id}`);
  revalidatePath("/clients");
}

export async function archiveClientAction(id: string) {
  const session = await getCurrentSession();
  if (!session?.user) throw new Error("UNAUTHORIZED");
  ensureWrite(session.user.role);
  await archiveClient(sessionUser(session), id);
  revalidatePath("/clients");
  revalidatePath("/dashboard");
}

export async function addNoteFormAction(formData: FormData) {
  const session = await getCurrentSession();
  if (!session?.user) throw new Error("UNAUTHORIZED");
  ensureWrite(session.user.role);
  const clientId = String(formData.get("client_id") ?? "");
  const text = String(formData.get("text") ?? "");
  await addClientNote(sessionUser(session), clientId, text);
  revalidatePath(`/clients/${clientId}`);
}

export async function createDealFormAction(formData: FormData) {
  const session = await getCurrentSession();
  if (!session?.user) throw new Error("UNAUTHORIZED");
  ensureWrite(session.user.role);
  const clientId = String(formData.get("client_id") ?? "");
  await createDeal(sessionUser(session), {
    client_id: clientId,
    title: String(formData.get("title") ?? "Новая сделка"),
    amount: Number(formData.get("amount") ?? 0),
    currency: String(formData.get("currency") ?? "RUB"),
    comment: String(formData.get("comment") ?? "") || null,
  });
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/deals");
  revalidatePath("/dashboard");
}

export async function moveDealStageAction(dealId: string, stage: string) {
  const session = await getCurrentSession();
  if (!session?.user) throw new Error("UNAUTHORIZED");
  ensureWrite(session.user.role);
  await updateDealStage(sessionUser(session), dealId, stage as DealStage);
  revalidatePath("/deals");
  revalidatePath("/dashboard");
}

export async function addNoteAction(clientId: string, text: string) {
  const session = await getCurrentSession();
  if (!session?.user) throw new Error("UNAUTHORIZED");
  ensureWrite(session.user.role);
  await addClientNote(sessionUser(session), clientId, text);
  revalidatePath(`/clients/${clientId}`);
}

export async function addInteractionAction(input: {
  client_id: string;
  deal_id?: string | null;
  type: InteractionType;
  content: string;
  scheduled_at?: string | null;
}) {
  const session = await getCurrentSession();
  if (!session?.user) throw new Error("UNAUTHORIZED");
  ensureWrite(session.user.role);
  await createInteraction(sessionUser(session), input);
  revalidatePath(`/clients/${input.client_id}`);
  revalidatePath("/dashboard");
}

export async function completeTaskAction(id: string, clientId: string) {
  const session = await getCurrentSession();
  if (!session?.user) throw new Error("UNAUTHORIZED");
  ensureWrite(session.user.role);
  await updateInteractionStatus(sessionUser(session), id, "completed");
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/dashboard");
}

export async function updateClientStatusAction(clientId: string, status: string) {
  const session = await getCurrentSession();
  if (!session?.user) throw new Error("UNAUTHORIZED");
  ensureWrite(session.user.role);

  const { updateClientStatus } = await import("@/services/clients");
  await updateClientStatus(sessionUser(session), clientId, status as never);
  revalidatePath("/clients");
  revalidatePath(`/clients/${clientId}`);
}
