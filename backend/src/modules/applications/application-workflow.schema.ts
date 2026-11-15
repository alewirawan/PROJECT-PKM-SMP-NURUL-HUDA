import { z } from "zod";

export const applicationIdParams = z.strictObject({
  applicationId: z.string().regex(/^NH-[A-Z0-9-]+$/),
});
