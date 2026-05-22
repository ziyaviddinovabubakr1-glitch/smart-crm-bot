-- Internal Telegram CRM — schema (single-team, admin auth via Supabase)

CREATE TYPE lead_status AS ENUM (
  'new',
  'contacted',
  'interested',
  'follow_up',
  'paid',
  'lost'
);

CREATE TYPE ai_temperature AS ENUM ('hot', 'warm', 'cold');

CREATE TYPE reminder_status AS ENUM ('pending', 'done', 'missed');

-- Leads (primary entity — intake from Telegram)
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  message TEXT,
  telegram_user_id TEXT,
  telegram_chat_id TEXT,
  source TEXT NOT NULL DEFAULT 'telegram',
  status lead_status NOT NULL DEFAULT 'new',
  next_call TIMESTAMPTZ,
  ai_score INTEGER DEFAULT 0 CHECK (ai_score >= 0 AND ai_score <= 100),
  ai_temperature ai_temperature,
  ai_summary TEXT,
  ai_recommendations JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  remind_at TIMESTAMPTZ NOT NULL,
  comment TEXT,
  status reminder_status NOT NULL DEFAULT 'pending',
  notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_leads_created_at ON public.leads(created_at DESC);
CREATE INDEX idx_leads_telegram_user ON public.leads(telegram_user_id);
CREATE INDEX idx_leads_next_call ON public.leads(next_call) WHERE next_call IS NOT NULL;
CREATE INDEX idx_reminders_pending ON public.reminders(remind_at) WHERE status = 'pending';
CREATE INDEX idx_notes_lead_id ON public.notes(lead_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS: any authenticated team member (admin login)
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leads_authenticated" ON public.leads
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "notes_authenticated" ON public.notes
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "reminders_authenticated" ON public.reminders
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Service role bypasses RLS for Telegram webhook (use service key in API routes)
