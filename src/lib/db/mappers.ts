import type {
  Activity,
  AppNotification,
  Client,
  ClientNote,
  ClientSource,
  ClientStatus,
  CustomFieldType,
  Deal,
  DealStage,
  ClientFieldDefinition,
  Interaction,
  Lead,
  LeadSource,
  LeadStatus,
  Note,
  PaymentStatus,
  PipelineStage,
  Reminder,
  Task,
  TaskPriority,
  TaskStatus,
  TaskType,
  User,
} from "@/types";

type Row = Record<string, unknown>;

function parseJsonArray(value: unknown): string[] {
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

function parseJsonObject(value: unknown): Record<string, unknown> {
  if (typeof value !== "string") return {};
  try {
    const parsed = JSON.parse(value);
    return typeof parsed === "object" && parsed ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export function mapLead(row: Row): Lead {
  const recommendations = parseJsonArray(row.ai_recommendations);
  const score = (row.score as number) ?? (row.ai_score as number) ?? 0;

  return {
    id: row.id as string,
    name: row.name as string,
    phone: (row.phone as string | null) ?? null,
    email: (row.email as string | null) ?? null,
    message: (row.message as string | null) ?? null,
    telegram_user_id: (row.telegram_user_id as string | null) ?? null,
    telegram_chat_id: (row.telegram_chat_id as string | null) ?? null,
    source: row.source as LeadSource,
    status: row.status as LeadStatus,
    tags: parseJsonArray(row.tags),
    score,
    assigned_to: (row.assigned_to as string | null) ?? null,
    next_call: (row.next_call as string | null) ?? null,
    ai_score: (row.ai_score as number) ?? score,
    ai_temperature: (row.ai_temperature as Lead["ai_temperature"]) ?? null,
    ai_summary: (row.ai_summary as string | null) ?? null,
    ai_recommendations: recommendations,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export function mapNote(row: Row): Note {
  return {
    id: row.id as string,
    lead_id: row.lead_id as string,
    content: row.content as string,
    created_at: row.created_at as string,
  };
}

export function mapActivity(row: Row): Activity {
  return {
    id: row.id as string,
    lead_id: row.lead_id as string,
    user_id: (row.user_id as string | null) ?? null,
    type: row.type as Activity["type"],
    content: row.content as string,
    metadata: parseJsonObject(row.metadata),
    created_at: row.created_at as string,
  };
}

export function mapReminder(row: Row): Reminder {
  return {
    id: row.id as string,
    lead_id: row.lead_id as string,
    remind_at: row.remind_at as string,
    comment: (row.comment as string | null) ?? null,
    status: row.status as Reminder["status"],
    notified_at: (row.notified_at as string | null) ?? null,
    created_at: row.created_at as string,
  };
}

export function mapReminderWithLead(row: Row) {
  const reminder = mapReminder(row);
  const leadName = row.lead_name as string | undefined;
  if (!leadName) return reminder;
  return { ...reminder, lead: { id: reminder.lead_id, name: leadName } };
}

export function mapUser(row: Row): User {
  return {
    id: row.id as string,
    email: row.email as string,
    name: row.name as string,
    role: row.role as User["role"],
    business_type: (row.business_type as User["business_type"]) ?? null,
    industry: (row.industry as User["industry"]) ?? null,
    goals: parseJsonArray(row.goals),
    theme_preference: (row.theme_preference as User["theme_preference"]) ?? "system",
    background_preference:
      (row.background_preference as User["background_preference"]) ?? "aurora",
    onboarding_completed: Boolean(row.onboarding_completed),
    created_at: row.created_at as string,
    updated_at: (row.updated_at as string | null) ?? null,
  };
}

export function mapClient(row: Row): Client {
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    first_name: row.first_name as string,
    last_name: (row.last_name as string) ?? "",
    company: (row.company as string | null) ?? null,
    phone: (row.phone as string | null) ?? null,
    email: (row.email as string | null) ?? null,
    source: row.source as ClientSource,
    status: row.status as ClientStatus,
    tags: parseJsonArray(row.tags),
    custom_fields: parseJsonObject(row.custom_fields) as Record<string, string | number | null>,
    telegram_user_id: (row.telegram_user_id as string | null) ?? null,
    telegram_chat_id: (row.telegram_chat_id as string | null) ?? null,
    is_vip: Boolean(row.is_vip),
    is_repeat: Boolean(row.is_repeat),
    ai_sentiment: (row.ai_sentiment as Client["ai_sentiment"]) ?? null,
    ai_score: Number(row.ai_score ?? 0),
    last_contact_at: (row.last_contact_at as string | null) ?? null,
    next_callback_at: (row.next_callback_at as string | null) ?? null,
    is_archived: Boolean(row.is_archived),
    updated_by: (row.updated_by as string | null) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export function mapDeal(row: Row): Deal {
  return {
    id: row.id as string,
    client_id: row.client_id as string,
    user_id: row.user_id as string,
    title: row.title as string,
    amount: Number(row.amount ?? 0),
    currency: (row.currency as string) ?? "RUB",
    probability: Number(row.probability ?? 50),
    payment_status: ((row.payment_status as PaymentStatus) ?? "unpaid") as PaymentStatus,
    stage: row.stage as DealStage,
    close_date: (row.close_date as string | null) ?? null,
    comment: (row.comment as string | null) ?? null,
    updated_by: (row.updated_by as string | null) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export function mapDealWithClient(row: Row) {
  const deal = mapDeal(row);
  const firstName = row.client_first_name as string | undefined;
  if (!firstName) return deal;
  return {
    ...deal,
    client: {
      id: deal.client_id,
      first_name: firstName,
      last_name: (row.client_last_name as string) ?? "",
      company: (row.client_company as string | null) ?? null,
      phone: (row.client_phone as string | null) ?? null,
    },
  };
}

export function mapInteraction(row: Row): Interaction {
  return {
    id: row.id as string,
    client_id: row.client_id as string,
    deal_id: (row.deal_id as string | null) ?? null,
    user_id: row.user_id as string,
    type: row.type as Interaction["type"],
    content: row.content as string,
    subject: (row.subject as string | null) ?? null,
    summary: (row.summary as string | null) ?? null,
    direction: (row.direction as Interaction["direction"]) ?? null,
    status: row.status as Interaction["status"],
    outcome: (row.outcome as string | null) ?? null,
    sentiment: (row.sentiment as Interaction["sentiment"]) ?? null,
    sentiment_score:
      row.sentiment_score != null ? Number(row.sentiment_score) : null,
    ai_tags: parseJsonArray(row.ai_tags),
    ai_analysis: parseJsonObject(row.ai_analysis),
    duration: row.duration != null ? Number(row.duration) : null,
    channel: (row.channel as string | null) ?? null,
    priority: (row.priority as string) ?? "medium",
    scheduled_at: (row.scheduled_at as string | null) ?? null,
    start_time: (row.start_time as string | null) ?? null,
    end_time: (row.end_time as string | null) ?? null,
    created_at: row.created_at as string,
    updated_at: (row.updated_at as string | null) ?? null,
  };
}

export function mapTask(row: Row): Task {
  return {
    id: row.id as string,
    client_id: (row.client_id as string | null) ?? null,
    lead_id: (row.lead_id as string | null) ?? null,
    deal_id: (row.deal_id as string | null) ?? null,
    user_id: row.user_id as string,
    assigned_to: (row.assigned_to as string | null) ?? null,
    title: row.title as string,
    description: (row.description as string | null) ?? null,
    type: (row.type as TaskType) ?? "task",
    priority: (row.priority as TaskPriority) ?? "medium",
    status: (row.status as TaskStatus) ?? "pending",
    due_date: (row.due_date as string | null) ?? null,
    remind_at: (row.remind_at as string | null) ?? null,
    completed_at: (row.completed_at as string | null) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export function mapNotification(row: Row): AppNotification {
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    type: (row.type as string) ?? "info",
    title: row.title as string,
    message: row.message as string,
    href: (row.href as string | null) ?? null,
    is_read: Boolean(row.is_read),
    read_at: (row.read_at as string | null) ?? null,
    created_at: row.created_at as string,
  };
}

export function mapClientNote(row: Row): ClientNote {
  return {
    id: row.id as string,
    client_id: row.client_id as string,
    user_id: row.user_id as string,
    text: row.text as string,
    created_at: row.created_at as string,
  };
}

export function mapPipelineStage(row: Row): PipelineStage {
  return {
    id: row.id as string,
    value: row.value as string,
    label: row.label as string,
    sort_order: row.sort_order as number,
    created_at: row.created_at as string,
  };
}

export function mapClientFieldDefinition(row: Row): ClientFieldDefinition {
  return {
    id: row.id as string,
    field_key: row.field_key as string,
    label: row.label as string,
    field_type: row.field_type as CustomFieldType,
    options: parseJsonArray(row.options),
    sort_order: row.sort_order as number,
    created_at: row.created_at as string,
  };
}

export function clientFullName(client: Pick<Client, "first_name" | "last_name">) {
  return [client.first_name, client.last_name].filter(Boolean).join(" ").trim();
}

export function clientInitials(client: Pick<Client, "first_name" | "last_name">) {
  const first = client.first_name?.[0] ?? "";
  const last = client.last_name?.[0] ?? "";
  return (first + last).toUpperCase() || "?";
}
