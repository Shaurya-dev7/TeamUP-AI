export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { verifySuperAdminForApi, logAdminAction, AdminActions } from '@/lib/admin';
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
 * Manage admin roles (super_admin only)
 */
export async function POST(request: NextRequest) {
  const admin = await verifySuperAdminForApi();
  if (!admin) {
    return new NextResponse(null, { status: 404 });
  }

  const supabase = createServiceClient();

  try {
    const body = await request.json();
    const { action, userId, role } = body;

    if (!action || !userId) {
      return NextResponse.json({ error: 'Action and userId required' }, { status: 400 });
    }

    // Prevent self-modification
    if (userId === admin.id) {
      return NextResponse.json({ error: 'Cannot modify your own admin role' }, { status: 403 });
    }

    let result: { success: boolean; message: string } = { success: false, message: '' };

    switch (action) {
      case 'promote': {
        if (!role || !['admin', 'moderator', 'super_admin'].includes(role)) {
          return NextResponse.json({ error: 'Valid role required' }, { status: 400 });
        }

        // Check if already an admin
        const { data: existing } = await supabase
          .from('admin_roles')
          .select('role')
          .eq('user_id', userId)
          .single();

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

          await logAdminAction({
            adminUserId: admin.id,
            action: role === 'super_admin' ? AdminActions.PROMOTE_TO_SUPER_ADMIN : AdminActions.PROMOTE_TO_ADMIN,
            targetTable: 'admin_roles',
            targetId: userId,
            metadata: { previousRole: existing.role, newRole: role },
          });
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

          await logAdminAction({
            adminUserId: admin.id,
            action: role === 'super_admin' ? AdminActions.PROMOTE_TO_SUPER_ADMIN : AdminActions.PROMOTE_TO_ADMIN,
            targetTable: 'admin_roles',
            targetId: userId,
            metadata: { newRole: role },
          });
        }

        result = { success: true, message: `User promoted to ${role}` };
        break;
      }

      case 'demote': {
        if (!role || !['admin', 'moderator'].includes(role)) {
          return NextResponse.json({ error: 'Valid role required for demotion' }, { status: 400 });
        }

        const { data: existing } = await supabase
          .from('admin_roles')
          .select('role')
          .eq('user_id', userId)
          .single();

        if (!existing) {
          return NextResponse.json({ error: 'User is not an admin' }, { status: 400 });
        }

        const { error } = await supabase
          .from('admin_roles')
          .update({ role })
          .eq('user_id', userId);

        if (error) throw error;

        await logAdminAction({
          adminUserId: admin.id,
          action: AdminActions.DEMOTE_ADMIN,
          targetTable: 'admin_roles',
          targetId: userId,
          metadata: { previousRole: existing.role, newRole: role },
        });

        result = { success: true, message: `User demoted to ${role}` };
        break;
      }

      case 'remove': {
        const { data: existing } = await supabase
          .from('admin_roles')
          .select('role')
          .eq('user_id', userId)
          .single();

        if (!existing) {
          return NextResponse.json({ error: 'User is not an admin' }, { status: 400 });
        }

        const { error } = await supabase
          .from('admin_roles')
          .delete()
          .eq('user_id', userId);

        if (error) throw error;

        await logAdminAction({
          adminUserId: admin.id,
          action: AdminActions.REMOVE_ADMIN,
          targetTable: 'admin_roles',
          targetId: userId,
          metadata: { removedRole: existing.role },
        });

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
