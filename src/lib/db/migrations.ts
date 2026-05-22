import { DatabaseSync } from "node:sqlite";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { nowIso, newId } from "./index";

const DEFAULT_RULES = [
  {
    name: "Новый лид → Telegram",
    trigger: "lead.created",
    condition: {},
    action: "notify.telegram.new_lead",
  },
  {
    name: "Выигранная сделка → Telegram",
    trigger: "deal.won",
    condition: {},
    action: "notify.telegram.deal_won",
  },
];

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function seedDefaultUser(db: DatabaseSync) {
  const count = db.prepare("SELECT COUNT(*) as c FROM users").get() as { c: number };
  if (count.c > 0) return;

  const email = (process.env.ADMIN_EMAIL ?? "admin@local.dev").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "admin123";
  const now = nowIso();

  db.prepare(
    `INSERT INTO users (
      id, email, name, role, password_hash,
      goals, theme_preference, background_preference, onboarding_completed,
      created_at, updated_at
    ) VALUES (?, ?, ?, 'admin', ?, '[]', 'system', 'aurora', 1, ?, ?)`
  ).run(newId(), email, "Admin", hashPassword(password), now, now);
}

function syncDefaultAdminPassword(db: DatabaseSync) {
  if (process.env.NODE_ENV === "production") return;

  const email = (process.env.ADMIN_EMAIL ?? "admin@local.dev").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "admin123";

  db.prepare("UPDATE users SET password_hash = ? WHERE email = ? COLLATE NOCASE").run(
    hashPassword(password),
    email
  );
}

function seedAutomationRules(db: DatabaseSync) {
  const count = db.prepare("SELECT COUNT(*) as c FROM automation_rules").get() as {
    c: number;
  };
  if (count.c > 0) return;

  const insert = db.prepare(
    `INSERT INTO automation_rules (id, name, trigger, condition, action, enabled, created_at)
     VALUES (?, ?, ?, ?, ?, 1, ?)`
  );

  for (const rule of DEFAULT_RULES) {
    insert.run(
      newId(),
      rule.name,
      rule.trigger,
      JSON.stringify(rule.condition),
      rule.action,
      nowIso()
    );
  }
}

function migrateFromLegacyStatuses(db: DatabaseSync) {
  const map: Record<string, string> = {
    interested: "qualified",
    follow_up: "proposal",
    paid: "won",
  };

  for (const [oldStatus, newStatus] of Object.entries(map)) {
    db.prepare("UPDATE leads SET status = ? WHERE status = ?").run(newStatus, oldStatus);
  }
}

function addColumnIfMissing(
  db: DatabaseSync,
  table: string,
  column: string,
  definition: string
) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  if (cols.some((c) => c.name === column)) return;
  db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
}

function applyUserOnboardingColumns(db: DatabaseSync) {
  addColumnIfMissing(db, "users", "business_type", "TEXT");
  addColumnIfMissing(db, "users", "industry", "TEXT");
  addColumnIfMissing(db, "users", "goals", "TEXT NOT NULL DEFAULT '[]'");
  addColumnIfMissing(db, "users", "theme_preference", "TEXT NOT NULL DEFAULT 'system'");
  addColumnIfMissing(db, "users", "background_preference", "TEXT NOT NULL DEFAULT 'aurora'");
  addColumnIfMissing(db, "users", "onboarding_completed", "INTEGER NOT NULL DEFAULT 0");
  addColumnIfMissing(db, "users", "updated_at", "TEXT");
}

function migrateV4(db: DatabaseSync) {
  applyUserOnboardingColumns(db);
  db.prepare("UPDATE users SET updated_at = created_at WHERE updated_at IS NULL").run();
  db.prepare(
    "UPDATE users SET goals = '[]' WHERE goals IS NULL OR TRIM(goals) = ''"
  ).run();
  db.prepare(
    "UPDATE users SET theme_preference = 'system' WHERE theme_preference IS NULL OR TRIM(theme_preference) = ''"
  ).run();
  db.prepare(
    "UPDATE users SET background_preference = 'aurora' WHERE background_preference IS NULL OR TRIM(background_preference) = ''"
  ).run();
}

