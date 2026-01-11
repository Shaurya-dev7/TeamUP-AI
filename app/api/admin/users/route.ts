export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminForApi, logAdminAction, AdminActions } from '@/lib/admin';
import { createServiceClient } from '@/lib/supabase/service';

/**
 * GET /api/admin/users
 * Search and list users with filters
 */
export async function GET(request: NextRequest) {
  const admin = await verifyAdminForApi();
  if (!admin) {
    return new NextResponse(null, { status: 404 });
  }

  const supabase = createServiceClient();
  const { searchParams } = new URL(request.url);

  // Parse query params
  const search = searchParams.get('search') || '';
  const filter = searchParams.get('filter') || 'all'; // all, banned, active, reported
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
  const offset = (page - 1) * limit;

  try {
    let query = supabase
      .from('profiles')
      .select(`
        id,
        username,
        name,
        email,
        avatar_url,
        suspended,
        created_at,
        last_active_at,
        profile_completed
      `, { count: 'exact' });

    // Apply search filter
    if (search) {
      // Search by username, email, or user ID
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(search);
      
      if (isUUID) {
        query = query.eq('id', search);
      } else if (search.includes('@')) {
        query = query.ilike('email', `%${search}%`);
      } else {
        query = query.or(`username.ilike.%${search}%,name.ilike.%${search}%`);
      }
    }

    // Apply status filter
    switch (filter) {
      case 'banned':
        query = query.not('suspended', 'is', null);
        break;
      case 'active':
        query = query
          .is('suspended', null)
          .gte('last_active_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
        break;
      case 'reported':
        // This would require a join with reports table
        // For now, we'll handle this separately
        break;
    }

    // Apply pagination
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: users, count, error } = await query;

    if (error) {
      console.error('[Admin Users] Query error:', error);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    return NextResponse.json({
      users: users || [],
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
    console.error('[Admin Users] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
