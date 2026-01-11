export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminForApi } from '@/lib/admin';
import { createServiceClient } from '@/lib/supabase/service';

/**
 * GET /api/admin/teams
 * List all teams (including private) with filters
 */
export async function GET(request: NextRequest) {
  const admin = await verifyAdminForApi();
  if (!admin) {
    return new NextResponse(null, { status: 404 });
  }

  const supabase = createServiceClient();
  const { searchParams } = new URL(request.url);

  const search = searchParams.get('search') || '';
  const filter = searchParams.get('filter') || 'all'; // all, active, archived, deleted
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
  const offset = (page - 1) * limit;

  try {
    let query = supabase
      .from('teams')
      .select(`
        id,
        name,
        description,
        goal,
        join_mode,
        max_members,
        status,
        created_at,
        created_by,
        team_members (
          user_id,
          role,
          profiles:user_id (username, name)
        )
      `, { count: 'exact' });

    // Apply search
    if (search) {
      const isNumeric = !isNaN(parseInt(search)) && String(parseInt(search)) === search;
      if (isNumeric) {
        query = query.or(`id.eq.${search},name.ilike.%${search}%`);
      } else {
        query = query.ilike('name', `%${search}%`);
      }
    }

    // Apply status filter
    if (filter !== 'all') {
      query = query.eq('status', filter);
    }

    // Pagination
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: teams, count, error } = await query;

    if (error) {
      console.error('[Admin Teams] Error:', error);
      return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 });
    }

    // Transform with member count and leader info
    const teamsWithInfo = (teams || []).map((team: any) => {
      const members = team.team_members || [];
      const leader = members.find((m: any) => m.role === 'leader');
      
      return {
        ...team,
        memberCount: members.length,
        leader: leader?.profiles ? {
          userId: leader.user_id,
          username: leader.profiles.username,
          name: leader.profiles.name,
        } : null,
        team_members: undefined, // Don't expose full member list in list view
      };
    });

    return NextResponse.json({
      teams: teamsWithInfo,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    console.error('[Admin Teams] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
