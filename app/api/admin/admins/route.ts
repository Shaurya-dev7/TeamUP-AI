export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminForApi, verifySuperAdminForApi, logAdminAction, AdminActions } from '@/lib/admin';
import { canPromote, canDemote, AdminRole } from '@/lib/admin/auth';
import { createServiceClient } from '@/lib/supabase/service';

/**
 * GET /api/admin/admins
 * List all admin users (super_admin only)
 */
export async function GET() {
  const admin = await verifySuperAdminForApi();
  if (!admin) {
    return new NextResponse(null, { status: 404 });
  }

  const supabase = createServiceClient();

  try {
    const { data: admins, error } = await supabase
      .from('admin_roles')
      .select(`
        user_id,
        role,
        granted_at,
        granted_by
      `)
      .order('granted_at', { ascending: false });

    if (error) throw error;

    // Fetch profile info for each admin
    const adminIds = (admins || []).map(a => a.user_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, name, email, avatar_url')
      .in('id', adminIds);

    const profileMap = new Map((profiles || []).map(p => [p.id, p]));

    const adminsWithProfiles = (admins || []).map(a => ({
      ...a,
      profile: profileMap.get(a.user_id) || null,
    }));

    return NextResponse.json({ admins: adminsWithProfiles }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('[Admin Admins List] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch admins' }, { status: 500 });
  }
}

/**
 * POST /api/admin/admins
 * Manage admin roles (based on strict hierarchy)
 */
export async function POST(request: NextRequest) {
  const admin = await verifyAdminForApi();
  if (!admin) {
    return new NextResponse(null, { status: 404 });
  }

  const supabase = createServiceClient();

  try {
    const body = await request.json();
    let { action, userId, role } = body;

    if (!action || !userId) {
      return NextResponse.json({ error: 'Action and userId required' }, { status: 400 });
    }

    // Check if userId is actually a username (not a UUID)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
    if (!isUUID) {
       // Lookup user by username
       const { data: profileObj, error: profileErr } = await supabase
         .from('profiles')
         .select('id')
         .eq('username', userId)
         .single();
         
       if (profileErr || !profileObj) {
          return NextResponse.json({ error: `User with username '@${userId}' not found.` }, { status: 404 });
       }
       
       userId = profileObj.id; // Override with the actual UUID
    }

    // Prevent self-modification
    if (userId === admin.id) {
      return NextResponse.json({ error: 'Cannot modify your own admin role' }, { status: 403 });
    }

    let result: { success: boolean; message: string } = { success: false, message: '' };

    // Get client IP for audit logs
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

    // Fetch existing role of the target user if any
    const { data: existing } = await supabase
      .from('admin_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    const currentRole = (existing?.role as AdminRole) || null;

    // Helper to insert into admin_activity_logs
    const insertAuditLog = async (actionDesc: string, targetRole: string | null) => {
      await supabase.from('admin_activity_logs').insert({
        actor_id: admin.id,
        target_id: userId,
        action: actionDesc,
        old_role: currentRole,
        new_role: targetRole,
        ip_address: ipAddress,
      });
    };

    switch (action) {
      case 'promote': {
        if (!role || !['admin', 'senior_moderator', 'moderator', 'super_admin'].includes(role)) {
          return NextResponse.json({ error: 'Valid role required' }, { status: 400 });
        }

        // Check authority
        if (!canPromote(admin.role as AdminRole, role as AdminRole)) {
          return NextResponse.json({ error: 'You do not have permission to promote to this role' }, { status: 403 });
        }

        // If target exists, ensure we can modify them
        if (currentRole && !canDemote(admin.role as AdminRole, currentRole)) {
           return NextResponse.json({ error: 'You do not have authority to modify this user' }, { status: 403 });
        }

        if (existing) {
          // Update role
          const { error } = await supabase
            .from('admin_roles')
            .update({ 
              role,
              granted_at: new Date().toISOString(),
              granted_by: admin.id,
            })
            .eq('user_id', userId);

          if (error) throw error;
        } else {
          // Insert new admin
          const { error } = await supabase
            .from('admin_roles')
            .insert({
              user_id: userId,
              role,
              granted_by: admin.id,
            });

          if (error) throw error;
        }

        await insertAuditLog(`Promoted to ${role}`, role);
        result = { success: true, message: `User promoted to ${role}` };
        break;
      }

      case 'demote': {
         if (!role || !['admin', 'senior_moderator', 'moderator'].includes(role)) {
          return NextResponse.json({ error: 'Valid role required for demotion' }, { status: 400 });
        }

        if (!existing) {
          return NextResponse.json({ error: 'User is not an admin' }, { status: 400 });
        }

        // Can the actor modify the target user's current role?
        if (!canDemote(admin.role as AdminRole, currentRole as AdminRole)) {
          return NextResponse.json({ error: 'You do not have authority to demote this user' }, { status: 403 });
        }

        // Is the demotion target actually a lower role than what the actor can assign?
        // Actually, if we are demoting, we consider it assigning a new role (which is a promotion-like power check)
        // or just ensure they end up lower than the actor.
        if (admin.role !== 'super_admin') {
           // Admin can demote a senior_mod to mod.
           if (admin.role === 'admin' && role !== 'moderator') {
             return NextResponse.json({ error: 'Admins can only demote to moderator' }, { status: 403 });
           }
        }

        const { error } = await supabase
          .from('admin_roles')
          .update({ role })
          .eq('user_id', userId);

        if (error) throw error;

        await insertAuditLog(`Demoted to ${role}`, role);
        result = { success: true, message: `User demoted to ${role}` };
        break;
      }

      case 'remove': {
        if (!existing) {
          return NextResponse.json({ error: 'User is not an admin' }, { status: 400 });
        }

        if (!canDemote(admin.role as AdminRole, currentRole as AdminRole)) {
          return NextResponse.json({ error: 'You do not have authority to remove this user' }, { status: 403 });
        }

        const { error } = await supabase
          .from('admin_roles')
          .delete()
          .eq('user_id', userId);

        if (error) throw error;

        await insertAuditLog('Removed admin access', null);
        result = { success: true, message: 'Admin access removed' };
        break;
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }

    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('[Admin Admins Action] Error:', error);
    return NextResponse.json({ error: 'Action failed' }, { status: 500 });
  }
}
