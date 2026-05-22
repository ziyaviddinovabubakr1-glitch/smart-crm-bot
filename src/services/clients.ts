import { getDb, newId, nowIso } from "@/lib/db";
import { mapClient, clientFullName } from "@/lib/db/mappers";
import { canAccessAllData, userScopeClause } from "@/lib/auth/scope";
import { assertUserExists, resolveUserInDatabase } from "@/lib/auth/session";
import { parseTags, validateClientInput } from "@/lib/validation/clients";
import type { Client, ClientListQuery, ClientSource, ClientStatus, SessionUser } from "@/types";
import { CLIENT_STATUSES } from "@/config/constants";

function resolveOwnerUserId(session: SessionUser): string {
  const resolved = resolveUserInDatabase(session);
  if (!resolved) {
    throw new Error("USER_NOT_FOUND");
  }
  assertUserExists(resolved.id);
  return resolved.id;
}

function buildClientFilters(query: ClientListQuery, session: SessionUser) {
  const searching = Boolean(query.search?.trim());
  const { clause: scopeClause, params: scopeParams } = searching
    ? { clause: "", params: [] as string[] }
    : userScopeClause(session);
  const conditions = [`is_archived = 0`, `1=1 ${scopeClause}`];
  const params: unknown[] = [...scopeParams];

  if (query.status && !query.search?.trim()) {
    conditions.push("status = ?");
    params.push(query.status);
  }

  if (query.userId && session.role === "admin") {
    conditions.push("user_id = ?");
    params.push(query.userId);
  }

  if (query.tag) {
    conditions.push("tags LIKE ?");
    params.push(`%"${query.tag}"%`);
  }

  if (query.hideTest !== false) {
    conditions.push("(tags NOT LIKE ? OR tags = '[]')");
    params.push('%"тест"%');
  }

  const search = query.search?.trim();
  if (search && search.length >= 1) {
    const pattern = `%${search.toLowerCase()}%`;
    const digits = search.replace(/\D/g, "");
    const phonePattern = digits.length >= 3 ? `%${digits}%` : null;

    if (phonePattern) {
      conditions.push(
        `(lower(first_name) LIKE ? OR lower(last_name) LIKE ?
          OR lower(trim(first_name || ' ' || last_name)) LIKE ?
          OR lower(phone) LIKE ? OR lower(email) LIKE ? OR lower(company) LIKE ?
          OR REPLACE(REPLACE(REPLACE(REPLACE(phone, ' ', ''), '-', ''), '(', ''), ')', '') LIKE ?)`
      );
      params.push(
        pattern,
        pattern,
        pattern,
        pattern,
        pattern,
        pattern,
        phonePattern
      );
    } else {
      conditions.push(
        `(lower(first_name) LIKE ? OR lower(last_name) LIKE ?
          OR lower(trim(first_name || ' ' || last_name)) LIKE ?
          OR lower(phone) LIKE ? OR lower(email) LIKE ? OR lower(company) LIKE ?)`
      );
      params.push(pattern, pattern, pattern, pattern, pattern, pattern);
    }
  }

  if (query.includeArchived) {
    const idx = conditions.indexOf("is_archived = 0");
    if (idx >= 0) conditions.splice(idx, 1);
  }

  return { where: conditions.join(" AND "), params };
}

export async function getClients(query: ClientListQuery, session: SessionUser) {
  const db = getDb();
  const page = Math.max(1, query.page ?? 1);
  const limit = Math.min(50, Math.max(1, query.limit ?? 20));
  const offset = (page - 1) * limit;
  const { where, params } = buildClientFilters(query, session);

  const total = db
    .prepare(`SELECT COUNT(*) as c FROM clients WHERE ${where}`)
    .get(...params) as { c: number };

  const rows = db
    .prepare(
      `SELECT * FROM clients WHERE ${where}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`
    )
    .all(...params, limit, offset) as Record<string, unknown>[];

  return {
    clients: rows.map(mapClient),
    total: total.c,
    page,
    limit,
    pages: Math.ceil(total.c / limit) || 1,
  };
}

