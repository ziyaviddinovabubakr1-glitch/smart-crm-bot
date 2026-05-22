const { DatabaseSync } = require("node:sqlite");
const fs = require("fs");
const path = require("path");

const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), "data", "crm.sqlite");

if (!fs.existsSync(dbPath)) {
  console.log("DB not found:", dbPath);
  process.exit(0);
}

const db = new DatabaseSync(dbPath);
db.exec("PRAGMA foreign_keys = ON");

const before = db.prepare("SELECT COUNT(*) as c FROM clients").get();
const deleted = db
  .prepare(
    `DELETE FROM clients
     WHERE tags LIKE '%"тест"%'
        OR tags LIKE '%"seed"%'
        OR email LIKE 'test%@example.local'`
  )
  .run();
const after = db.prepare("SELECT COUNT(*) as c FROM clients").get();

console.log(`Before: ${before.c}, deleted: ${deleted.changes}, after: ${after.c}`);
