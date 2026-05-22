import { z } from "zod";

const optionalDate = z.string().trim().min(1).optional().nullable();

export const createCommunicationSchema = z.object({
  type: z.enum(["call", "email", "meeting", "message", "note", "task"]),
  content: z.string().trim().min(1, "content required"),
  subject: z.string().trim().optional().nullable(),
  direction: z.enum(["inbound", "outbound"]).optional().nullable(),
  status: z
    .enum(["scheduled", "completed", "missed", "cancelled", "draft", "pending", "done"])
    .optional(),
  deal_id: z.string().min(1).optional().nullable(),
  scheduled_at: optionalDate,
  start_time: optionalDate,
  end_time: optionalDate,
  duration: z.number().int().min(0).optional().nullable(),
  channel: z.string().trim().max(64).optional().nullable(),
  analyze: z.boolean().optional(),
});

export type CreateCommunicationInput = z.infer<typeof createCommunicationSchema>;

export const updateCommunicationSchema = createCommunicationSchema.partial().extend({
  content: z.string().trim().min(1).optional(),
});

export type UpdateCommunicationInput = z.infer<typeof updateCommunicationSchema>;
