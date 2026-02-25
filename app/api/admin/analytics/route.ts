export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { verifyAdminForApi, logAdminAction, AdminActions } from '@/lib/admin';
import { createServiceClient } from '@/lib/supabase/service';

/**
 * GET /api/admin/analytics
 * Returns analytics data for the admin dashboard
 */
export async function GET() {
  const admin = await verifyAdminForApi();
  if (!admin) {
    return new NextResponse(null, { status: 404 });
  }

  const supabase = createServiceClient();

  try {
    // Get daily signups for last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    
    const { data: recentProfiles } = await supabase
      .from('profiles')
      .select('created_at')
      .gte('created_at', thirtyDaysAgo)
      .order('created_at', { ascending: true });

    // Aggregate signups by day
    const signupsByDay: Record<string, number> = {};
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      signupsByDay[date.toISOString().slice(0, 10)] = 0;
    }
    
    (recentProfiles || []).forEach(p => {
      const day = new Date(p.created_at).toISOString().slice(0, 10);
      if (signupsByDay[day] !== undefined) {
        signupsByDay[day]++;
      }
    });

    // Get daily active users for last 14 days
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    
    const { data: activeProfiles } = await supabase
      .from('profiles')
      .select('last_active_at')
      .gte('last_active_at', fourteenDaysAgo);

    const activeByDay: Record<string, number> = {};
    for (let i = 13; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      activeByDay[date.toISOString().slice(0, 10)] = 0;
    }

    (activeProfiles || []).forEach(p => {
      if (p.last_active_at) {
        const day = new Date(p.last_active_at).toISOString().slice(0, 10);
        if (activeByDay[day] !== undefined) {
          activeByDay[day]++;
        }
      }
    });

    // Get team growth (teams created)
    const { data: recentTeams } = await supabase
      .from('teams')
      .select('created_at')
      .gte('created_at', thirtyDaysAgo)
      .order('created_at', { ascending: true });

    const teamsByDay: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      teamsByDay[date.toISOString().slice(0, 10)] = 0;
    }
    
    (recentTeams || []).forEach(t => {
      const day = new Date(t.created_at).toISOString().slice(0, 10);
      if (teamsByDay[day] !== undefined) {
        teamsByDay[day]++;
      }
    });

    // Get totals
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true });
    
    const { count: totalTeams } = await supabase
      .from('teams')
      .select('id', { count: 'exact', head: true });

    const { count: bannedUsers } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .not('suspended', 'is', null);

    const { count: completedProfiles } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('profile_completed', true);

    await logAdminAction({
      adminUserId: admin.id,
      action: AdminActions.VIEW_ANALYTICS,
    });

    return NextResponse.json({
      signupTrend: Object.entries(signupsByDay).map(([date, count]) => ({ date, count })),
      activeTrend: Object.entries(activeByDay).map(([date, count]) => ({ date, count })),
      teamTrend: Object.entries(teamsByDay).map(([date, count]) => ({ date, count })),
      totals: {
        users: totalUsers || 0,
        teams: totalTeams || 0,
        banned: bannedUsers || 0,
        completedProfiles: completedProfiles || 0,
      }
    }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('[Admin Analytics] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
