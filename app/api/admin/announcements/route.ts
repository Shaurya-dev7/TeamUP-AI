export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminForApi, logAdminAction, AdminActions } from '@/lib/admin';
import { createServiceClient } from '@/lib/supabase/service';

/**
 * GET /api/admin/announcements
 * List all announcements
 */
export async function GET(request: NextRequest) {
  const admin = await verifyAdminForApi();
  if (!admin) {
    return new NextResponse(null, { status: 404 });
  }

  const supabase = createServiceClient();
  const { searchParams } = new URL(request.url);

  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
  const offset = (page - 1) * limit;

  try {
    const response: any = await supabase
      .from('announcements' as any)
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    const announcements = response.data;
    const count = response.count;
    const error = response.error;

    if (error) {
      // Table might not exist yet
      if (error.code === '42P01') {
        return NextResponse.json({
          announcements: [],
          pagination: { page, limit, total: 0, totalPages: 0 },
        }, { headers: { 'Cache-Control': 'no-store' } });
      }
      throw error;
    }

    // Fetch creator profiles
    const creatorIds = new Set<string>((announcements || []).map((a: any) => a.created_by).filter(Boolean));
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, name')
      .in('id', Array.from(creatorIds));

    const profileMap = new Map((profiles || []).map(p => [p.id, p]));

    const enriched = (announcements || []).map((a: any) => ({
      ...a,
      creator: profileMap.get(a.created_by) || null,
    }));

    return NextResponse.json({
      announcements: enriched,
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
    console.error('[Admin Announcements] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/admin/announcements
 * Create or modify an announcement
 */
export async function POST(request: NextRequest) {
  const admin = await verifyAdminForApi();
  if (!admin) {
    return new NextResponse(null, { status: 404 });
  }

  const supabase = createServiceClient();

  try {
    const body = await request.json();
    const { action, id, title, body: announcementBody, type, expires_at } = body;

    if (action === 'create') {
      if (!title || !announcementBody) {
        return NextResponse.json({ error: 'Title and body are required' }, { status: 400 });
      }

      const { error } = await supabase
        .from('announcements' as any)
        .insert({
          title,
          body: announcementBody,
          type: type || 'info',
          created_by: admin.id,
          expires_at: expires_at || null,
        });

      if (error) throw error;

      await logAdminAction({
        adminUserId: admin.id,
        action: AdminActions.CREATE_ANNOUNCEMENT,
        targetTable: 'announcements',
        metadata: { title, type },
      });

      return NextResponse.json({ success: true, message: 'Announcement created' }, {
        headers: { 'Cache-Control': 'no-store' },
      });
    }

    if (action === 'toggle') {
      if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

      const currentResponse: any = await supabase
        .from('announcements' as any)
        .select('active')
        .eq('id', id)
        .single();
      const current = currentResponse.data;

      const { error } = await supabase
        .from('announcements' as any)
        .update({ active: !current?.active })
        .eq('id', id);

      if (error) throw error;

      return NextResponse.json({ success: true, message: 'Announcement toggled' }, {
        headers: { 'Cache-Control': 'no-store' },
      });
    }

    if (action === 'delete') {
      if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

      const { error } = await supabase
        .from('announcements' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;

      await logAdminAction({
        adminUserId: admin.id,
        action: AdminActions.DELETE_ANNOUNCEMENT,
        targetTable: 'announcements',
        targetId: id.toString(),
      });

      return NextResponse.json({ success: true, message: 'Announcement deleted' }, {
        headers: { 'Cache-Control': 'no-store' },
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('[Admin Announcements Action] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
