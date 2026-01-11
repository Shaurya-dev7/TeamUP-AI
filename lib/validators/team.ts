import { z } from "zod";

export const TeamSchema = z.object({
  name: z.string().min(1, "Team name is required").max(100, "Team name too long"),
  description: z.string().max(1000, "Description too long").optional(),
  goal: z.string().max(500, "Goal too long").optional(),
  
  max_members: z.coerce.number()
    .int()
    .min(2, "Must have at least 2 members")
    .max(50, "Max 50 members allowed")
    .optional()
    .default(10),

  join_mode: z.enum(["open", "request", "closed"]).optional().default("request"),
  
  roles_needed: z.array(z.string().max(50, "Role name too long")).optional(),
});

export type TeamInput = z.infer<typeof TeamSchema>;
