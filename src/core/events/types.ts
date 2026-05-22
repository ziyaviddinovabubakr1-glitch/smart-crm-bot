import type { LeadStatus } from "@/types";

export type CrmEvent =
  | { type: "lead.created"; leadId: string; source: string }
  | { type: "lead.status_changed"; leadId: string; from: LeadStatus; to: LeadStatus }
  | { type: "lead.no_activity"; leadId: string; days: number; status: LeadStatus }
  | { type: "deal.won"; leadId: string }
  | { type: "deal.lost"; leadId: string };

export type EventHandler = (event: CrmEvent) => void | Promise<void>;
