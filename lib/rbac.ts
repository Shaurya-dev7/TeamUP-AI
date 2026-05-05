import { cache } from 'react';
import { notFound, redirect } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/service';
import { getUser } from '@/lib/auth';

export type UserRole = 'super_admin' | 'admin' | 'senior_moderator' | 'moderator' | 'user';

/**
 * Fetch a user's role from the database.
 * Wrapped in React cache to prevent multiple DB queries per request.
 * Normal users won't be in the admin_roles table, so they default to 'user'.
 */
export const getUserRole = cache(async (userId: string): Promise<UserRole> => {
  const serviceClient = createServiceClient();
  
  const { data, error } = await serviceClient
    .from('admin_roles')
    .select('role')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return 'user';
  }

  return data.role as UserRole;
});

/**
 * Ensures the currently authenticated user has the specified role (or higher).
 * This checks the DB on the server side, ensuring client claims cannot bypass security.
 * 
 * Hierarchy: super_admin > admin > senior_moderator > moderator > user
 */
const ROLE_POWER: Record<UserRole, number> = {
  super_admin: 100,
  admin: 90,
  senior_moderator: 70,
  moderator: 50,
  user: 10,
};

export async function requireRole(requiredRole: UserRole): Promise<{ id: string; role: UserRole }> {
  const user = await getUser();
  
  if (!user) {
    redirect('/login');
  }

  const role = await getUserRole(user.id);

  if (ROLE_POWER[role] < ROLE_POWER[requiredRole]) {
    notFound(); // Hide the existence of protected pages if unauthorized
  }

  return { id: user.id, role };
}

/**
 * Shorthand for requiring any admin-level role.
 */
export async function requireAdmin() {
  return requireRole('moderator');
}
