export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminForApi, logAdminAction, AdminActions } from '@/lib/admin';
import { createServiceClient } from '@/lib/supabase/service';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/teams/[id]
 * Get detailed team information
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const admin = await verifyAdminForApi();
  if (!admin) {
    return new NextResponse(null, { status: 404 });
  }

  const { id: teamId } = await params;
  const supabase = createServiceClient();

  try {
    // Fetch team with all related data
    const { data: team, error } = await supabase
      .from('teams')
      .select(`
        *,
        team_members (
          id,
          user_id,
          role,
          joined_at,
          profiles:user_id (id, username, name, avatar_url)
        ),
        team_roles_needed (role_name),
        team_invites (
          id,
          invited_user_id,
          invited_by,
          status,
          created_at
        ),
        team_join_requests (
          id,
          user_id,
          status,
          created_at
        )
      `)
      .eq('id', parseInt(teamId))
      .single();

    if (error || !team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    await logAdminAction({
      adminUserId: admin.id,
      action: AdminActions.VIEW_TEAM,
      targetTable: 'teams',
      targetId: teamId,
    });

    return NextResponse.json({ team }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    console.error('[Admin Team Detail] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/teams/[id]
 * Edit team details
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const admin = await verifyAdminForApi();
  if (!admin) {
    return new NextResponse(null, { status: 404 });
  }

  const { id: teamId } = await params;
  const supabase = createServiceClient();

  try {
    const body = await request.json();
    const { name, description, goal, join_mode, status } = body;

    const updates: Record<string, any> = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (goal !== undefined) updates.goal = goal;
    if (join_mode !== undefined) updates.join_mode = join_mode;
    if (status !== undefined) updates.status = status;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
    }

    const { error } = await supabase
      .from('teams')
      .update(updates)
      .eq('id', parseInt(teamId));

    if (error) throw error;

    await logAdminAction({
      adminUserId: admin.id,
      action: AdminActions.EDIT_TEAM,
      targetTable: 'teams',
      targetId: teamId,
      metadata: { updates },
    });

    return NextResponse.json({ success: true, message: 'Team updated' }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('[Admin Team Edit] Error:', error);
    return NextResponse.json({ error: 'Failed to update team' }, { status: 500 });
  }
}

/**
 * POST /api/admin/teams/[id]
 * Perform admin actions on a team
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const admin = await verifyAdminForApi();
  if (!admin) {
    return new NextResponse(null, { status: 404 });
  }

  const { id: teamId } = await params;
  const supabase = createServiceClient();

  try {
    const body = await request.json();
    const { action, reason, newOwnerId } = body;

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    let result: { success: boolean; message: string } = { success: false, message: '' };

    switch (action) {
      case 'force_delete': {
        // Mark team as deleted (soft delete)
        const { error } = await supabase
          .from('teams')
          .update({ status: 'deleted' })
          .eq('id', parseInt(teamId));

        if (error) throw error;

        await logAdminAction({
          adminUserId: admin.id,
          action: AdminActions.DELETE_TEAM,
          targetTable: 'teams',
          targetId: teamId,
          metadata: { reason },
        });

        result = { success: true, message: 'Team deleted' };
        break;
      }

      case 'transfer_ownership': {
        if (!newOwnerId) {
          return NextResponse.json({ error: 'New owner ID required' }, { status: 400 });
        }

        // Get current leader
        const { data: currentLeader } = await supabase
          .from('team_members')
          .select('user_id')
          .eq('team_id', parseInt(teamId))
          .eq('role', 'leader')
          .single();

        // Demote current leader to member
        if (currentLeader) {
          await supabase
            .from('team_members')
            .update({ role: 'member' })
            .eq('team_id', parseInt(teamId))
            .eq('user_id', currentLeader.user_id);
        }

        // Check if new owner is already a member
        const { data: existingMember } = await supabase
          .from('team_members')
          .select('id')
          .eq('team_id', parseInt(teamId))
          .eq('user_id', newOwnerId)
          .single();

        if (existingMember) {
          // Promote to leader
          await supabase
            .from('team_members')
            .update({ role: 'leader' })
            .eq('team_id', parseInt(teamId))
            .eq('user_id', newOwnerId);
        } else {
          // Add as leader
          await supabase
            .from('team_members')
            .insert({
              team_id: parseInt(teamId),
              user_id: newOwnerId,
              role: 'leader',
            });
        }

        await logAdminAction({
          adminUserId: admin.id,
          action: AdminActions.TRANSFER_OWNERSHIP,
          targetTable: 'teams',
          targetId: teamId,
          metadata: { previousOwner: currentLeader?.user_id, newOwner: newOwnerId, reason },
        });

        result = { success: true, message: 'Ownership transferred' };
        break;
      }

      case 'remove_all_members': {
        // Remove all non-leader members
        const { error } = await supabase
          .from('team_members')
          .delete()
          .eq('team_id', parseInt(teamId))
          .neq('role', 'leader');

        if (error) throw error;

        await logAdminAction({
          adminUserId: admin.id,
          action: AdminActions.REMOVE_ALL_MEMBERS,
          targetTable: 'team_members',
          targetId: teamId,
          metadata: { reason },
        });

        result = { success: true, message: 'All members removed (except leader)' };
        break;
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }

    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('[Admin Team Action] Error:', error);
    return NextResponse.json({ error: 'Action failed' }, { status: 500 });
  }
}