export function runMigrations(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL
    )
  `);

  const current = db.prepare("SELECT MAX(version) as v FROM schema_migrations").get() as {
    v: number | null;
  };
  const version = current.v ?? 0;

  if (version < 1) {
    addColumnIfMissing(db, "leads", "email", "TEXT");
    addColumnIfMissing(db, "leads", "tags", "TEXT NOT NULL DEFAULT '[]'");
    addColumnIfMissing(db, "leads", "score", "INTEGER NOT NULL DEFAULT 0");
    addColumnIfMissing(db, "leads", "assigned_to", "TEXT");
    db.prepare("UPDATE leads SET score = ai_score WHERE score = 0 AND ai_score > 0").run();
    migrateFromLegacyStatuses(db);
    db.prepare("INSERT INTO schema_migrations (version, applied_at) VALUES (1, ?)").run(
      nowIso()
    );
  }

  applyUserOnboardingColumns(db);

  seedDefaultUser(db);
  syncDefaultAdminPassword(db);
  seedAutomationRules(db);

  if (version < 2) {
    migrateToCrmCore(db);
    db.prepare("INSERT INTO schema_migrations (version, applied_at) VALUES (2, ?)").run(
      nowIso()
    );
  }

  seedPipelineStages(db);

  if (version < 3) {
    migrateV3(db);
    db.prepare("INSERT INTO schema_migrations (version, applied_at) VALUES (3, ?)").run(
      nowIso()
    );
  }

  if (version < 4) {
    migrateV4(db);
    db.prepare("INSERT INTO schema_migrations (version, applied_at) VALUES (4, ?)").run(
      nowIso()
    );
  }

  if (version < 5) {
    migrateV5(db);
    db.prepare("INSERT INTO schema_migrations (version, applied_at) VALUES (5, ?)").run(
      nowIso()
    );
  }

  if (version < 6) {
    migrateV6(db);
    db.prepare("INSERT INTO schema_migrations (version, applied_at) VALUES (6, ?)").run(
      nowIso()
    );
  }

  if (version < 7) {
    migrateV7(db);
    db.prepare("INSERT INTO schema_migrations (version, applied_at) VALUES (7, ?)").run(
      nowIso()
    );
  }

  if (version < 8) {
    migrateV8(db);
    db.prepare("INSERT INTO schema_migrations (version, applied_at) VALUES (8, ?)").run(
      nowIso()
    );
  }

  if (version < 9) {
    deduplicateUsersByEmail(db);
    db.prepare("UPDATE users SET email = lower(trim(email))").run();
    db.prepare("INSERT INTO schema_migrations (version, applied_at) VALUES (9, ?)").run(
      nowIso()
    );
  }

  if (version < 10) {
    migrateV10(db);
    db.prepare("INSERT INTO schema_migrations (version, applied_at) VALUES (10, ?)").run(
      nowIso()
    );
  }

  if (version < 11) {
    purgeTestClients(db);
    db.prepare("INSERT INTO schema_migrations (version, applied_at) VALUES (11, ?)").run(
      nowIso()
    );
  }

  if (version < 12) {
    migrateV12Communications(db);
    db.prepare("INSERT INTO schema_migrations (version, applied_at) VALUES (12, ?)").run(
      nowIso()
    );
  }
}

function migrateV7(db: DatabaseSync) {
  db.prepare("UPDATE clients SET status = 'new' WHERE status = 'lead'").run();
  relaxClientsStatusConstraint(db);
}

function migrateV8(db: DatabaseSync) {
  deduplicateUsersByEmail(db);
  db.prepare("UPDATE users SET email = lower(trim(email))").run();
}

function migrateV10(db: DatabaseSync) {
  deduplicateUsersByEmail(db);

  const admin = db
    .prepare("SELECT id FROM users WHERE role = 'admin' ORDER BY created_at ASC, rowid ASC LIMIT 1")
    .get() as { id: string } | undefined;

  if (!admin) return;

  db.prepare("UPDATE clients SET user_id = ?, updated_by = ? WHERE user_id != ?").run(
    admin.id,
    admin.id,
    admin.id
  );
  db.prepare("UPDATE deals SET user_id = ?, updated_by = ? WHERE user_id != ?").run(
    admin.id,
    admin.id,
    admin.id
  );
  db.prepare("UPDATE interactions SET user_id = ? WHERE user_id != ?").run(admin.id, admin.id);
  db.prepare("UPDATE tasks SET user_id = ? WHERE user_id != ?").run(admin.id, admin.id);
}

function deduplicateUsersByEmail(db: DatabaseSync) {
  const groups = db
    .prepare(
      `SELECT lower(email) as norm_email
       FROM users
       GROUP BY lower(email)
       HAVING COUNT(*) > 1`
    )
    .all() as { norm_email: string }[];

  const tablesWithUserId = [
    "clients",
    "deals",
    "interactions",
    "client_notes",
    "tasks",
    "notifications",
    "integrations",
  ] as const;

  for (const { norm_email } of groups) {
    const users = db
      .prepare(
        `SELECT id FROM users WHERE lower(email) = ?
         ORDER BY created_at ASC, rowid ASC`
      )
      .all(norm_email) as { id: string }[];

    if (users.length < 2) continue;

    const canonicalId = users[0].id;
    const duplicateIds = users.slice(1).map((u) => u.id);

    db.exec("BEGIN IMMEDIATE");
    try {
      for (const dupId of duplicateIds) {
        for (const table of tablesWithUserId) {
          db.prepare(`UPDATE ${table} SET user_id = ? WHERE user_id = ?`).run(
            canonicalId,
            dupId
          );
        }
        db.prepare("UPDATE clients SET updated_by = ? WHERE updated_by = ?").run(
          canonicalId,
          dupId
        );
        db.prepare("UPDATE deals SET updated_by = ? WHERE updated_by = ?").run(
          canonicalId,
          dupId
        );
        db.prepare("UPDATE leads SET assigned_to = ? WHERE assigned_to = ?").run(
          canonicalId,
          dupId
        );
        db.prepare("UPDATE activities SET user_id = ? WHERE user_id = ?").run(
          canonicalId,
          dupId
        );
        db.prepare("UPDATE tasks SET assigned_to = ? WHERE assigned_to = ?").run(
          canonicalId,
          dupId
        );
        db.prepare("DELETE FROM user_notification_settings WHERE user_id = ?").run(dupId);
        db.prepare("DELETE FROM password_reset_tokens WHERE user_id = ?").run(dupId);
        db.prepare("DELETE FROM users WHERE id = ?").run(dupId);
      }
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      console.error("[migrations] deduplicateUsersByEmail failed:", error);
      throw error;
    }
  }
}

function relaxClientsStatusConstraint(db: DatabaseSync) {
  const sql = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='clients'").get() as
    | { sql: string }
    | undefined;
  if (!sql?.sql?.includes("CHECK (status IN")) return;

  db.exec(`
    CREATE TABLE clients_new (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL DEFAULT '',
      company TEXT,
      phone TEXT,
      email TEXT,
      source TEXT NOT NULL DEFAULT 'manual',
      status TEXT NOT NULL DEFAULT 'new',
      tags TEXT NOT NULL DEFAULT '[]',
      custom_fields TEXT NOT NULL DEFAULT '{}',
      telegram_user_id TEXT,
      telegram_chat_id TEXT,
      is_vip INTEGER NOT NULL DEFAULT 0,
      is_repeat INTEGER NOT NULL DEFAULT 0,
      ai_sentiment TEXT,
      ai_score INTEGER NOT NULL DEFAULT 0,
      last_contact_at TEXT,
      next_callback_at TEXT,
      is_archived INTEGER NOT NULL DEFAULT 0,
      updated_by TEXT REFERENCES users(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    INSERT INTO clients_new SELECT * FROM clients;
    DROP TABLE clients;
    ALTER TABLE clients_new RENAME TO clients;
    CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
    CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
    CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone);
    CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
    CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_clients_telegram_user ON clients(telegram_user_id);
  `);
}

function migrateV6(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      used_at TEXT,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
  `);
}