export async function getClientById(id: string, session: SessionUser) {
  const db = getDb();
  const resolved = resolveUserInDatabase(session) ?? session;

  const row = db
    .prepare("SELECT * FROM clients WHERE id = ? AND is_archived = 0")
    .get(id) as Record<string, unknown> | undefined;

  if (!row) return null;

  const client = mapClient(row);
  if (canAccessAllData(resolved.role)) return client;
  if (client.user_id === resolved.id) return client;

  return null;
}

export async function createClient(
  session: SessionUser,
  input: {
    first_name: string;
    last_name?: string;
    company?: string | null;
    phone: string;
    email?: string | null;
    source?: ClientSource;
    status?: ClientStatus;
    tags?: string[];
    custom_fields?: Record<string, string | number | null>;
    telegram_user_id?: string | null;
    telegram_chat_id?: string | null;
  }
) {
  const validation = validateClientInput(input);
  if (!validation.valid) {
    throw new Error(JSON.stringify(validation.errors));
  }

  const db = getDb();
  const now = nowIso();
  const id = newId();
  const tags = JSON.stringify(input.tags ?? []);
  const ownerId = resolveOwnerUserId(session);
  const source = validation.data.source;
  const status = validation.data.status;

  try {
    db.prepare(
      `INSERT INTO clients (id, user_id, first_name, last_name, company, phone, email, source, status, tags, custom_fields, telegram_user_id, telegram_chat_id, is_archived, updated_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`
    ).run(
      id,
      ownerId,
      input.first_name.trim(),
      input.last_name?.trim() ?? "",
      input.company?.trim() || null,
      input.phone.trim(),
      input.email?.trim() || null,
      source,
      status,
      tags,
      JSON.stringify(input.custom_fields ?? {}),
      input.telegram_user_id ?? null,
      input.telegram_chat_id ?? null,
      ownerId,
      now,
      now
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("FOREIGN KEY")) {
      console.error("[clients] FK constraint failed on createClient", {
        ownerId,
        sessionId: session.id,
        sessionEmail: session.email,
        error: message,
      });
      throw new Error("USER_NOT_FOUND");
    }
    throw error;
  }

  const row = db.prepare("SELECT * FROM clients WHERE id = ?").get(id) as Record<string, unknown>;
  return mapClient(row);
}

export async function convertLeadToClient(session: SessionUser, leadId: string) {
  const { getLeadById, updateLeadStatus } = await import("@/services/leads");
  const { logActivity } = await import("@/services/activities");

  const { lead } = await getLeadById(leadId);
  if (!lead) return { ok: false as const, error: "NOT_FOUND" as const };

  const db = getDb();
  const { clause, params } = userScopeClause(session);

  if (lead.phone?.trim()) {
    const existing = db
      .prepare(`SELECT * FROM clients WHERE phone = ? AND is_archived = 0 ${clause}`)
      .get(lead.phone.trim(), ...params) as Record<string, unknown> | undefined;

    if (existing) {
      await updateLeadStatus(leadId, "won", session.id);
      await logActivity({
        leadId,
        userId: session.id,
        type: "status_change",
        content: `Лид конвертирован в клиента ${existing.id}`,
      });
      return { ok: true as const, client: mapClient(existing), created: false };
    }
  }

  const { first_name, last_name } = splitName(lead.name);
  const phone = lead.phone?.trim() || `+lead${lead.id.slice(0, 8)}`;

  const client = await createClient(session, {
    first_name,
    last_name,
    phone,
    email: lead.email,
    source:
      lead.source === "telegram"
        ? "telegram"
        : lead.source === "website"
          ? "website"
          : "manual",
    status: "new",
    tags: [...new Set([...lead.tags, "from-lead"])],
    telegram_user_id: lead.telegram_user_id,
    telegram_chat_id: lead.telegram_chat_id,
  });

  await updateLeadStatus(leadId, "won", session.id);
  await logActivity({
    leadId,
    userId: session.id,
    type: "status_change",
    content: `Лид конвертирован в клиента ${client.id}`,
  });

  return { ok: true as const, client, created: true };
}

