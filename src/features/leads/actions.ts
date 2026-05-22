"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canWriteLeads } from "@/core/permissions/roles";
import { requireSession } from "@/lib/auth";
import { convertLeadToClient } from "@/services/clients";
import { addNote } from "@/services/notes";
import { createReminder } from "@/services/reminders";
import { updateLeadStatus, updateLeadNextCall } from "@/services/leads";
import { logActivity } from "@/services/activities";
import type { LeadStatus } from "@/types";

export async function updateStatusAction(leadId: string, status: LeadStatus) {
  const session = await requireSession();
  if (!canWriteLeads(session.role)) return { error: "Forbidden" };

  await updateLeadStatus(leadId, status, session.id);
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/leads");
  revalidatePath("/pipeline");
  revalidatePath("/dashboard");
}

export async function addNoteAction(leadId: string, content: string) {
  const session = await requireSession();
  if (!canWriteLeads(session.role)) return { error: "Forbidden" };
  if (!content.trim()) return { error: "Empty note" };

  await addNote(leadId, content.trim());
  await logActivity({
    leadId,
    userId: session.id,
    type: "note",
    content: content.trim(),
  });
  revalidatePath(`/leads/${leadId}`);
  return { ok: true };
}

export async function addReminderAction(
  leadId: string,
  remindAt: string,
  comment?: string
) {
  const session = await requireSession();
  if (!canWriteLeads(session.role)) return { error: "Forbidden" };

  await createReminder(leadId, remindAt, comment);
  await logActivity({
    leadId,
    userId: session.id,
    type: "call",
    content: comment?.trim() || "Reminder scheduled",
    metadata: { remindAt },
  });
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function setNextCallAction(leadId: string, nextCall: string | null) {
  const session = await requireSession();
  if (!canWriteLeads(session.role)) return { error: "Forbidden" };

  await updateLeadNextCall(leadId, nextCall);
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function moveLeadStageAction(leadId: string, status: LeadStatus) {
  return updateStatusAction(leadId, status);
}

export async function convertLeadAction(leadId: string) {
  const session = await requireSession();
  if (!canWriteLeads(session.role)) return { ok: false, error: "Forbidden" };

  const result = await convertLeadToClient(session, leadId);
  if (!result.ok) return { ok: false, error: result.error };

  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/leads");
  revalidatePath("/clients");
  revalidatePath("/dashboard");
  redirect(`/clients/${result.client.id}?converted=1`);
}
