# Sales Control — SaaS CRM (Phase 1)

Modern CRM for a small sales team: Telegram intake, pipeline kanban, RBAC, analytics, and rule-based automation. Local SQLite for development.

## Stack

- **Next.js 16** (App Router) + TypeScript + Tailwind CSS
- **SQLite** (`node:sqlite`, встроен в Node 22+) — `data/crm.sqlite`
- **Event bus** + **automation engine** (in-process, no Redis yet)
- **Telegram** — intake + notifications
- **OpenAI** — optional lead analysis

## Quick start

**Требуется Node.js 22.5+** (рекомендуется системный Node из `C:\Program Files\nodejs`).

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) → redirects to login.

**Default admin:** `admin@local.dev` / `admin123`  
Override via `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env.local`.

### Environment

```bash
cp .env.example .env.local
```

| Variable | Purpose |
|----------|---------|
| `DATABASE_PATH` | SQLite file path (default `./data/crm.sqlite`) |
| `AUTH_SECRET` | Session cookie signing |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | First admin user seed |
| `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` | Bot + team notifications |
| `TELEGRAM_WEBHOOK_SECRET` | Webhook auth |
| `OPENAI_API_KEY` | AI scoring (optional) |
| `CRON_SECRET` | Cron endpoint protection |
| `NEXT_PUBLIC_APP_URL` | Public app URL for webhooks |

## Pages

| Route | Description |
|-------|-------------|
| `/login` | Team login (RBAC) |
| `/dashboard` | KPIs, reminders, recent activity |
| `/leads` | Lead table with filters |
| `/pipeline` | Kanban board (drag & drop stages) |
| `/leads/[id]` | Profile, notes, timeline, AI insights |
| `/analytics` | Funnel, source performance, daily chart |
| `/settings` | Users, automation rules, integrations |

## Roles (RBAC)

| Role | Permissions |
|------|-------------|
| Admin | Full access + user management |
| Manager | Leads, pipeline, analytics, automation |
| Sales | Leads + pipeline |
| Viewer | Read-only leads + analytics |

## Pipeline stages

`New → Contacted → Qualified → Proposal → Won / Lost`

## Automation (Phase 1)

Rules stored in SQLite, triggered by events:

- `lead.created` → Telegram notification
- `deal.won` → Telegram notification
- `lead.status_changed` → optional stage alerts (extend in Settings)

## Architecture

```
src/
├── core/events/       # Event bus (emit/onEvent)
├── core/permissions/  # RBAC matrix
├── modules/automation/# Rule engine
├── lib/db/            # SQLite + migrations
├── lib/auth/          # Signed session cookies
├── services/          # leads, activities, analytics, users
├── features/          # UI feature modules
└── app/               # Routes + API
```

## API

- `POST /api/telegram/webhook` — Telegram intake
- `GET /api/cron/reminders` — due reminder notifications

## Phase 2 roadmap

Email channel, webhooks, Redis/BullMQ queues, multi-tenant, Stripe billing, Cmd+K search.