function migrateV5(db: DatabaseSync) {
  addColumnIfMissing(db, "deals", "probability", "INTEGER NOT NULL DEFAULT 50");
  addColumnIfMissing(db, "deals", "payment_status", "TEXT NOT NULL DEFAULT 'unpaid'");
  addColumnIfMissing(db, "clients", "is_vip", "INTEGER NOT NULL DEFAULT 0");
  addColumnIfMissing(db, "clients", "is_repeat", "INTEGER NOT NULL DEFAULT 0");
  addColumnIfMissing(db, "clients", "ai_sentiment", "TEXT");
  addColumnIfMissing(db, "clients", "ai_score", "INTEGER NOT NULL DEFAULT 0");
  addColumnIfMissing(db, "clients", "last_contact_at", "TEXT");
  addColumnIfMissing(db, "clients", "next_callback_at", "TEXT");
  addColumnIfMissing(db, "interactions", "channel", "TEXT");
  addColumnIfMissing(db, "interactions", "priority", "TEXT NOT NULL DEFAULT 'medium'");

  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      client_id TEXT REFERENCES clients(id) ON DELETE CASCADE,
      lead_id TEXT REFERENCES leads(id) ON DELETE CASCADE,
      deal_id TEXT REFERENCES deals(id) ON DELETE SET NULL,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      assigned_to TEXT REFERENCES users(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      description TEXT,
      type TEXT NOT NULL DEFAULT 'task',
      priority TEXT NOT NULL DEFAULT 'medium',
      status TEXT NOT NULL DEFAULT 'pending',
      due_date TEXT,
      remind_at TEXT,
      completed_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL DEFAULT 'info',
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      href TEXT,
      is_read INTEGER NOT NULL DEFAULT 0,
      read_at TEXT,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

    CREATE TABLE IF NOT EXISTS integrations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      provider TEXT NOT NULL,
      access_token TEXT,
      refresh_token TEXT,
      is_active INTEGER NOT NULL DEFAULT 0,
      configured_at TEXT,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_integrations_user_id ON integrations(user_id);
  `);

  relaxLeadsSourceConstraint(db);
}

function relaxLeadsSourceConstraint(db: DatabaseSync) {
  const sql = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='leads'").get() as
    | { sql: string }
    | undefined;
  if (!sql?.sql?.includes("CHECK (source IN")) return;

  db.exec(`
    CREATE TABLE leads_new (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      message TEXT,
      telegram_user_id TEXT,
      telegram_chat_id TEXT,
      source TEXT NOT NULL DEFAULT 'telegram',
      status TEXT NOT NULL DEFAULT 'new',
      tags TEXT NOT NULL DEFAULT '[]',
      score INTEGER NOT NULL DEFAULT 0,
      assigned_to TEXT REFERENCES users(id) ON DELETE SET NULL,
      next_call TEXT,
      ai_score INTEGER NOT NULL DEFAULT 0,
      ai_temperature TEXT,
      ai_summary TEXT,
      ai_recommendations TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    INSERT INTO leads_new SELECT * FROM leads;
    DROP TABLE leads;
    ALTER TABLE leads_new RENAME TO leads;
    CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
    CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);
    CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
  `);
}

const DEFAULT_PIPELINE_STAGES = [
  { value: "new", label: "Новый", sort_order: 0 },
  { value: "contact", label: "Контакт", sort_order: 1 },
  { value: "proposal", label: "КП", sort_order: 2 },
  { value: "negotiation", label: "Переговоры", sort_order: 3 },
  { value: "payment", label: "Оплата", sort_order: 4 },
  { value: "closed", label: "Закрыта", sort_order: 5 },
  { value: "rejected", label: "Отказ", sort_order: 6 },
];

function seedPipelineStages(db: DatabaseSync) {
  const count = db.prepare("SELECT COUNT(*) as c FROM pipeline_stages").get() as { c: number };
  if (count.c > 0) return;

  const insert = db.prepare(
    `INSERT INTO pipeline_stages (id, value, label, sort_order, created_at)
     VALUES (?, ?, ?, ?, ?)`
  );
  for (const stage of DEFAULT_PIPELINE_STAGES) {
    insert.run(newId(), stage.value, stage.label, stage.sort_order, nowIso());
  }
}

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  return {
    first_name: parts[0] ?? "Unknown",
    last_name: parts.slice(1).join(" "),
  };
}

function mapLeadStatusToStage(status: string): string {
  const map: Record<string, string> = {
    new: "new",
    contacted: "contact",
    qualified: "negotiation",
    proposal: "proposal",
    won: "closed",
    lost: "rejected",
  };
  return map[status] ?? "new";
}

function migrateToCrmCore(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL DEFAULT '',
      company TEXT,
      phone TEXT,
      email TEXT,
      source TEXT NOT NULL DEFAULT 'manual',
      status TEXT NOT NULL DEFAULT 'active',
      tags TEXT NOT NULL DEFAULT '[]',
      is_archived INTEGER NOT NULL DEFAULT 0,
      updated_by TEXT REFERENCES users(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS deals (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      amount REAL NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'RUB',
      stage TEXT NOT NULL DEFAULT 'new',
      close_date TEXT,
      comment TEXT,
      updated_by TEXT REFERENCES users(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS interactions (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      deal_id TEXT REFERENCES deals(id) ON DELETE SET NULL,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      scheduled_at TEXT,
      status TEXT NOT NULL DEFAULT 'done',
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS client_notes (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      text TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS pipeline_stages (
      id TEXT PRIMARY KEY,
      value TEXT NOT NULL UNIQUE,
      label TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
    CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
    CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone);
    CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
    CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_deals_client_id ON deals(client_id);
    CREATE INDEX IF NOT EXISTS idx_deals_user_id ON deals(user_id);
    CREATE INDEX IF NOT EXISTS idx_deals_stage ON deals(stage);
    CREATE INDEX IF NOT EXISTS idx_deals_created_at ON deals(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_interactions_client_id ON interactions(client_id);
    CREATE INDEX IF NOT EXISTS idx_interactions_created_at ON interactions(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_client_notes_client_id ON client_notes(client_id);
  `);

  const clientCount = db.prepare("SELECT COUNT(*) as c FROM clients").get() as { c: number };
  if (clientCount.c > 0) return;

  const admin = db.prepare("SELECT id FROM users ORDER BY created_at ASC LIMIT 1").get() as
    | { id: string }
    | undefined;
  const defaultUserId = admin?.id;
  if (!defaultUserId) return;

  const leads = db.prepare("SELECT * FROM leads").all() as Record<string, unknown>[];

  const insertClient = db.prepare(
    `INSERT INTO clients (id, user_id, first_name, last_name, company, phone, email, source, status, tags, is_archived, created_at, updated_at)
     VALUES (?, ?, ?, ?, NULL, ?, ?, ?, 'active', ?, 0, ?, ?)`
  );
  const insertDeal = db.prepare(
    `INSERT INTO deals (id, client_id, user_id, title, amount, currency, stage, close_date, comment, created_at, updated_at)
     VALUES (?, ?, ?, ?, 0, 'RUB', ?, NULL, ?, ?, ?)`
  );

  for (const lead of leads) {
    const { first_name, last_name } = splitName(lead.name as string);
    const clientId = newId();
    const userId = (lead.assigned_to as string | null) ?? defaultUserId;
    const now = (lead.updated_at as string) ?? (lead.created_at as string);

    insertClient.run(
      clientId,
      userId,
      first_name,
      last_name,
      lead.phone ?? null,
      lead.email ?? null,
      lead.source ?? "manual",
      lead.tags ?? "[]",
      lead.created_at,
      now
    );

    insertDeal.run(
      newId(),
      clientId,
      userId,
      `Сделка: ${lead.name}`,
      mapLeadStatusToStage(lead.status as string),
      lead.message ?? null,
      lead.created_at,
      now
    );
  }
}