export async function updateClient(
  session: SessionUser,
  id: string,
  input: Partial<{
    first_name: string;
    last_name: string;
    company: string | null;
    phone: string;
    email: string | null;
    source: ClientSource;
    status: ClientStatus;
    tags: string[];
    custom_fields: Record<string, string | number | null>;
  }>
) {
  const existing = await getClientById(id, session);
  if (!existing) return null;

  const validation = validateClientInput({
    first_name: input.first_name ?? existing.first_name,
    phone: input.phone ?? existing.phone,
    email: input.email ?? existing.email,
    source: input.source ?? existing.source,
    status: input.status ?? existing.status,
  });
  if (!validation.valid) {
    throw new Error(JSON.stringify(validation.errors));
  }

  const db = getDb();
  const now = nowIso();
  const ownerId = resolveOwnerUserId(session);

  db.prepare(
    `UPDATE clients SET
      first_name = ?, last_name = ?, company = ?, phone = ?, email = ?,
      source = ?, status = ?, tags = ?, custom_fields = ?, updated_by = ?, updated_at = ?
     WHERE id = ?`
  ).run(
    input.first_name?.trim() ?? existing.first_name,
    input.last_name?.trim() ?? existing.last_name,
    input.company !== undefined ? input.company?.trim() || null : existing.company,
    input.phone?.trim() ?? existing.phone,
    input.email !== undefined ? input.email?.trim() || null : existing.email,
    input.source ?? existing.source,
    input.status ?? existing.status,
    JSON.stringify(input.tags ?? existing.tags),
    JSON.stringify(input.custom_fields ?? existing.custom_fields),
    ownerId,
    now,
    id
  );

  return getClientById(id, session);
}

export async function updateClientStatus(
  session: SessionUser,
  id: string,
  status: ClientStatus
) {
  return updateClient(session, id, { status });
}

export async function getClientsGroupedByStatus(
  query: Omit<ClientListQuery, "page" | "limit" | "status">,
  session: SessionUser
) {
  const { clients } = await getClients(
    { ...query, limit: 500, page: 1, status: undefined },
    session
  );

  const grouped = Object.fromEntries(
    CLIENT_STATUSES.map((s) => [s.value, [] as Client[]])
  ) as Record<ClientStatus, Client[]>;

  for (const client of clients) {
    const bucket = grouped[client.status];
    if (bucket) {
      bucket.push(client);
    } else {
      grouped.new.push(client);
    }
  }

  return grouped;
}

export async function archiveClient(session: SessionUser, id: string) {
  const existing = await getClientById(id, session);
  if (!existing) return null;

  const db = getDb();
  const ownerId = resolveOwnerUserId(session);
  db.prepare(
    `UPDATE clients SET is_archived = 1, updated_by = ?, updated_at = ? WHERE id = ?`
  ).run(ownerId, nowIso(), id);

  return { ...existing, is_archived: true };
}

