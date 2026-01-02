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
    // Authenticate user
    const authHeader = request.headers.get("Authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      console.error("Mine API: Auth logic error", authError);
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    console.log("Mine API: Fetching for user", user.id);

    // 1. Get all team IDs where user is a member
    const { data: memberships, error: membershipError } = await supabaseAdmin
      .from("team_members")
      .select("team_id, role, joined_at")
      .eq("user_id", user.id);

    if (membershipError) {
      console.error("My Teams membership fetch error:", membershipError);
      return NextResponse.json({ error: "Failed to fetch memberships" }, { status: 500 });
    }

    if (!memberships || memberships.length === 0) {
      return NextResponse.json({ teams: [] });
    }

    const teamIds = memberships.map(m => m.team_id);

    // 2. Fetch full team details
    const { data: teamsData, error: teamsError } = await supabaseAdmin
      .from("teams")
      .select(`
        id,
        name,
        goal,
        join_mode,
        max_members,
        created_at,
        team_roles_needed (role_name),
        team_members (id),
        creator:created_by (id, username, name)
      `)
      .in("id", teamIds)
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (teamsError) {
      console.error("My Teams fetch error:", teamsError);
      return NextResponse.json({ error: "Failed to fetch team details" }, { status: 500 });
    }

    // 3. Transform
    const teams = (teamsData || []).map((team: any) => ({
      id: team.id,
      name: team.name,
      goal: team.goal,
      join_mode: team.join_mode,
      is_private: team.join_mode === 'closed',
      max_members: team.max_members,
      member_count: team.team_members?.length || 0,
      roles_needed: (team.team_roles_needed || []).map((r: any) => r.role_name),
      created_at: team.created_at,
    }));

    return NextResponse.json({ teams });

  } catch (error) {
    console.error("My Teams API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
