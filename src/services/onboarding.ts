import { getDb, nowIso } from "@/lib/db";
import { mapUser } from "@/lib/db/mappers";
import {
  BACKGROUND_PREFERENCES,
  BUSINESS_TYPES,
  THEME_PREFERENCES,
  USER_INDUSTRIES,
} from "@/config/constants";
import type { OnboardingPayload, User } from "@/types";

const ALLOWED_GOALS = [
  "Управление продажами",
  "Ведение клиентской базы",
  "Отслеживание сделок",
  "Email-маркетинг",
  "Поддержка клиентов",
  "Аналитика и отчеты",
] as const;

function isAllowed<T extends string>(value: string, allowed: readonly { value: T }[]): value is T {
  return allowed.some((item) => item.value === value);
}

export function parseOnboardingPayload(body: unknown): { ok: true; data: OnboardingPayload } | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Некорректное тело запроса" };
  }

  const raw = body as Record<string, unknown>;
  const businessType = String(raw.business_type ?? raw.role ?? "").trim();
  const industry = String(raw.industry ?? "").trim();
  const theme = String(raw.theme_preference ?? raw.theme ?? "system").trim();
  const background = String(raw.background_preference ?? raw.background ?? "aurora").trim();
  const goalsRaw = raw.goals;

  if (!isAllowed(businessType, BUSINESS_TYPES)) {
    return { ok: false, error: "Выберите тип профиля" };
  }

  if (!isAllowed(industry, USER_INDUSTRIES)) {
    return { ok: false, error: "Выберите сферу деятельности" };
  }

  if (!isAllowed(theme, THEME_PREFERENCES)) {
    return { ok: false, error: "Некорректная тема оформления" };
  }

  if (!isAllowed(background, BACKGROUND_PREFERENCES)) {
    return { ok: false, error: "Некорректный фон" };
  }

  let goals: string[] = [];
  if (Array.isArray(goalsRaw)) {
    goals = goalsRaw.map(String).filter((goal) => ALLOWED_GOALS.includes(goal as (typeof ALLOWED_GOALS)[number]));
  }

  if (goals.length === 0) {
    return { ok: false, error: "Выберите хотя бы одну цель" };
  }

  return {
    ok: true,
    data: {
      business_type: businessType,
      goals,
      industry,
      theme_preference: theme,
      background_preference: background,
    },
  };
}

export async function completeOnboarding(userId: string, payload: OnboardingPayload): Promise<User | null> {
  const db = getDb();
  const now = nowIso();

  db.prepare(
    `UPDATE users SET
      business_type = ?,
      industry = ?,
      goals = ?,
      theme_preference = ?,
      background_preference = ?,
      onboarding_completed = 1,
      updated_at = ?
     WHERE id = ?`
  ).run(
    payload.business_type,
    payload.industry,
    JSON.stringify(payload.goals),
    payload.theme_preference,
    payload.background_preference,
    now,
    userId
  );

  const row = db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as
    | Record<string, unknown>
    | undefined;

  return row ? mapUser(row) : null;
}

export async function needsOnboarding(userId: string): Promise<boolean> {
  const db = getDb();
  const row = db.prepare("SELECT onboarding_completed FROM users WHERE id = ?").get(userId) as
    | { onboarding_completed: number }
    | undefined;
  return row ? !row.onboarding_completed : false;
}
