import { getDb, newId, nowIso } from "@/lib/db";
import { mapPipelineStage } from "@/lib/db/mappers";

export async function getPipelineStages() {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM pipeline_stages ORDER BY sort_order ASC, created_at ASC")
    .all() as Record<string, unknown>[];
  return rows.map(mapPipelineStage);
}

export async function updatePipelineStage(
  id: string,
  input: { label?: string; sort_order?: number }
) {
  const db = getDb();
  const existing = db.prepare("SELECT * FROM pipeline_stages WHERE id = ?").get(id) as
    | Record<string, unknown>
    | undefined;
  if (!existing) return null;

  db.prepare("UPDATE pipeline_stages SET label = ?, sort_order = ? WHERE id = ?").run(
    input.label ?? existing.label,
    input.sort_order ?? existing.sort_order,
    id
  );

  return mapPipelineStage(
    db.prepare("SELECT * FROM pipeline_stages WHERE id = ?").get(id) as Record<string, unknown>
  );
}

export async function addPipelineStage(label: string, value?: string) {
  const db = getDb();
  const slug =
    value?.trim() ||
    label
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");

  const maxOrder = db
    .prepare("SELECT MAX(sort_order) as m FROM pipeline_stages")
    .get() as { m: number | null };

  const id = newId();
  db.prepare(
    `INSERT INTO pipeline_stages (id, value, label, sort_order, created_at) VALUES (?, ?, ?, ?, ?)`
  ).run(id, slug, label.trim(), (maxOrder.m ?? -1) + 1, nowIso());

  return mapPipelineStage(
    db.prepare("SELECT * FROM pipeline_stages WHERE id = ?").get(id) as Record<string, unknown>
  );
}

export async function deletePipelineStage(id: string) {
  const db = getDb();
  const stage = db.prepare("SELECT * FROM pipeline_stages WHERE id = ?").get(id) as
    | { value: string }
    | undefined;
  if (!stage) return { ok: false, error: "not_found" as const };

  const deals = db
    .prepare("SELECT COUNT(*) as c FROM deals WHERE stage = ?")
    .get(stage.value) as { c: number };
  if (deals.c > 0) {
    return { ok: false, error: "has_deals" as const };
  }

  db.prepare("DELETE FROM pipeline_stages WHERE id = ?").run(id);
  return { ok: true as const };
}