function migrateV3(db: DatabaseSync) {
  addColumnIfMissing(db, "clients", "custom_fields", "TEXT NOT NULL DEFAULT '{}'");
  addColumnIfMissing(db, "clients", "telegram_user_id", "TEXT");
  addColumnIfMissing(db, "clients", "telegram_chat_id", "TEXT");

  db.exec(`
    CREATE TABLE IF NOT EXISTS client_field_definitions (
      id TEXT PRIMARY KEY,
      field_key TEXT NOT NULL UNIQUE,
      label TEXT NOT NULL,
      field_type TEXT NOT NULL DEFAULT 'text',
      options TEXT NOT NULL DEFAULT '[]',
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS user_notification_settings (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      email_enabled INTEGER NOT NULL DEFAULT 0,
      in_app_enabled INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_clients_telegram_user ON clients(telegram_user_id);
  `);

  relaxDealsStageConstraint(db);
  seedDefaultFieldDefinitions(db);

  db.prepare(
    "UPDATE automation_rules SET name = 'Новый лид → Telegram' WHERE trigger = 'lead.created'"
  ).run();
  db.prepare(
    "UPDATE automation_rules SET name = 'Выигранная сделка → Telegram' WHERE trigger = 'deal.won'"
  ).run();
}

function relaxDealsStageConstraint(db: DatabaseSync) {
  const sql = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='deals'").get() as
    | { sql: string }
    | undefined;
  if (!sql?.sql?.includes("CHECK")) return;

  db.exec(`
    CREATE TABLE deals_new (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      amount REAL NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'RUB',
      stage TEXT NOT NULL DEFAULT 'new',
      close_date TEXT,
      comment TEXT,
      updated_by TEXT REFERENCES users(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    INSERT INTO deals_new SELECT * FROM deals;
    DROP TABLE deals;
    ALTER TABLE deals_new RENAME TO deals;
    CREATE INDEX IF NOT EXISTS idx_deals_client_id ON deals(client_id);
    CREATE INDEX IF NOT EXISTS idx_deals_user_id ON deals(user_id);
    CREATE INDEX IF NOT EXISTS idx_deals_stage ON deals(stage);
    CREATE INDEX IF NOT EXISTS idx_deals_created_at ON deals(created_at DESC);
  `);
}

