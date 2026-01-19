/**
 * Authorization Guard Utilities
 * 
 * Use these helpers to enforce ownership/permission checks BEFORE database access.
 * Never trust IDs from URL params or request body.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { logApiError } from './error-utils';

// ============================================================
// Types
// ============================================================

export interface AuthenticatedUser {
  id: string;
  email?: string;
}

export type OwnershipCheckResult = 
  | { authorized: true; userId: string }
  | { authorized: false; status: 401 | 403 | 404; error: string };

// ============================================================
// Authentication Helpers
// ============================================================

/**
 * Get authenticated user from Authorization header (Pages Router)
 * Returns null if not authenticated - caller should return 401
 */
export async function getAuthenticatedUser(req: NextApiRequest): Promise<AuthenticatedUser | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
  };
}

/**
 * Require authentication - returns 401 if not authenticated (Pages Router)
 * Use this to guard routes that require login
 */
export async function requireAuth(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<AuthenticatedUser | null> {
  const user = await getAuthenticatedUser(req);
  
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }
  
  return user;
}

// ============================================================
// Ownership Guards
// ============================================================

/**
 * Assert that a resource belongs to the authenticated user
 * 
 * NEVER trust IDs from req.body or URL params!
 * Always verify ownership before database operations.
 * 
 * @example
 * const user = await requireAuth(req, res);
 * if (!user) return; // Already sent 401
 * 
 * const check = assertSameUser(bodyUserId, user.id);
 * if (!check.authorized) {
 *   return res.status(check.status).json({ error: check.error });
 * }
 */
export function assertSameUser(
  claimedUserId: string | undefined,
  authenticatedUserId: string
): OwnershipCheckResult {
  if (!claimedUserId) {
    return { authorized: false, status: 401, error: 'User ID required' };
  }

  if (claimedUserId !== authenticatedUserId) {
    // Return 403 (forbidden) - user exists but doesn't own resource
    // Use 404 if you want to hide resource existence
    return { authorized: false, status: 403, error: 'Permission denied' };
  }

  return { authorized: true, userId: authenticatedUserId };
}

/**
 * For resources where we want to hide existence from unauthorized users,
 * return 404 instead of 403
 */
export function assertSameUserSilent(
  claimedUserId: string | undefined,
  authenticatedUserId: string
): OwnershipCheckResult {
  if (!claimedUserId || claimedUserId !== authenticatedUserId) {
    return { authorized: false, status: 404, error: 'Not found' };
  }

  return { authorized: true, userId: authenticatedUserId };
}

/**
 * Verify user is a member of a resource (team, chat, etc.)
 * Checks membership table before allowing access
 */
export async function assertMembership(
  supabase: any,
  table: string,
  resourceIdColumn: string,
  resourceId: string | number,
  userIdColumn: string,
  userId: string
): Promise<OwnershipCheckResult> {
  try {
    const { data, error } = await supabase
      .from(table)
      .select(userIdColumn)
      .eq(resourceIdColumn, resourceId)
      .eq(userIdColumn, userId)
      .single();

    if (error || !data) {
      return { authorized: false, status: 403, error: 'Permission denied' };
    }

    return { authorized: true, userId };
  } catch (err) {
    logApiError('Membership check', err);
    return { authorized: false, status: 403, error: 'Permission denied' };
  }
}

/**
 * Verify user has specific role for a resource
 */
export async function assertRole(
  supabase: any,
  table: string,
  resourceIdColumn: string,
  resourceId: string | number,
  userIdColumn: string,
  userId: string,
  allowedRoles: string[]
): Promise<OwnershipCheckResult & { role?: string }> {
  try {
    const { data, error } = await supabase
      .from(table)
      .select('role')
      .eq(resourceIdColumn, resourceId)
      .eq(userIdColumn, userId)
      .single();

    if (error || !data) {
      return { authorized: false, status: 403, error: 'Permission denied' };
    }

    if (!allowedRoles.includes(data.role)) {
      return { authorized: false, status: 403, error: 'Permission denied' };
    }

    return { authorized: true, userId, role: data.role };
  } catch (err) {
    logApiError('Role check', err);
    return { authorized: false, status: 403, error: 'Permission denied' };
  }
}

// ============================================================
// Common Patterns
// ============================================================

/**
 * Standard pattern for user-owned resource access
 * 
 * @example
 * // In your API route:
 * export default async function handler(req, res) {
 *   const authResult = await requireAuthAndOwnership(req, res, req.body.user_id);
 *   if (!authResult) return; // Already sent error response
 *   
 *   // Proceed with database query using authResult.userId (NOT body value!)
 *   const { data } = await supabase.from('table').select().eq('user_id', authResult.userId);
 * }
 */
export async function requireAuthAndOwnership(
  req: NextApiRequest,
  res: NextApiResponse,
  claimedUserId?: string
): Promise<{ userId: string } | null> {
  const user = await requireAuth(req, res);
  if (!user) return null; // 401 already sent

  // If no claimed ID provided, just return authenticated user
  if (!claimedUserId) {
    return { userId: user.id };
  }

  const check = assertSameUser(claimedUserId, user.id);
  if (!check.authorized) {
    res.status(check.status).json({ error: check.error });
    return null;
  }

  return { userId: user.id };
}
