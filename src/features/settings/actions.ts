"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { hasPermission } from "@/core/permissions/roles";
import { changeUserPassword } from "@/services/auth-users";
import {
  addClientFieldDefinition,
  deleteClientFieldDefinition,
} from "@/services/custom-fields";
import { updateNotificationSettings } from "@/services/notifications";
import {
  addPipelineStage,
  deletePipelineStage,
  updatePipelineStage,
} from "@/services/pipeline-stages";
import type { CustomFieldType } from "@/types";

function ensureAdmin(role: Awaited<ReturnType<typeof requireSession>>["role"]) {
  if (!hasPermission(role, "users:manage")) {
    throw new Error("FORBIDDEN");
  }
}

export async function changePasswordAction(formData: FormData) {
  const session = await requireSession();
  const current = String(formData.get("current_password") ?? "");
  const next = String(formData.get("new_password") ?? "");
  const confirm = String(formData.get("confirm_password") ?? "");

  if (next !== confirm) {
    return { ok: false, error: "mismatch" as const };
  }

  const result = await changeUserPassword(session.id, current, next);
  return result;
}

export async function updateNotificationSettingsAction(formData: FormData) {
  const session = await requireSession();
  await updateNotificationSettings(session.id, {
    email_enabled: formData.get("email_enabled") === "on",
    in_app_enabled: formData.get("in_app_enabled") !== "off",
  });
  revalidatePath("/settings");
  return { ok: true };
}

export async function updateStageAction(formData: FormData) {
  const session = await requireSession();
  ensureAdmin(session.role);

  await updatePipelineStage(String(formData.get("id")), {
    label: String(formData.get("label") ?? ""),
    sort_order: Number(formData.get("sort_order") ?? 0),
  });
  revalidatePath("/settings");
  revalidatePath("/deals");
}

export async function addStageAction(formData: FormData) {
  const session = await requireSession();
  ensureAdmin(session.role);

  await addPipelineStage(
    String(formData.get("label") ?? ""),
    String(formData.get("value") ?? "") || undefined
  );
  revalidatePath("/settings");
  revalidatePath("/deals");
}

export async function deleteStageAction(formData: FormData) {
  const session = await requireSession();
  ensureAdmin(session.role);

  const result = await deletePipelineStage(String(formData.get("id")));
  revalidatePath("/settings");
  revalidatePath("/deals");
  return result;
}

export async function addCustomFieldAction(formData: FormData) {
  const session = await requireSession();
  ensureAdmin(session.role);

  await addClientFieldDefinition({
    field_key: String(formData.get("field_key") ?? ""),
    label: String(formData.get("label") ?? ""),
    field_type: String(formData.get("field_type") ?? "text") as CustomFieldType,
    options: String(formData.get("options") ?? "")
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean),
  });
  revalidatePath("/settings");
  revalidatePath("/clients");
}

export async function deleteCustomFieldAction(formData: FormData) {
  const session = await requireSession();
  ensureAdmin(session.role);

  await deleteClientFieldDefinition(String(formData.get("id")));
  revalidatePath("/settings");
  revalidatePath("/clients");
}
