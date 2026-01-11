export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { verifyAdminForApi, logAdminAction, AdminActions } from '@/lib/admin';
import { createServiceClient } from '@/lib/supabase/service';

/**
 * GET /api/admin/stats
 * Dashboard metrics endpoint
 */
export async function GET() {
  // Verify admin access
  const admin = await verifyAdminForApi();
  if (!admin) {
    return new NextResponse(null, { status: 404 });
  }

  const supabase = createServiceClient();

  try {
    // Fetch all metrics in parallel
    const [
      usersResult,
      teamsResult,
      activeUsersResult,
      newSignupsResult,
      reportsResult,
      systemFlagsResult,
    ] = await Promise.all([
      // Total users
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      
      // Total teams
      supabase.from('teams').select('id', { count: 'exact', head: true }),
      
      // Active users (last 24h)
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gte('last_active_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
      
      // New signups (last 7 days)
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      
      // Pending reports (if table exists)
      supabase
        .from('user_reports')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending'),
      
      // System flags
      supabase.from('system_flags').select('key, value'),
    ]);

    // Parse system flags into object
    const systemFlags: Record<string, boolean> = {};
    if (systemFlagsResult.data) {
      for (const flag of systemFlagsResult.data) {
        systemFlags[flag.key] = flag.value;
      }
    }

    const stats = {
      totalUsers: usersResult.count ?? 0,
      totalTeams: teamsResult.count ?? 0,
      activeUsers24h: activeUsersResult.count ?? 0,
      newSignups7d: newSignupsResult.count ?? 0,
      pendingReports: reportsResult.count ?? 0,
      systemFlags,
      timestamp: new Date().toISOString(),
    };

    // Log dashboard view
    await logAdminAction({
      adminUserId: admin.id,
      action: AdminActions.VIEW_DASHBOARD,
      metadata: { stats },
    });

    return NextResponse.json(stats, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    console.error('[Admin Stats] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
