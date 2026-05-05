import { notFound } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/service';
import { getUser } from '@/lib/auth';

// Admin role hierarchy
export type AdminRole = 'super_admin' | 'admin' | 'senior_moderator' | 'moderator';

// Role Power Levels mapping (higher number = higher power)
export const ROLE_POWER: Record<AdminRole, number> = {
  super_admin: 100,
  admin: 90,
  senior_moderator: 70,
  moderator: 50,
};

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

export function canDemote(actorRole: AdminRole, targetRole: AdminRole): boolean {
  if (actorRole === 'super_admin') return true;
  return ROLE_POWER[actorRole] > ROLE_POWER[targetRole];
}

export interface AdminUser {
  id: string;
  email?: string;
  role: AdminRole;
}

export async function getAdminRole(): Promise<{ user: AdminUser } | null> {
  // Use centralized getUser utility
  const user = await getUser();
  
  if (!user) {
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

export async function requireAdmin(): Promise<AdminUser> {
  const result = await getAdminRole();
  
  if (!result) {
    notFound();
  }

  return result.user;
}

export async function requireSuperAdmin(): Promise<AdminUser> {
  const result = await getAdminRole();
  
  if (!result || result.user.role !== 'super_admin') {
    notFound();
  }

  return result.user;
}

export async function isAdmin(): Promise<boolean> {
  const result = await getAdminRole();
  return result !== null;
}

export async function isSuperAdmin(): Promise<boolean> {
  const result = await getAdminRole();
  return result?.user.role === 'super_admin';
}

export async function verifyAdminForApi(): Promise<AdminUser | null> {
  const result = await getAdminRole();
  return result?.user ?? null;
}

export async function verifySuperAdminForApi(): Promise<AdminUser | null> {
  const result = await getAdminRole();
  if (!result || result.user.role !== 'super_admin') {
    return null;
  }
  return result.user;
}
