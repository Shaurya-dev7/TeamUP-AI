import { createServiceClient } from '@/lib/supabase/service';

export interface AuditLogParams {
  adminUserId: string;
  action: string;
  targetTable?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
}

/**
 * Log an admin action to the audit trail.
 * This function NEVER silently fails - it throws on error.
 * All admin mutations MUST call this.
 */
export async function logAdminAction({
  adminUserId,
  action,
  targetTable,
  targetId,
  metadata,
  ip,
  userAgent,
}: AuditLogParams): Promise<void> {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from('admin_audit_logs')
    .insert({
      admin_user_id: adminUserId,
      action,
      target_table: targetTable ?? null,
      target_id: targetId ?? null,
      metadata: {
        ...((metadata as any) ?? {}),
        ip,
        userAgent,
      },
    });

  if (error) {
    // Audit logging failures are CRITICAL - throw to halt the operation
    console.error('[AUDIT] Failed to log admin action:', error);
    throw new Error(`Audit logging failed: ${error.message}`);
  }
}

/**
 * Standard admin actions for consistent audit logging
 */
export const AdminActions = {
  // User actions
  VIEW_USER: 'view_user',
  SOFT_BAN_USER: 'soft_ban_user',
  HARD_BAN_USER: 'hard_ban_user',
  SHADOW_BAN_USER: 'shadow_ban_user',
  UNBAN_USER: 'unban_user',
  FORCE_LOGOUT_USER: 'force_logout_user',
  RESET_USERNAME: 'reset_username',
  DELETE_USER: 'delete_user',
  
  // Team actions
  VIEW_TEAM: 'view_team',
  EDIT_TEAM: 'edit_team',
  DELETE_TEAM: 'delete_team',
  TRANSFER_OWNERSHIP: 'transfer_team_ownership',
  REMOVE_ALL_MEMBERS: 'remove_all_team_members',
  
  // Reports
  VIEW_REPORT: 'view_report',
  RESOLVE_REPORT: 'resolve_report',
  DISMISS_REPORT: 'dismiss_report',
  ESCALATE_REPORT: 'escalate_report',
  
  // System
  UPDATE_SYSTEM_FLAG: 'update_system_flag',
  
  // Admin management
  PROMOTE_TO_ADMIN: 'promote_to_admin',
  PROMOTE_TO_SUPER_ADMIN: 'promote_to_super_admin',
  DEMOTE_ADMIN: 'demote_admin',
  REMOVE_ADMIN: 'remove_admin',
  
  // General
  VIEW_AUDIT_LOGS: 'view_audit_logs',
  VIEW_DASHBOARD: 'view_dashboard',
} as const;

export type AdminAction = typeof AdminActions[keyof typeof AdminActions];
