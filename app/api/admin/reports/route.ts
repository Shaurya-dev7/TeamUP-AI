export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminForApi, logAdminAction, AdminActions } from '@/lib/admin';
import { createServiceClient } from '@/lib/supabase/service';
import { AdminReportActionSchema } from '@/lib/validators/admin';

/**
 * GET /api/admin/reports
 * List user reports with filters
 */
export async function GET(request: NextRequest) {
  const admin = await verifyAdminForApi();
  if (!admin) {
    return new NextResponse(null, { status: 404 });
  }

  const supabase = createServiceClient();
  const { searchParams } = new URL(request.url);

  const status = searchParams.get('status') || 'pending';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
  const offset = (page - 1) * limit;

  try {
    let query = supabase
      .from('user_reports')
      .select(`
        id,
        reporter_id,
        reported_user_id,
        reason,
        description,
        status,
        severity,
        created_at,
        resolved_at,
        resolved_by
      `, { count: 'exact' });

    if (status !== 'all') {
      query = query.eq('status', status as 'pending' | 'resolved' | 'dismissed');
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: reports, count, error } = await query;

    if (error) {
      // Table might not exist yet
      if (error.code === '42P01') {
        return NextResponse.json({ 
          reports: [], 
          pagination: { page, limit, total: 0, totalPages: 0 },
          message: 'Reports table not yet created'
        }, {
          headers: { 'Cache-Control': 'no-store' },
        });
      }
      throw error;
    }

    // Fetch user profiles for reporters and reported users
    const userIds = new Set<string>();
    (reports || []).forEach((r: any) => {
      if (r.reporter_id) userIds.add(r.reporter_id);
      if (r.reported_user_id) userIds.add(r.reported_user_id);
    });

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, name')
      .in('id', Array.from(userIds));

    const profileMap = new Map((profiles || []).map(p => [p.id, p]));

    const reportsWithProfiles = (reports || []).map((r: any) => ({
      ...r,
      reporter: profileMap.get(r.reporter_id) || null,
      reportedUser: profileMap.get(r.reported_user_id) || null,
    }));

    return NextResponse.json({
      reports: reportsWithProfiles,
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
    console.error('[Admin Reports] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/admin/reports
 * Perform moderation actions
 */
export async function POST(request: NextRequest) {
  const admin = await verifyAdminForApi();
  if (!admin) {
    return new NextResponse(null, { status: 404 });
  }

  const supabase = createServiceClient();

  try {
    const body = await request.json();
    const validation = AdminReportActionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid input', details: validation.error.flatten() }, { status: 400 });
    }

    const { reportId, action, reason } = validation.data;

    // Get report details
    const { data: report, error: reportError } = await supabase
      .from('user_reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (reportError || !report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    let result: { success: boolean; message: string } = { success: false, message: '' };

    switch (action) {
      case 'dismiss': {
        const { error } = await supabase
          .from('user_reports')
          .update({
            status: 'dismissed',
            resolved_at: new Date().toISOString(),
            resolved_by: admin.id,
          })
          .eq('id', reportId);

        if (error) throw error;

        await logAdminAction({
          adminUserId: admin.id,
          action: AdminActions.DISMISS_REPORT,
          targetTable: 'user_reports',
          targetId: reportId.toString(),
          metadata: { reason },
        });

        result = { success: true, message: 'Report dismissed' };
        break;
      }

      case 'resolve': {
        const { error } = await supabase
          .from('user_reports')
          .update({
            status: 'resolved',
            resolved_at: new Date().toISOString(),
            resolved_by: admin.id,
          })
          .eq('id', reportId);

        if (error) throw error;

        await logAdminAction({
          adminUserId: admin.id,
          action: AdminActions.RESOLVE_REPORT,
          targetTable: 'user_reports',
          targetId: reportId.toString(),
          metadata: { reason, reportedUserId: report.reported_user_id },
        });

        result = { success: true, message: 'Report resolved' };
        break;
      }

      case 'warn_user': {
        // Mark report as resolved and create a warning
        const { error } = await supabase
          .from('user_reports')
          .update({
            status: 'resolved',
            resolved_at: new Date().toISOString(),
            resolved_by: admin.id,
          })
          .eq('id', reportId);

        if (error) throw error;

        await logAdminAction({
          adminUserId: admin.id,
          action: 'warn_user',
          targetTable: 'profiles',
          targetId: report.reported_user_id,
          metadata: { reportId, reason },
        });

        result = { success: true, message: 'User warned and report resolved' };
        break;
      }

      case 'ban_user': {
        // Soft ban the user and resolve report
        await supabase
          .from('profiles')
          .update({ suspended: 'soft_ban' })
          .eq('id', report.reported_user_id);

        await supabase
          .from('user_reports')
          .update({
            status: 'resolved',
            resolved_at: new Date().toISOString(),
            resolved_by: admin.id,
          })
          .eq('id', reportId);

        await logAdminAction({
          adminUserId: admin.id,
          action: AdminActions.SOFT_BAN_USER,
          targetTable: 'profiles',
          targetId: report.reported_user_id,
          metadata: { reportId, reason },
        });

        result = { success: true, message: 'User banned and report resolved' };
        break;
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }

    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('[Admin Reports Action] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
