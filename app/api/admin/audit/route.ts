export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminForApi, logAdminAction, AdminActions } from '@/lib/admin';
import { createServiceClient } from '@/lib/supabase/service';

/**
 * GET /api/admin/audit
 * View audit logs (read-only)
 */
export async function GET(request: NextRequest) {
  const admin = await verifyAdminForApi();
  if (!admin) {
    return new NextResponse(null, { status: 404 });
  }

  const supabase = createServiceClient();
  const { searchParams } = new URL(request.url);

  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
  const offset = (page - 1) * limit;
  
  // Optional filters
  const adminUserId = searchParams.get('admin_user_id');
  const action = searchParams.get('action');
  const targetTable = searchParams.get('target_table');
  const startDate = searchParams.get('start_date');
  const endDate = searchParams.get('end_date');

  try {
    let query = supabase
      .from('admin_audit_logs')
      .select('*', { count: 'exact' });

    // Apply filters
    if (adminUserId) {
      query = query.eq('admin_user_id', adminUserId);
    }
    if (action) {
      query = query.eq('action', action);
    }
    if (targetTable) {
      query = query.eq('target_table', targetTable);
    }
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: logs, count, error } = await query;

    if (error) throw error;

    // Fetch admin profiles
    const adminIds = new Set((logs || []).map(l => l.admin_user_id));
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, name')
      .in('id', Array.from(adminIds));

    const profileMap = new Map((profiles || []).map(p => [p.id, p]));

    const logsWithProfiles = (logs || []).map(log => ({
      ...log,
      adminProfile: profileMap.get(log.admin_user_id) || null,
    }));

    // Log that someone viewed audit logs
    await logAdminAction({
      adminUserId: admin.id,
      action: AdminActions.VIEW_AUDIT_LOGS,
      metadata: { page, filters: { adminUserId, action, targetTable } },
    });

    return NextResponse.json({
      logs: logsWithProfiles,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('[Admin Audit] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
  }
}

// No POST, PATCH, DELETE - audit logs are immutable
