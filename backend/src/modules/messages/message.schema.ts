import { z } from "zod";

export const messageStatuses = ["Baru", "Dibaca", "Selesai"] as const;

export const contactMessageInput = z.strictObject({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  topic: z.string().trim().min(2).max(120),
  message: z.string().trim().min(10).max(3000),
});

export const messageStatusUpdate = z.strictObject({
  status: z.enum(messageStatuses),
});

export type MessageStatus = (typeof messageStatuses)[number];
export type ContactMessageInput = z.infer<typeof contactMessageInput>;
export type MessageStatusUpdate = z.infer<typeof messageStatusUpdate>