export type UserRole = "admin" | "manager" | "sales" | "viewer";

export type BusinessType =
  | "freelancer"
  | "small_business"
  | "medium_business"
  | "agency"
  | "enterprise"
  | "other";

export type UserIndustry =
  | "real_estate"
  | "it"
  | "marketing"
  | "finance"
  | "ecommerce"
  | "retail"
  | "services"
  | "education"
  | "other";

export type ThemePreference = "system" | "light" | "dark";
export type BackgroundPreference =
  | "aurora"
  | "ocean"
  | "sunset"
  | "forest"
  | "minimal"
  | "neon"
  | "mesh"
  | "solid";

export interface OnboardingPayload {
  business_type: BusinessType;
  goals: string[];
  industry: UserIndustry;
  theme_preference: ThemePreference;
  background_preference: BackgroundPreference;
}

export type LeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "proposal"
  | "won"
  | "lost";

export type LeadSource =
  | "telegram"
  | "whatsapp"
  | "instagram"
  | "facebook"
  | "website"
  | "email"
  | "phone"
  | "referral"
  | "manual";

export type ActivityType = "call" | "message" | "note" | "system" | "status_change";

export type AiTemperature = "hot" | "warm" | "cold";
export type ReminderStatus = "pending" | "done" | "missed";

export interface User {
  id: string;
  email: string;
  name: string;
  /** RBAC: admin, manager, sales, viewer */
  role: UserRole;
  /** Onboarding: freelancer, small_business, etc. */
  business_type: BusinessType | null;
  industry: UserIndustry | null;
  goals: string[];
  theme_preference: ThemePreference;
  background_preference: BackgroundPreference;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface Lead {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  message: string | null;
  telegram_user_id: string | null;
  telegram_chat_id: string | null;
  source: LeadSource;
  status: LeadStatus;
  tags: string[];
  score: number;
  assigned_to: string | null;
  next_call: string | null;
  ai_score: number;
  ai_temperature: AiTemperature | null;
  ai_summary: string | null;
  ai_recommendations: string[];
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: string;
  lead_id: string;
  content: string;
  created_at: string;
}

export interface Activity {
  id: string;
  lead_id: string;
  user_id: string | null;
  type: ActivityType;
  content: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface Reminder {
  id: string;
  lead_id: string;
  remind_at: string;
  comment: string | null;
  status: ReminderStatus;
  notified_at: string | null;
  created_at: string;
}

export interface ReminderWithLead extends Reminder {
  lead?: { id: string; name: string };
}

export interface AutomationRule {
  id: string;
  name: string;
  trigger: string;
  condition: Record<string, unknown>;
  action: string;
  enabled: number;
  created_at: string;
}

export interface AiInsight {
  summary: string;
  recommendations: string[];
  temperature: AiTemperature;
  score: number;
  urgency: "low" | "medium" | "high";
}

export type ClientSource =
  | "telegram"
  | "whatsapp"
  | "instagram"
  | "facebook"
  | "website"
  | "email"
  | "phone"
  | "manual"
  | "referral"
  | "cold_call"
  | "other";

export type TaskType = "call" | "meeting" | "email" | "task";
export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type TaskStatus = "pending" | "done" | "cancelled";
export type PaymentStatus = "unpaid" | "partial" | "paid";
export type AiSentiment = "positive" | "neutral" | "negative";

export type ClientStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "negotiation"
  | "active"
  | "inactive"
  | "lost";

export type DealStage =
  | "new"
  | "contact"
  | "proposal"
  | "negotiation"
  | "payment"
  | "closed"
  | "rejected";

export type InteractionType = "call" | "email" | "meeting" | "message" | "task" | "note";

/** @alias CommunicationType — lowercase SQLite values */
export type CommunicationType = InteractionType;

export type InteractionStatus =
  | "scheduled"
  | "completed"
  | "missed"
  | "cancelled"
  | "draft"
  | "pending"
  | "done";

/** @alias CommunicationStatus */
export type CommunicationStatus = InteractionStatus;

export type CommunicationDirection = "inbound" | "outbound";

export type Sentiment = "positive" | "neutral" | "negative";

export interface Client {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  company: string | null;
  phone: string | null;
  email: string | null;
  source: ClientSource;
  status: ClientStatus;
  tags: string[];
  custom_fields: Record<string, string | number | null>;
  telegram_user_id: string | null;
  telegram_chat_id: string | null;
  is_vip: boolean;
  is_repeat: boolean;
  ai_sentiment: AiSentiment | null;
  ai_score: number;
  last_contact_at: string | null;
  next_callback_at: string | null;
  is_archived: boolean;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Deal {
  id: string;
  client_id: string;
  user_id: string;
  title: string;
  amount: number;
  currency: string;
  probability: number;
  payment_status: PaymentStatus;
  stage: DealStage;
  close_date: string | null;
  comment: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  client_id: string | null;
  lead_id: string | null;
  deal_id: string | null;
  user_id: string;
  assigned_to: string | null;
  title: string;
  description: string | null;
  type: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  due_date: string | null;
  remind_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskWithContext extends Task {
  client_name?: string;
  lead_name?: string;
}

export interface AppNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  href: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface DealWithClient extends Deal {
  client?: Pick<Client, "id" | "first_name" | "last_name" | "company" | "phone">;
}

export interface Interaction {
  id: string;
  client_id: string;
  deal_id: string | null;
  user_id: string;
  type: InteractionType;
  content: string;
  subject: string | null;
  summary: string | null;
  direction: CommunicationDirection | null;
  status: InteractionStatus;
  outcome: string | null;
  sentiment: Sentiment | null;
  sentiment_score: number | null;
  ai_tags: string[];
  ai_analysis: Record<string, unknown>;
  duration: number | null;
  channel: string | null;
  priority: string;
  scheduled_at: string | null;
  start_time: string | null;
  end_time: string | null;
  created_at: string;
  updated_at: string | null;
}

/** @alias Interaction — Prisma Communication equivalent */
export type Communication = Interaction;

export interface ClientNote {
  id: string;
  client_id: string;
  user_id: string;
  text: string;
  created_at: string;
}

export interface PipelineStage {
  id: string;
  value: string;
  label: string;
  sort_order: number;
  created_at: string;
}

export type CustomFieldType = "text" | "number" | "date" | "select";

export interface ClientFieldDefinition {
  id: string;
  field_key: string;
  label: string;
  field_type: CustomFieldType;
  options: string[];
  sort_order: number;
  created_at: string;
}

export interface UserNotificationSettings {
  user_id: string;
  email_enabled: boolean;
  in_app_enabled: boolean;
  updated_at: string;
}

export interface ClientListQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: ClientStatus;
  tag?: string;
  userId?: string;
  includeArchived?: boolean;
  /** When true (default), hides demo clients tagged as test/seed */
  hideTest?: boolean;
}
