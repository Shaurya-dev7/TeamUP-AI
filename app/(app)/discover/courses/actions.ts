'use server';

import { createClient } from '@/lib/supabase/server'; // Use standard server client (read-only courses is fine for public)
import { createServiceClient } from '@/lib/supabase/service'; // Needed for inserting clicks if RLS blocks public insert?
// User said: "Clients can read courses, insert course_clicks... but cannot modify or read analytics tables directly."
// So standard client can insert course_clicks IF the user is authenticated? Or is it public?
// "Clients can insert course_clicks" implies RLS allows it.
// I will use createClient (cookie based) for tracking to associate with user if possible, but fall back to anon if not requiring auth.
// However, getting Trending uses analytics table which clients CANNOT read.
// So:
// - getNewCourses: Public client (Read courses)
// - getTrendingCourses: Service client (Read clicks) -> Public client (Read courses)
// - trackCourseClick: Service client (Insert click w/o auth?) or Public? 
//   - If "Clients can insert", then Public client should work. But to be safe and robust, Service client for the INSERT is reliable given "cannot read analytics tables". Reading back might be blocked. Service client is safer for the server action.

export async function getNewCourses() {
  console.log("getNewCourses: Starting");
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
    
    if (error) {
        console.error("getNewCourses error", error);
        return [];
    }
    console.log(`getNewCourses: Found ${data?.length} courses`);
    return data || [];
  } catch (err) {
      console.error("getNewCourses Exception:", err);
      return [];
  }
}

export async function getTrendingCourses() {
  console.log("getTrendingCourses: Starting");
  // Must use Service Client because "Clients cannot... read analytics tables directly".
  const supabase = createServiceClient();
  
  // 1. Get clicks
  // We fetch a reasonable amount of recent clicks to determine trend.
  const { data: clicks, error } = await supabase
    .from('course_clicks')
    .select('course_id')
    .limit(2000); // 2000 data points usually enough for prototype trending

  if (error || !clicks) {
      console.error("Trending error in getTrendingCourses", error);
      return [];
  }

  console.log(`getTrendingCourses: Found ${clicks.length} clicks`);

  if (clicks.length === 0) return [];

  // 2. Aggregate
  const counts: Record<string, number> = {};
  clicks.forEach(c => {
      counts[c.course_id] = (counts[c.course_id] || 0) + 1;
  });

  // 3. Sort
  const sortedIds = Object.keys(counts).sort((a,b) => counts[b] - counts[a]).slice(0, 10);

  if (sortedIds.length === 0) return [];

  // 4. Fetch Courses
  const { data: courses } = await supabase
    .from('courses')
    .select('*')
    .in('course_id', sortedIds);

  // 5. Restore Order (SQL 'in' doesn't guarantee order)
  const ordered = sortedIds
    .map(id => courses?.find(c => c.course_id === id))
    .filter(c => c !== undefined);
  
  console.log(`getTrendingCourses: Returned ${ordered.length} courses`);
  return ordered;
}

export async function getAllCourses(page = 1, limit = 20, category?: string) {
  const supabase = await createClient();
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('courses')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (category && category !== 'all') {
    query = query.eq('category', category); // Note: Category is currently null, so "all" is main use case
  }

  const { data, count, error } = await query;
  if (error) console.error("getAllCourses error", error);
  
  return { data: data || [], count: count || 0 };
}

export async function trackCourseClick(courseId: string, sourcePage: string) {
  const supabase = createServiceClient(); // Service role to bypass any RLS issue / potential rate limits

  // 1. Insert Click
  await supabase.from('course_clicks').insert({
      course_id: courseId,
      source_page: sourcePage,
      clicked_at: new Date().toISOString()
  });

  // 2. Return Redirect URL (Fetch from DB to be compliant with "Insert... then fetch")
  const { data, error } = await supabase
    .from('courses')
    .select('redirect_url')
    .eq('course_id', courseId)
    .single();

  if (error || !data) {
      throw new Error("Course not found");
  }

  return data.redirect_url;
}
