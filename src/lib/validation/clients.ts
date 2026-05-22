import type { ClientSource, ClientStatus } from "@/types";
import { CLIENT_SOURCES, CLIENT_STATUSES } from "@/config/constants";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[\d\s+\-()]{7,20}$/;

export function validateClientInput(input: {
  first_name?: string;
  phone?: string | null;
  email?: string | null;
  source?: string;
  status?: string;
}) {
  const errors: Record<string, string> = {};
  const firstName = input.first_name?.trim();

  if (!firstName) {
    errors.first_name = "Имя обязательно";
  }

  const phone = input.phone?.trim();
  if (!phone) {
    errors.phone = "Телефон обязателен";
  } else if (!PHONE_RE.test(phone)) {
    errors.phone = "Некорректный телефон";
  }

  const email = input.email?.trim();
  if (email && !EMAIL_RE.test(email)) {
    errors.email = "Некорректный email";
  }

  if (input.source?.trim() && !CLIENT_SOURCES.some((s) => s.value === input.source?.trim())) {
    errors.source = "Некорректный источник";
  }

  if (input.status?.trim() && !CLIENT_STATUSES.some((s) => s.value === input.status?.trim())) {
    errors.status = "Некорректный статус";
  }

  const sourceRaw = input.source?.trim();
  const statusRaw = input.status?.trim();
  const source =
    sourceRaw && CLIENT_SOURCES.some((s) => s.value === sourceRaw)
      ? (sourceRaw as ClientSource)
      : "manual";
  const status =
    statusRaw && CLIENT_STATUSES.some((s) => s.value === statusRaw)
      ? (statusRaw as ClientStatus)
      : "new";

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    data: {
      first_name: firstName ?? "",
      last_name: "",
      phone: phone ?? null,
      email: email || null,
      source,
      status,
    },
  };
}

export function parseTags(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map(String).map((t) => t.trim()).filter(Boolean);
  }
  if (typeof raw === "string") {
    return raw
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }
  return [];
}
