import { getDb, newId, nowIso, sqlParams } from "@/lib/db";
import { mapTask } from "@/lib/db/mappers";
import { userScopeClause } from "@/lib/auth/scope";
import { createNotification } from "@/services/notifications";
import type { SessionUser, TaskPriority, TaskStatus, TaskType, TaskWithContext } from "@/types";

export async function getTasks(
  session: SessionUser,
  filters?: { status?: TaskStatus; dueBefore?: string }
) {
  const db = getDb();
  const { clause, params } = userScopeClause(session, "t.user_id");
  const conditions = [`1=1 ${clause}`];
  const queryParams: unknown[] = [...params];

  if (filters?.status) {
    conditions.push("t.status = ?");
    queryParams.push(filters.status);
  }
  if (filters?.dueBefore) {
    conditions.push("(t.due_date IS NOT NULL AND t.due_date <= ?)");
    queryParams.push(filters.dueBefore);
  }

  const rows = db
    .prepare(
      `SELECT t.*,
              c.first_name || ' ' || c.last_name as client_name,
              l.name as lead_name
       FROM tasks t
       LEFT JOIN clients c ON c.id = t.client_id
       LEFT JOIN leads l ON l.id = t.lead_id
       WHERE ${conditions.join(" AND ")}
       ORDER BY
         CASE t.status WHEN 'pending' THEN 0 ELSE 1 END,
         CASE WHEN t.due_date IS NULL THEN 1 ELSE 0 END,
         t.due_date ASC,
         t.created_at DESC`
    )
    .all(...sqlParams(queryParams)) as Record<string, unknown>[];

  return rows.map((row) => ({
    ...mapTask(row),
    client_name: (row.client_name as string | null)?.trim() || undefined,
    lead_name: (row.lead_name as string | null) ?? undefined,
  })) as TaskWithContext[];
}

export async function getTasksDueToday(session: SessionUser) {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return getTasks(session, { status: "pending", dueBefore: end.toISOString() });
}

export async function getTaskById(id: string, session: SessionUser) {
  const tasks = await getTasks(session);
  return tasks.find((t) => t.id === id) ?? null;
}

export async function createTask(
  session: SessionUser,
  input: {
    title: string;
    description?: string | null;
    type?: TaskType;
    priority?: TaskPriority;
    due_date?: string | null;
    remind_at?: string | null;
    client_id?: string | null;
    lead_id?: string | null;
    deal_id?: string | null;
    assigned_to?: string | null;
  }
) {
  const db = getDb();
  const now = nowIso();
  const id = newId();

  db.prepare(
    `INSERT INTO tasks (
      id, client_id, lead_id, deal_id, user_id, assigned_to,
      title, description, type, priority, status,
      due_date, remind_at, completed_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, NULL, ?, ?)`
  ).run(
    id,
    input.client_id ?? null,
    input.lead_id ?? null,
    input.deal_id ?? null,
    session.id,
    input.assigned_to ?? session.id,
    input.title.trim(),
    input.description?.trim() || null,
    input.type ?? "task",
    input.priority ?? "medium",
    input.due_date ?? null,
    input.remind_at ?? null,
    now,
    now
  );

  await createNotification(session.id, {
    type: "task",
    title: "Новая задача",
    message: input.title.trim(),
    href: "/tasks",
  });

  return mapTask(db.prepare("SELECT * FROM tasks WHERE id = ?").get(id) as Record<string, unknown>);
}

export async function updateTaskStatus(session: SessionUser, id: string, status: TaskStatus) {
  const db = getDb();
  const existing = await getTaskById(id, session);
  if (!existing) return null;

  const now = nowIso();
  db.prepare(
    `UPDATE tasks SET status = ?, completed_at = ?, updated_at = ? WHERE id = ?`
  ).run(status, status === "done" ? now : null, now, id);

  return mapTask(db.prepare("SELECT * FROM tasks WHERE id = ?").get(id) as Record<string, unknown>);
}

export async function updateTask(
  session: SessionUser,
  id: string,
  input: Partial<{
    title: string;
    description: string | null;
    type: TaskType;
    priority: TaskPriority;
    status: TaskStatus;
    due_date: string | null;
    remind_at: string | null;
    client_id: string | null;
    lead_id: string | null;
    deal_id: string | null;
    assigned_to: string | null;
  }>
) {
  const existing = await getTaskById(id, session);
  if (!existing) return null;

  const db = getDb();
  const now = nowIso();

  db.prepare(
    `UPDATE tasks SET
      title = ?, description = ?, type = ?, priority = ?, status = ?,
      due_date = ?, remind_at = ?, client_id = ?, lead_id = ?, deal_id = ?,
      assigned_to = ?, completed_at = ?, updated_at = ?
     WHERE id = ?`
  ).run(
    input.title?.trim() ?? existing.title,
    input.description !== undefined ? input.description : existing.description,
    input.type ?? existing.type,
    input.priority ?? existing.priority,
    input.status ?? existing.status,
    input.due_date !== undefined ? input.due_date : existing.due_date,
    input.remind_at !== undefined ? input.remind_at : existing.remind_at,
    input.client_id !== undefined ? input.client_id : existing.client_id,
    input.lead_id !== undefined ? input.lead_id : existing.lead_id,
    input.deal_id !== undefined ? input.deal_id : existing.deal_id,
    input.assigned_to !== undefined ? input.assigned_to : existing.assigned_to,
    (input.status ?? existing.status) === "done" ? now : existing.completed_at,
    now,
    id
  );

  return mapTask(db.prepare("SELECT * FROM tasks WHERE id = ?").get(id) as Record<string, unknown>);
}

export async function deleteTask(session: SessionUser, id: string) {
  const existing = await getTaskById(id, session);
  if (!existing) return null;

  const db = getDb();
  db.prepare("DELETE FROM tasks WHERE id = ?").run(id);
  return existing;
}

export async function getPendingTaskCount(session: SessionUser) {
  const db = getDb();
  const { clause, params } = userScopeClause(session);
  const row = db
    .prepare(`SELECT COUNT(*) as c FROM tasks WHERE status = 'pending' ${clause}`)
    .get(...params) as { c: number };
  return row.c;
}
