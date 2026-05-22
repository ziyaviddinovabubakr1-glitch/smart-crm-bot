import type {
  BackgroundPreference,
  BusinessType,
  LeadSource,
  LeadStatus,
  ThemePreference,
  UserIndustry,
  UserRole,
} from "@/types";

export const LEAD_STATUSES: { value: LeadStatus; label: string; color: string }[] = [
  { value: "new", label: "Новый", color: "bg-blue-100 text-blue-800" },
  { value: "contacted", label: "Контакт", color: "bg-sky-100 text-sky-800" },
  { value: "qualified", label: "Квалифицирован", color: "bg-violet-100 text-violet-800" },
  { value: "proposal", label: "КП", color: "bg-amber-100 text-amber-800" },
  { value: "won", label: "Выигран", color: "bg-emerald-100 text-emerald-800" },
  { value: "lost", label: "Проигран", color: "bg-neutral-100 text-neutral-600" },
];

export const LEAD_SOURCES: { value: LeadSource; label: string; icon?: string }[] = [
  { value: "telegram", label: "Telegram" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "website", label: "Сайт" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Телефон" },
  { value: "referral", label: "Рекомендация" },
  { value: "manual", label: "Вручную" },
];

export const ACTIVE_STATUSES: LeadStatus[] = [
  "new",
  "contacted",
  "qualified",
  "proposal",
];

export const ROLES: { value: UserRole; label: string }[] = [
  { value: "admin", label: "Администратор" },
  { value: "manager", label: "Менеджер" },
  { value: "sales", label: "Продажи" },
  { value: "viewer", label: "Просмотр" },
];

export const STATUS_LABEL: Record<LeadStatus, string> = Object.fromEntries(
  LEAD_STATUSES.map((s) => [s.value, s.label])
) as Record<LeadStatus, string>;

export const CLIENT_STATUSES: {
  value: import("@/types").ClientStatus;
  label: string;
  color: string;
  columnColor: string;
}[] = [
  { value: "new", label: "Новый", color: "bg-blue-100 text-blue-800", columnColor: "border-t-blue-500" },
  { value: "contacted", label: "Контакт", color: "bg-sky-100 text-sky-800", columnColor: "border-t-sky-500" },
  { value: "qualified", label: "Квалифицирован", color: "bg-violet-100 text-violet-800", columnColor: "border-t-violet-500" },
  { value: "negotiation", label: "Переговоры", color: "bg-amber-100 text-amber-800", columnColor: "border-t-amber-500" },
  { value: "active", label: "Активный", color: "bg-emerald-100 text-emerald-800", columnColor: "border-t-emerald-500" },
  { value: "inactive", label: "Неактивный", color: "bg-neutral-100 text-neutral-600", columnColor: "border-t-neutral-400" },
  { value: "lost", label: "Отказ", color: "bg-red-100 text-red-700", columnColor: "border-t-red-400" },
];

export const ACTIVE_CLIENT_STATUSES: import("@/types").ClientStatus[] = [
  "new",
  "contacted",
  "qualified",
  "negotiation",
  "active",
];

export const CLIENT_STATUS_LABEL: Record<import("@/types").ClientStatus, string> = Object.fromEntries(
  CLIENT_STATUSES.map((s) => [s.value, s.label])
) as Record<import("@/types").ClientStatus, string>;

export const CLIENT_SOURCES: { value: import("@/types").ClientSource; label: string }[] = [
  { value: "manual", label: "Вручную" },
  { value: "telegram", label: "Telegram" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "website", label: "Сайт" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Телефон" },
  { value: "referral", label: "Рекомендация" },
  { value: "cold_call", label: "Холодный звонок" },
  { value: "other", label: "Другое" },
];

export const TASK_TYPES: { value: import("@/types").TaskType; label: string }[] = [
  { value: "call", label: "Звонок" },
  { value: "meeting", label: "Встреча" },
  { value: "email", label: "Email" },
  { value: "task", label: "Задача" },
];

export const TASK_PRIORITIES: { value: import("@/types").TaskPriority; label: string; color: string }[] = [
  { value: "low", label: "Низкий", color: "bg-neutral-100 text-neutral-600" },
  { value: "medium", label: "Средний", color: "bg-blue-100 text-blue-700" },
  { value: "high", label: "Высокий", color: "bg-amber-100 text-amber-800" },
  { value: "urgent", label: "Срочный", color: "bg-red-100 text-red-700" },
];

export const PAYMENT_STATUSES: { value: import("@/types").PaymentStatus; label: string }[] = [
  { value: "unpaid", label: "Не оплачено" },
  { value: "partial", label: "Частично" },
  { value: "paid", label: "Оплачено" },
];

export const CHANNEL_SOURCES = LEAD_SOURCES;

export const DEAL_STAGES: {
  value: import("@/types").DealStage;
  label: string;
  color: string;
}[] = [
  { value: "new", label: "Новый", color: "bg-blue-100 text-blue-800" },
  { value: "contact", label: "Контакт", color: "bg-sky-100 text-sky-800" },
  { value: "proposal", label: "КП", color: "bg-violet-100 text-violet-800" },
  { value: "negotiation", label: "Переговоры", color: "bg-amber-100 text-amber-800" },
  { value: "payment", label: "Оплата", color: "bg-orange-100 text-orange-800" },
  { value: "closed", label: "Закрыта", color: "bg-emerald-100 text-emerald-800" },
  { value: "rejected", label: "Отказ", color: "bg-neutral-100 text-neutral-600" },
];

export const ACTIVE_DEAL_STAGES: import("@/types").DealStage[] = [
  "new",
  "contact",
  "proposal",
  "negotiation",
  "payment",
];

export const INTERACTION_TYPES: { value: import("@/types").InteractionType; label: string }[] = [
  { value: "call", label: "Звонок" },
  { value: "email", label: "Email" },
  { value: "meeting", label: "Встреча" },
  { value: "message", label: "Сообщение" },
  { value: "task", label: "Задача" },
  { value: "note", label: "Заметка" },
];

export const COMMUNICATION_DIRECTION_LABEL: Record<string, string> = {
  inbound: "Входящее",
  outbound: "Исходящее",
};

export const SENTIMENT_LABEL: Record<string, string> = {
  positive: "Позитив",
  neutral: "Нейтрально",
  negative: "Негатив",
};

export const SENTIMENT_COLOR: Record<string, string> = {
  positive: "bg-emerald-100 text-emerald-800",
  neutral: "bg-neutral-100 text-neutral-700",
  negative: "bg-red-100 text-red-800",
};

export const COMMUNICATION_STATUS_LABEL: Record<string, string> = {
  scheduled: "Запланировано",
  completed: "Завершено",
  missed: "Пропущено",
  cancelled: "Отменено",
  draft: "Черновик",
  pending: "Ожидает",
  done: "Готово",
};

export const COMMUNICATION_CHANNELS = [
  { value: "phone", label: "Телефон" },
  { value: "email", label: "Email" },
  { value: "telegram", label: "Telegram" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "meeting", label: "Встреча" },
  { value: "other", label: "Другое" },
];

export const AI_TEMPERATURE_LABEL: Record<string, string> = {
  hot: "🔥 Горячий",
  warm: "🙂 Тёплый",
  cold: "❄️ Холодный",
};

export const SOURCE_LABEL: Record<string, string> = Object.fromEntries([
  ...LEAD_SOURCES.map((s) => [s.value, s.label]),
  ...CLIENT_SOURCES.map((s) => [s.value, s.label]),
]);

export const BUSINESS_TYPES: { value: BusinessType; label: string }[] = [
  { value: "freelancer", label: "Фрилансер" },
  { value: "small_business", label: "Малый бизнес" },
  { value: "medium_business", label: "Средний бизнес" },
  { value: "agency", label: "Агентство" },
  { value: "enterprise", label: "Крупная компания" },
  { value: "other", label: "Другое" },
];

export const USER_INDUSTRIES: { value: UserIndustry; label: string }[] = [
  { value: "real_estate", label: "Недвижимость" },
  { value: "it", label: "IT" },
  { value: "marketing", label: "Маркетинг" },
  { value: "finance", label: "Финансы" },
  { value: "ecommerce", label: "E-commerce" },
  { value: "retail", label: "Розница" },
  { value: "services", label: "Услуги" },
  { value: "education", label: "Образование" },
  { value: "other", label: "Другое" },
];

export const THEME_PREFERENCES: { value: ThemePreference; label: string }[] = [
  { value: "system", label: "Системная" },
  { value: "light", label: "Светлая" },
  { value: "dark", label: "Тёмная" },
];

export const BACKGROUND_PREFERENCES: { value: BackgroundPreference; label: string }[] = [
  { value: "aurora", label: "Aurora" },
  { value: "ocean", label: "Океан" },
  { value: "sunset", label: "Закат" },
  { value: "forest", label: "Лес" },
  { value: "minimal", label: "Минимализм" },
  { value: "neon", label: "Неон" },
  { value: "mesh", label: "Mesh" },
  { value: "solid", label: "Однотонный" },
];
