import { z } from "zod";

export const agendaInput = z.object({
  title: z.string().trim().min(2).max(160),
  date: z.iso.date(),
  time: z.string().regex(/^(?:[01][0-9]|2[0-3]):[0-5][0-9]$/),
  location: z.string().trim().min(2).max(160),
  type: z.enum(["Akademik", "PPDB", "Kegiatan", "Rapat"]),
  completed: z.boolean(),
  visibility: z.enum(["Publik", "Internal"]),
});
export type AgendaInput = z.infer<typeof agendaInput>;
export type Agenda = AgendaInput & { id: string };
