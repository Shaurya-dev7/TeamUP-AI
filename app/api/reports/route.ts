import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const user = await getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createClient();

  try {
    const body = await request.json();
    const { type, reason, description, reported_user_id } = body;

    if (!type || !reason) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (type === 'user' && !reported_user_id) {
      return NextResponse.json({ error: 'Reported user ID is required for user reports' }, { status: 400 });
    }

    // Insert into user_reports
    const { error } = await (supabase as any)
      .from('user_reports')
      .insert({
        reporter_id: user.id,
        reported_user_id: type === 'user' ? reported_user_id : null,
        reason,
        description,
        status: 'pending',
        severity: type === 'bug' ? 'low' : 'medium', // Default severities
      });

    if (error) {
      console.error('[Reports API] DB Error:', error);
      return NextResponse.json({ error: 'Failed to submit report' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Report submitted successfully' });
  } catch (error) {
    console.error('[Reports API] Request Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
