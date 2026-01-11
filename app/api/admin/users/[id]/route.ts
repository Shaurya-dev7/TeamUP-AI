export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminForApi, verifySuperAdminForApi, logAdminAction, AdminActions } from '@/lib/admin';
import { createServiceClient } from '@/lib/supabase/service';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/users/[id]
 * Get detailed user information
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const admin = await verifyAdminForApi();
  if (!admin) {
    return new NextResponse(null, { status: 404 });
  }

  const { id: userId } = await params;
  const supabase = createServiceClient();

  try {
    // Fetch comprehensive user data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch team memberships
    const { data: teamMemberships } = await supabase
      .from('team_members')
      .select(`
        role,
        joined_at,
        teams:team_id (id, name, status)
      `)
      .eq('user_id', userId);

    // Fetch report count (as target)
    const { count: reportCount } = await supabase
      .from('user_reports')
      .select('id', { count: 'exact', head: true })
      .eq('reported_user_id', userId);

    // Fetch admin role if exists
    const { data: adminRole } = await supabase
      .from('admin_roles')
      .select('role, granted_at')
      .eq('user_id', userId)
      .single();

    // Log the view action
    await logAdminAction({
      adminUserId: admin.id,
      action: AdminActions.VIEW_USER,
      targetTable: 'profiles',
      targetId: userId,
    });

    return NextResponse.json({
      user: {
        ...profile,
        teamMemberships: teamMemberships || [],
        reportCount: reportCount || 0,
        adminRole: adminRole?.role || null,
        adminGrantedAt: adminRole?.granted_at || null,
      },
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    console.error('[Admin User Detail] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/admin/users/[id]
 * Perform admin actions on a user
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const admin = await verifyAdminForApi();
  if (!admin) {
    return new NextResponse(null, { status: 404 });
  }

  const { id: userId } = await params;
  const supabase = createServiceClient();

  try {
    const body = await request.json();
    const { action, reason } = body;

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    // Prevent self-modification
    if (userId === admin.id) {
      return NextResponse.json({ error: 'Cannot modify yourself' }, { status: 403 });
    }

    // Check if target is an admin (only super_admin can modify admins)
    const { data: targetAdminRole } = await supabase
      .from('admin_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (targetAdminRole && admin.role !== 'super_admin') {
      return NextResponse.json({ error: 'Only super_admin can modify other admins' }, { status: 403 });
    }

    let result: { success: boolean; message: string } = { success: false, message: '' };

    switch (action) {
      case 'soft_ban': {
        // Soft ban - user can still log in but with restricted access
        const { error } = await supabase
          .from('profiles')
          .update({ suspended: 'soft_ban' })
          .eq('id', userId);

        if (error) throw error;

        await logAdminAction({
          adminUserId: admin.id,
          action: AdminActions.SOFT_BAN_USER,
          targetTable: 'profiles',
          targetId: userId,
          metadata: { reason },
        });

        result = { success: true, message: 'User soft banned' };
        break;
      }

      case 'hard_ban': {
        // Hard ban - complete account disable
        const { error } = await supabase
          .from('profiles')
          .update({ suspended: 'hard_ban' })
          .eq('id', userId);

        if (error) throw error;

        await logAdminAction({
          adminUserId: admin.id,
          action: AdminActions.HARD_BAN_USER,
          targetTable: 'profiles',
          targetId: userId,
          metadata: { reason },
        });

        result = { success: true, message: 'User hard banned' };
        break;
      }

      case 'shadow_ban': {
        // Shadow ban - user is unaware they're banned
        const { error } = await supabase
          .from('profiles')
          .update({ suspended: 'shadow_ban' })
          .eq('id', userId);

        if (error) throw error;

        await logAdminAction({
          adminUserId: admin.id,
          action: AdminActions.SHADOW_BAN_USER,
          targetTable: 'profiles',
          targetId: userId,
          metadata: { reason },
        });

        result = { success: true, message: 'User shadow banned' };
        break;
      }

      case 'unban': {
        const { error } = await supabase
          .from('profiles')
          .update({ suspended: null })
          .eq('id', userId);

        if (error) throw error;

        await logAdminAction({
          adminUserId: admin.id,
          action: AdminActions.UNBAN_USER,
          targetTable: 'profiles',
          targetId: userId,
          metadata: { reason },
        });

        result = { success: true, message: 'User unbanned' };
        break;
      }

      case 'force_logout': {
        // Force logout by invalidating all sessions
        // This requires auth.admin API
        const { error } = await supabase.auth.admin.signOut(userId, 'global');

        if (error) throw error;

        await logAdminAction({
          adminUserId: admin.id,
          action: AdminActions.FORCE_LOGOUT_USER,
          targetTable: 'auth.users',
          targetId: userId,
          metadata: { reason },
        });

        result = { success: true, message: 'User sessions terminated' };
        break;
      }

      case 'reset_username': {
        const { newUsername } = body;
        if (!newUsername) {
          return NextResponse.json({ error: 'New username is required' }, { status: 400 });
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', userId)
          .single();

        const oldUsername = profile?.username;

        const { error } = await supabase
          .from('profiles')
          .update({ username: newUsername })
          .eq('id', userId);

        if (error) throw error;

        await logAdminAction({
          adminUserId: admin.id,
          action: AdminActions.RESET_USERNAME,
          targetTable: 'profiles',
          targetId: userId,
          metadata: { oldUsername, newUsername, reason },
        });

        result = { success: true, message: 'Username reset' };
        break;
      }

      case 'delete_account': {
        // This is destructive - require super_admin
        const superAdmin = await verifySuperAdminForApi();
        if (!superAdmin) {
          return NextResponse.json({ error: 'Super admin required for account deletion' }, { status: 403 });
        }

        // Delete user from auth (cascades to profiles via trigger)
        const { error } = await supabase.auth.admin.deleteUser(userId);

        if (error) throw error;

        await logAdminAction({
          adminUserId: admin.id,
          action: AdminActions.DELETE_USER,
          targetTable: 'auth.users',
          targetId: userId,
          metadata: { reason, deletedBy: admin.id },
        });

        result = { success: true, message: 'Account deleted' };
        break;
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    console.error('[Admin User Action] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Action failed' },
      { status: 500 }
    );
  }
}
