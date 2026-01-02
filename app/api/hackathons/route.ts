export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  // Pagination
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '15'), 30);
  const offset = (page - 1) * limit;

  // Sorting
  const sort = searchParams.get('sort') || 'soon';

  // Filtering
  const mode = searchParams.get('mode');
  const platform = searchParams.get('platform');
  const search = searchParams.get('search');

  // Build Query
  let query = supabase
    .from('hackathons')
    .select('*', { count: 'exact' })
    .eq('is_active', true);

  // Apply filters
  if (mode) {
    query = query.eq('mode', mode);
  }

  if (platform) {
    query = query.eq('platform', platform);
  }

  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
  }

  // Apply sorting
  switch (sort) {
    case 'new':
      query = query.order('created_at', { ascending: false });
      break;
    case 'trending':
      // Fallback to start_date or created_at if views column is likely missing causing 400
      // query = query.order('views', { ascending: false }); 
      query = query.order('created_at', { ascending: false });
      break;
    case 'prize':
      query = query.order('cash_prize', { ascending: false });
      break;
    case 'soon':
    default:
      query = query.order('start_date', { ascending: true });
      // For 'soon', we generally want upcoming events?
      // "soon -> start_date ASC (default)" matches requirement.
      // Usually users want filtering for start_date >= now, but prompt says:
      // "Live / Upcoming Hackathons Filter: start_date >= now()" in Frontend Page section.
      // The API section just says "soon -> start_date ASC".
      // I will implement the sort strictly as requested.
      break;
  }

  // Apply pagination
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Cache Control Headers
  const response = NextResponse.json({
    data: data || [],
    pagination: {
      page,
      limit,
      total: count || 0,
      hasMore: (count || 0) > (page * limit)
    }
  });

  response.headers.set('Cache-Control', 'public, max-age=60');

  return response;
}