export async function exportClientsCsv(session: SessionUser, query: ClientListQuery = {}) {
  const { clients } = await getClients({ ...query, limit: 5000, page: 1 }, session);
  const header = "name,phone,email,status,created_at";
  const lines = clients.map((c) => {
    const cols = [
      clientFullName(c),
      c.phone ?? "",
      c.email ?? "",
      c.status,
      c.created_at,
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`);
    return cols.join(",");
  });
  return [header, ...lines].join("\n");
}

export async function importClientsFromCsv(session: SessionUser, csv: string) {
  const lines = csv.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) {
    return { imported: 0, skipped: 0, errors: ["CSV must include header and at least one row"] };
  }

  const header = lines[0].toLowerCase();
  const hasNamedCols = header.includes("phone") || header.includes("first_name");

  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    try {
      const cols = parseCsvLine(line);
      let first_name: string;
      let last_name = "";
      let phone: string;
      let email: string | null = null;

      if (hasNamedCols) {
        const map = Object.fromEntries(
          header.split(",").map((h, idx) => [h.trim(), cols[idx]?.trim() ?? ""])
        );
        first_name = map.first_name || map.name?.split(" ")[0] || "Клиент";
        last_name = map.last_name || map.name?.split(" ").slice(1).join(" ") || "";
        phone = map.phone || "";
        email = map.email || null;
      } else {
        first_name = cols[0] || "Клиент";
        phone = cols[1] || "";
        email = cols[2] || null;
      }

      if (!phone) {
        skipped++;
        continue;
      }

      await createClient(session, {
        first_name,
        last_name,
        phone,
        email,
        source: "manual",
        status: "new",
      });
      imported++;
    } catch (e) {
      skipped++;
      errors.push(`Row ${i + 1}: ${e instanceof Error ? e.message : "error"}`);
    }
  }

  return { imported, skipped, errors: errors.slice(0, 10) };
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
      continue;
    }
    current += ch;
  }
  result.push(current);
  return result.map((v) => v.trim());
}

export function parseClientBody(body: Record<string, unknown>) {
  return {
    first_name: String(body.first_name ?? ""),
    last_name: String(body.last_name ?? ""),
    company: body.company ? String(body.company) : null,
    phone: String(body.phone ?? ""),
    email: body.email ? String(body.email) : null,
    source: body.source as ClientSource | undefined,
    status: body.status as ClientStatus | undefined,
    tags: parseTags(body.tags),
    custom_fields: (body.custom_fields as Record<string, string | number | null>) ?? {},
  };
}

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  return {
    first_name: parts[0] ?? "Клиент",
    last_name: parts.slice(1).join(" "),
  };
}

function getDefaultOwnerId() {
  const db = getDb();
  const row = db.prepare("SELECT id FROM users ORDER BY created_at ASC LIMIT 1").get() as
    | { id: string }
    | undefined;
  return row?.id ?? null;
}

export async function createClientFromTelegram(payload: {
  telegramUserId: string;
  telegramChatId: string;
  name: string;
  text: string;
  phone?: string;
}) {
  const db = getDb();
  const ownerId = getDefaultOwnerId();
  if (!ownerId) return null;

  if (payload.telegramUserId) {
    const byTelegram = db
      .prepare("SELECT * FROM clients WHERE telegram_user_id = ? AND is_archived = 0 LIMIT 1")
      .get(payload.telegramUserId) as Record<string, unknown> | undefined;
    if (byTelegram) {
      return { client: mapClient(byTelegram), duplicate: true };
    }
  }

  if (payload.phone?.trim()) {
    const byPhone = db
      .prepare("SELECT * FROM clients WHERE phone = ? AND is_archived = 0 LIMIT 1")
      .get(payload.phone.trim()) as Record<string, unknown> | undefined;
    if (byPhone) {
      return { client: mapClient(byPhone), duplicate: true };
    }
  }

  const { first_name, last_name } = splitName(payload.name);
  const now = nowIso();
  const clientId = newId();
  const phone = payload.phone?.trim() || `+tg${payload.telegramUserId}`;

  db.prepare(
    `INSERT INTO clients (id, user_id, first_name, last_name, company, phone, email, source, status, tags, custom_fields, telegram_user_id, telegram_chat_id, is_archived, updated_by, created_at, updated_at)
     VALUES (?, ?, ?, ?, NULL, ?, NULL, 'telegram', 'lead', '[]', '{}', ?, ?, 0, ?, ?, ?)`
  ).run(
    clientId,
    ownerId,
    first_name,
    last_name,
    phone,
    payload.telegramUserId,
    payload.telegramChatId,
    ownerId,
    now,
    now
  );

  const dealId = newId();
  db.prepare(
    `INSERT INTO deals (id, client_id, user_id, title, amount, currency, stage, close_date, comment, updated_by, created_at, updated_at)
     VALUES (?, ?, ?, ?, 0, 'RUB', 'new', NULL, ?, ?, ?, ?)`
  ).run(dealId, clientId, ownerId, `Telegram: ${first_name}`, payload.text, ownerId, now, now);

  db.prepare(
    `INSERT INTO interactions (
      id, client_id, deal_id, user_id, type, content, scheduled_at, status,
      start_time, created_at, updated_at
    ) VALUES (?, ?, ?, ?, 'note', ?, NULL, 'completed', ?, ?, ?)`
  ).run(newId(), clientId, dealId, ownerId, payload.text, now, now, now);

  const client = mapClient(
    db.prepare("SELECT * FROM clients WHERE id = ?").get(clientId) as Record<string, unknown>
  );

  return { client, duplicate: false };
}
