import { z } from 'zod';

// Schema for performing actions on a user (e.g., ban, unban, reset username)
export const AdminUserActionSchema = z.object({
  action: z.enum([
    'soft_ban',
    'hard_ban',
    'shadow_ban',
    'unban',
    'force_logout',
    'reset_username',
    'delete_account',
  ]),
  reason: z.string().optional(),
  newUsername: z.string().min(3).max(30).optional(),
}).refine((data) => {
  if (data.action === 'reset_username' && !data.newUsername) {
    return false;
  }
  return true;
}, {
  message: "New username is required for reset_username action",
  path: ["newUsername"],
});

// Schema for resolving user reports
export const AdminReportActionSchema = z.object({
  reportId: z.string().uuid("Invalid Report ID"),
  action: z.enum(['dismiss', 'resolve', 'warn_user', 'ban_user']),
  reason: z.string().optional(),
});

// Schema for updating system flags
export const AdminSystemFlagSchema = z.object({
  key: z.string().min(1, "Key is required"),
  value: z.boolean({ message: "Boolean value is required" }),
});

export type AdminUserActionInput = z.infer<typeof AdminUserActionSchema>;
export type AdminReportActionInput = z.infer<typeof AdminReportActionSchema>;
export type AdminSystemFlagInput = z.infer<typeof AdminSystemFlagSchema>;
