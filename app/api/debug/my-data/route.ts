export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase env variables are missing");
  }
  return createClient(supabaseUrl, supabaseKey);
}

export async function GET(request: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: "Invalid token", details: authError }, { status: 401 });
    }

    // 1. Get raw memberships
    const { data: rawMemberships, error: memberError } = await supabaseAdmin
        .from("team_members")
        .select("*")
        .eq("user_id", user.id);

    // 2. Get teams for those memberships
    let rawTeams: any[] = [];
    if (rawMemberships && rawMemberships.length > 0) {
        const teamIds = rawMemberships.map(m => m.team_id);
        const { data: teams } = await supabaseAdmin
            .from("teams")
            .select("*")
            .in("id", teamIds);
        rawTeams = teams || [];
    }

    // 3. Get profile
    const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

    return NextResponse.json({
        user_id: user.id,
        profile,
        memberships_count: rawMemberships?.length || 0,
        raw_memberships: rawMemberships,
        raw_teams: rawTeams,
        teams_found_count: rawTeams.length,
        member_error: memberError
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}
