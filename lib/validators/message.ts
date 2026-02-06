import { z } from "zod";
import { sanitizeInput } from "@/lib/utils/sanitize";

export const MessageSchema = z.object({
  // Receiver ID must be a valid UUID
  receiver_id: z.string().uuid("Invalid receiver ID"),

  // Content must be sanitized and length-limited
  content: z.string()
    .min(1, "Message cannot be empty")
    .max(2000, "Message too long (max 2000 chars)")
    .transform(sanitizeInput)
    .refine(val => val.length > 0, "Message cannot be empty after sanitization"),
});

export type MessageInput = z.infer<typeof MessageSchema>;
