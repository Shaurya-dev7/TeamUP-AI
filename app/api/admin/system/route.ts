export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { verifySuperAdminForApi, logAdminAction, AdminActions } from '@/lib/admin';
import { createServiceClient } from '@/lib/supabase/service';

/**
 * GET /api/admin/system
 * Get current system flags
 */
export async function GET() {
  const admin = await verifySuperAdminForApi();
  if (!admin) {
    return new NextResponse(null, { status: 404 });
  }

  const supabase = createServiceClient();

  try {
    const { data: flags, error } = await supabase
      .from('system_flags')
      .select('*')
      .order('key');

    if (error) throw error;

    return NextResponse.json({ flags: flags || [] }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('[Admin System] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch system flags' }, { status: 500 });
  }
}

/**
 * POST /api/admin/system
 * Update system flags (super_admin only)
 */
export async function POST(request: NextRequest) {
  const admin = await verifySuperAdminForApi();
  if (!admin) {
    return new NextResponse(null, { status: 404 });
  }

  const supabase = createServiceClient();

  try {
    const body = await request.json();
    const { key, value } = body;

    if (!key || typeof value !== 'boolean') {
      return NextResponse.json({ error: 'Key and boolean value required' }, { status: 400 });
    }

    // Get current value for audit log
    const { data: currentFlag } = await supabase
      .from('system_flags')
      .select('value')
      .eq('key', key)
      .single();

    // Upsert the flag
    const { error } = await supabase
      .from('system_flags')
      .upsert({
        key,
        value,
        updated_at: new Date().toISOString(),
        updated_by: admin.id,
      }, { onConflict: 'key' });

    if (error) throw error;

    await logAdminAction({
      adminUserId: admin.id,
      action: AdminActions.UPDATE_SYSTEM_FLAG,
      targetTable: 'system_flags',
      targetId: key,
      metadata: {
        previousValue: currentFlag?.value,
        newValue: value,
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: `${key} set to ${value}` 
    }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('[Admin System Update] Error:', error);
    return NextResponse.json({ error: 'Failed to update flag' }, { status: 500 });
  }
}
