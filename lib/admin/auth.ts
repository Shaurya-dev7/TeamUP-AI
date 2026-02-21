import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

// Admin role hierarchy
export type AdminRole = 'super_admin' | 'admin' | 'senior_moderator' | 'moderator';

// Role Power Levels mapping (higher number = higher power)
export const ROLE_POWER: Record<AdminRole, number> = {
  super_admin: 100,
  admin: 90,
  senior_moderator: 70,
  moderator: 50,
};

/**
 * Validates if the actor has permission to promote to the target role.
 * rule: 
 *  super_admin -> everyone
 *  admin -> up to senior_moderator
 *  senior_moderator -> moderator
 *  moderator -> none
 */
export function canPromote(actorRole: AdminRole, targetRole: AdminRole): boolean {
  if (actorRole === 'super_admin') return true;
  if (actorRole === 'admin') {
    return targetRole === 'senior_moderator' || targetRole === 'moderator';
  }
  if (actorRole === 'senior_moderator') {
    return targetRole === 'moderator';
  }
  return false;
}

/**
 * Validates if the actor has permission to demote the target role.
 * rule:
 *  super_admin -> everyone
 *  admin -> demote senior_moderator, moderator
 *  senior_moderator -> demote moderator
 *  moderator -> none
 */
export function canDemote(actorRole: AdminRole, targetRole: AdminRole): boolean {
  if (actorRole === 'super_admin') return true;
  // Can only demote someone who has strictly less power
  return ROLE_POWER[actorRole] > ROLE_POWER[targetRole];
}

export interface AdminUser {
  id: string;
  email?: string;
  role: AdminRole;
}

/**
 * Get the current user's admin role.
 * Returns null if user is not an admin.
 * NEVER cache this - always check fresh.
 */
export async function getAdminRole(): Promise<{ user: AdminUser } | null> {
  const supabase = await createClient();
  
  // Always use getUser() for secure server-side auth
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return null;
  }

  // Use service client to bypass RLS for admin check
  const serviceClient = createServiceClient();
  
  const { data: adminRole, error: roleError } = await serviceClient
    .from('admin_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (roleError || !adminRole) {
    return null;
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      role: adminRole.role as AdminRole,
    },
  };
}

/**
 * Require admin access. Returns 404 if not admin.
 * Use this in Server Components and API routes.
 * This is the PRIMARY guard for admin pages.
 */
export async function requireAdmin(): Promise<AdminUser> {
  const result = await getAdminRole();
  
  if (!result) {
    // Return 404 to hide admin existence
    notFound();
  }

  return result.user;
}

/**
 * Require super_admin access. Returns 404 if not super_admin.
 * Use this for sensitive operations like admin management.
 */
export async function requireSuperAdmin(): Promise<AdminUser> {
  const result = await getAdminRole();
  
  if (!result || result.user.role !== 'super_admin') {
    // Return 404 to hide admin existence
    notFound();
  }

  return result.user;
}

/**
 * Check if current user is admin (for conditional rendering).
 * Does NOT throw - returns boolean.
 */
export async function isAdmin(): Promise<boolean> {
  const result = await getAdminRole();
  return result !== null;
}

/**
 * Check if current user is super_admin.
 * Does NOT throw - returns boolean.
 */
export async function isSuperAdmin(): Promise<boolean> {
  const result = await getAdminRole();
  return result?.user.role === 'super_admin';
}

/**
 * Verify admin access for API routes.
 * Returns the admin user or null (caller handles 404 response).
 */
export async function verifyAdminForApi(): Promise<AdminUser | null> {
  const result = await getAdminRole();
  return result?.user ?? null;
}

/**
 * Verify super_admin access for API routes.
 * Returns the admin user or null (caller handles 404 response).
 */
export async function verifySuperAdminForApi(): Promise<AdminUser | null> {
  const result = await getAdminRole();
  if (!result || result.user.role !== 'super_admin') {
    return null;
  }
  return result.user;
}