function seedDefaultFieldDefinitions(db: DatabaseSync) {
  const count = db
    .prepare("SELECT COUNT(*) as c FROM client_field_definitions")
    .get() as { c: number };
  if (count.c > 0) return;

  const defaults = [
    { key: "budget", label: "Бюджет", type: "number", sort: 0 },
    { key: "city", label: "Город", type: "text", sort: 1 },
    {
      key: "priority",
      label: "Приоритет",
      type: "select",
      sort: 2,
      options: ["Низкий", "Средний", "Высокий"],
    },
  ];

  const insert = db.prepare(
    `INSERT INTO client_field_definitions (id, field_key, label, field_type, options, sort_order, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );

  for (const field of defaults) {
    insert.run(
      newId(),
      field.key,
      field.label,
      field.type,
      JSON.stringify(field.options ?? []),
      field.sort,
      nowIso()
    );
  }
}

function purgeTestClients(db: DatabaseSync) {
  const result = db
    .prepare(
      `DELETE FROM clients
       WHERE tags LIKE '%"тест"%'
          OR tags LIKE '%"seed"%'
          OR email LIKE 'test%@example.local'`
    )
    .run();

  if (result.changes > 0) {
    console.log(`[migrations] removed ${result.changes} test clients`);
  }
}

/** Extend interactions → full communication history + AI fields */
function migrateV12Communications(db: DatabaseSync) {
  addColumnIfMissing(db, "interactions", "subject", "TEXT");
  addColumnIfMissing(db, "interactions", "summary", "TEXT");
  addColumnIfMissing(db, "interactions", "direction", "TEXT");
  addColumnIfMissing(db, "interactions", "outcome", "TEXT");
  addColumnIfMissing(db, "interactions", "sentiment", "TEXT");
  addColumnIfMissing(db, "interactions", "sentiment_score", "REAL");
  addColumnIfMissing(db, "interactions", "ai_tags", "TEXT NOT NULL DEFAULT '[]'");
  addColumnIfMissing(db, "interactions", "ai_analysis", "TEXT NOT NULL DEFAULT '{}'");
  addColumnIfMissing(db, "interactions", "duration", "INTEGER");
  addColumnIfMissing(db, "interactions", "start_time", "TEXT");
  addColumnIfMissing(db, "interactions", "end_time", "TEXT");
  addColumnIfMissing(db, "interactions", "updated_at", "TEXT");

  db.prepare(
    "UPDATE interactions SET start_time = created_at WHERE start_time IS NULL"
  ).run();
  db.prepare(
    "UPDATE interactions SET updated_at = created_at WHERE updated_at IS NULL"
  ).run();

  relaxInteractionsConstraints(db);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_interactions_type_created
      ON interactions(type, created_at DESC);
  `);
}

