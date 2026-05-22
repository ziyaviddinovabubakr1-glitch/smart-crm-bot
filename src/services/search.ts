import { getDb } from "@/lib/db";
import { clientFullName, mapClient, mapLead } from "@/lib/db/mappers";
import type { SessionUser } from "@/types";

export type SearchResultItem = {
  id: string;
  type: "client" | "deal" | "lead";
  title: string;
  subtitle: string;
  href: string;
};

function buildPattern(query: string) {
  return `%${query.trim().toLowerCase()}%`;
}

export async function globalSearch(
  _session: SessionUser,
  query: string,
  limit = 10
): Promise<SearchResultItem[]> {
  const q = query.trim();
  if (q.length < 1) return [];

  const db = getDb();
  const pattern = buildPattern(q);
  const digits = q.replace(/\D/g, "");
  const phonePattern = digits.length >= 3 ? `%${digits}%` : null;
  const results: SearchResultItem[] = [];

  const clientSql = phonePattern
    ? `SELECT * FROM clients
       WHERE is_archived = 0
         AND (tags NOT LIKE ? OR tags = '[]')
         AND (
           lower(first_name) LIKE ? OR lower(last_name) LIKE ?
           OR lower(trim(first_name || ' ' || last_name)) LIKE ?
           OR lower(phone) LIKE ? OR lower(email) LIKE ? OR lower(company) LIKE ?
           OR REPLACE(REPLACE(REPLACE(REPLACE(phone, ' ', ''), '-', ''), '(', ''), ')', '') LIKE ?
         )
       ORDER BY updated_at DESC LIMIT ?`
    : `SELECT * FROM clients
       WHERE is_archived = 0
         AND (tags NOT LIKE ? OR tags = '[]')
         AND (
           lower(first_name) LIKE ? OR lower(last_name) LIKE ?
           OR lower(trim(first_name || ' ' || last_name)) LIKE ?
           OR lower(phone) LIKE ? OR lower(email) LIKE ? OR lower(company) LIKE ?
         )
       ORDER BY updated_at DESC LIMIT ?`;

  const clientParams = phonePattern
    ? ['%"тест"%', pattern, pattern, pattern, pattern, pattern, pattern, phonePattern, limit]
    : ['%"тест"%', pattern, pattern, pattern, pattern, pattern, pattern, limit];

  const clients = db.prepare(clientSql).all(...clientParams) as Record<string, unknown>[];

  for (const row of clients) {
    const client = mapClient(row);
    results.push({
      id: client.id,
      type: "client",
      title: clientFullName(client),
      subtitle: [client.phone, client.company].filter(Boolean).join(" · ") || "Клиент",
      href: `/clients/${client.id}`,
    });
  }

  const deals = db
    .prepare(
      `SELECT d.id, d.title, d.amount, d.currency, c.first_name, c.last_name
       FROM deals d
       JOIN clients c ON c.id = d.client_id
       WHERE c.is_archived = 0
         AND (
           lower(d.title) LIKE ? OR lower(c.first_name) LIKE ? OR lower(c.last_name) LIKE ?
           OR lower(c.phone) LIKE ? OR lower(c.email) LIKE ?
         )
       ORDER BY d.updated_at DESC LIMIT ?`
    )
    .all(pattern, pattern, pattern, pattern, pattern, limit) as {
      id: string;
      title: string;
      amount: number;
      currency: string;
      first_name: string;
      last_name: string;
    }[];

  for (const deal of deals) {
    results.push({
      id: deal.id,
      type: "deal",
      title: deal.title,
      subtitle: `${deal.first_name} ${deal.last_name} · ${deal.amount.toLocaleString("ru-RU")} ${deal.currency}`,
      href: `/deals/${deal.id}`,
    });
  }

  const leads = db
    .prepare(
      `SELECT * FROM leads
       WHERE lower(name) LIKE ? OR lower(phone) LIKE ? OR lower(email) LIKE ? OR lower(message) LIKE ?
       ORDER BY updated_at DESC LIMIT ?`
    )
    .all(pattern, pattern, pattern, pattern, limit) as Record<string, unknown>[];

  for (const row of leads) {
    const lead = mapLead(row);
    results.push({
      id: lead.id,
      type: "lead",
      title: lead.name,
      subtitle: lead.phone ?? lead.email ?? "Лид",
      href: `/leads/${lead.id}`,
    });
  }

  return results.slice(0, limit * 2);
}
