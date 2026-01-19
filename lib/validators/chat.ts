import { z } from 'zod';

export const DirectChatSchema = z.object({
  otherId: z.string().uuid("Invalid user ID"),
});

export const GroupChatSchema = z.object({
  name: z.string().min(1, "Group name is required").max(100, "Group name is too long"),
  memberIds: z.array(z.string().uuid("Invalid member ID"))
    .min(1, "At least one member is required")
    .max(50, "Too many members"), // Arbitrary limit for safety
});

export const GroupActionSchema = z.object({
  conversationId: z.string().uuid("Invalid conversation ID"),
  action: z.enum(['leave', 'remove', 'promote']),
  targetUserId: z.string().uuid("Invalid target user ID").optional(),
}).refine((data) => {
  if (['remove', 'promote'].includes(data.action) && !data.targetUserId) {
    return false;
  }
  return true;
}, {
  message: "Target user ID is required for this action",
  path: ["targetUserId"],
});

export type DirectChatInput = z.infer<typeof DirectChatSchema>;
export type GroupChatInput = z.infer<typeof GroupChatSchema>;
export type GroupActionInput = z.infer<typeof GroupActionSchema>;