function relaxInteractionsConstraints(db: DatabaseSync) {
  const sql = db
    .prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='interactions'")
    .get() as { sql: string } | undefined;
  if (!sql?.sql?.includes("CHECK")) return;

  db.exec(`
    CREATE TABLE interactions_new (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      deal_id TEXT REFERENCES deals(id) ON DELETE SET NULL,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL
        CHECK (type IN ('call', 'email', 'meeting', 'message', 'note', 'task')),
      content TEXT NOT NULL,
      subject TEXT,
      summary TEXT,
      direction TEXT CHECK (direction IN ('inbound', 'outbound') OR direction IS NULL),
      status TEXT NOT NULL DEFAULT 'completed'
        CHECK (status IN ('scheduled', 'completed', 'missed', 'cancelled', 'draft', 'pending', 'done')),
      outcome TEXT,
      sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative') OR sentiment IS NULL),
      sentiment_score REAL,
      ai_tags TEXT NOT NULL DEFAULT '[]',
      ai_analysis TEXT NOT NULL DEFAULT '{}',
      duration INTEGER,
      channel TEXT,
      priority TEXT NOT NULL DEFAULT 'medium',
      scheduled_at TEXT,
      start_time TEXT,
      end_time TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT
    );
    INSERT INTO interactions_new (
      id, client_id, deal_id, user_id, type, content, subject, summary, direction,
      status, outcome, sentiment, sentiment_score, ai_tags, ai_analysis, duration,
      channel, priority, scheduled_at, start_time, end_time, created_at, updated_at
    )
    SELECT
      id, client_id, deal_id, user_id, type, content, subject, summary, direction,
      CASE status
        WHEN 'done' THEN 'completed'
        WHEN 'pending' THEN 'scheduled'
        ELSE status
      END,
      outcome, sentiment, sentiment_score, ai_tags, ai_analysis, duration,
      channel, priority, scheduled_at, start_time, end_time, created_at, updated_at
    FROM interactions;
    DROP TABLE interactions;
    ALTER TABLE interactions_new RENAME TO interactions;
    CREATE INDEX IF NOT EXISTS idx_interactions_client_id ON interactions(client_id);
    CREATE INDEX IF NOT EXISTS idx_interactions_deal_id ON interactions(deal_id);
    CREATE INDEX IF NOT EXISTS idx_interactions_user_id ON interactions(user_id);
    CREATE INDEX IF NOT EXISTS idx_interactions_created_at ON interactions(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_interactions_type_created ON interactions(type, created_at DESC);
  `);
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const attempt = scryptSync(password, salt, 64).toString("hex");
  try {
    return timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(attempt, "hex"));
  } catch {
    return false;
  }
}
