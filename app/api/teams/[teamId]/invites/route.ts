export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type RouteParams = { params: Promise<{ teamId: string }> };

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase env variables are missing");
  }
  return createClient(supabaseUrl, supabaseKey);
}

// GET: List pending invites for this team (leader/co_leader only)
export async function GET(request: NextRequest, { params }: RouteParams) {
  const supabaseAdmin = getSupabaseAdmin();
  try {
    const { teamId } = await params;
    const teamIdNum = parseInt(teamId);

    if (isNaN(teamIdNum)) {
      return NextResponse.json({ error: "Invalid team ID" }, { status: 400 });
    }

    // Authenticate
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Check if user is leader or co_leader
    const { data: membership } = await supabaseAdmin
      .from("team_members")
      .select("role")
      .eq("team_id", teamIdNum)
      .eq("user_id", user.id)
      .single();

    if (!membership || !["leader", "co_leader"].includes(membership.role)) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    // Fetch pending invites
    const { data: invites, error } = await supabaseAdmin
      .from("team_invites")
      .select(`
        id,
        invited_user_id,
        invited_by,
        message,
        status,
        created_at,
        expires_at,
        invited_user:invited_user_id (id, username, name),
        inviter:invited_by (id, username, name)
      `)
      .eq("team_id", teamIdNum)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Invites fetch error:", error);
      return NextResponse.json({ error: "Failed to fetch invites" }, { status: 500 });
    }

    const invitesData = (invites || []).map((inv: any) => ({
      id: inv.id,
      status: inv.status,
      message: inv.message,
      created_at: inv.created_at,
      expires_at: inv.expires_at,
      invited_user: {
        id: inv.invited_user?.id,
        username: inv.invited_user?.username,
        name: inv.invited_user?.name,
      },
      invited_by: {
        id: inv.inviter?.id,
        username: inv.inviter?.username,
        name: inv.inviter?.name,
      },
    }));

    return NextResponse.json({ invites: invitesData });

  } catch (error) {
    console.error("Invites API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST: Send invite to a user (leader/co_leader only)
export async function POST(request: NextRequest, { params }: RouteParams) {
  const supabaseAdmin = getSupabaseAdmin();
  try {
    const { teamId } = await params;
    const teamIdNum = parseInt(teamId);

    if (isNaN(teamIdNum)) {
      return NextResponse.json({ error: "Invalid team ID" }, { status: 400 });
    }

    // Authenticate
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body = await request.json();
    const { user_id, message } = body;

    if (!user_id) {
      return NextResponse.json({ error: "user_id is required" }, { status: 400 });
    }

    // Check if user is leader or co_leader
    const { data: membership } = await supabaseAdmin
      .from("team_members")
      .select("role")
      .eq("team_id", teamIdNum)
      .eq("user_id", user.id)
      .single();

    if (!membership || !["leader", "co_leader"].includes(membership.role)) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    // Check if team exists and is active
    const { data: team } = await supabaseAdmin
      .from("teams")
      .select("id, status, max_members")
      .eq("id", teamIdNum)
      .eq("status", "active")
      .single();

    if (!team) {
      return NextResponse.json({ error: "Team not found or inactive" }, { status: 404 });
    }

    // Check if team is full
    const { count: memberCount } = await supabaseAdmin
      .from("team_members")
      .select("id", { count: "exact", head: true })
      .eq("team_id", teamIdNum);

    if (memberCount && memberCount >= team.max_members) {
      return NextResponse.json({ error: "Team is full" }, { status: 400 });
    }

    // Check if user is already a member
    const { data: existingMember } = await supabaseAdmin
      .from("team_members")
      .select("id")
      .eq("team_id", teamIdNum)
      .eq("user_id", user_id)
      .single();

    if (existingMember) {
      return NextResponse.json({ error: "User is already a team member" }, { status: 400 });
    }

    // Check for existing pending invite (unique constraint will catch this, but better UX)
    const { data: existingInvite } = await supabaseAdmin
      .from("team_invites")
      .select("id")
      .eq("team_id", teamIdNum)
      .eq("invited_user_id", user_id)
      .eq("status", "pending")
      .maybeSingle();

    if (existingInvite) {
      return NextResponse.json({ error: "User already has a pending invite" }, { status: 400 });
    }

    // Get team name and inviter info for notification
    const { data: teamInfo } = await supabaseAdmin
      .from("teams")
      .select("name")
      .eq("id", teamIdNum)
      .single();

    const { data: inviterProfile } = await supabaseAdmin
      .from("profiles")
      .select("username, name")
      .eq("id", user.id)
      .single();

    // Create invite
    const { data: invite, error: inviteError } = await supabaseAdmin
      .from("team_invites")
      .insert({
        team_id: teamIdNum,
        invited_user_id: user_id,
        invited_by: user.id,
        message: message || null,
        status: 'pending',
      })
      .select("id")
      .single();

    if (inviteError) {
      console.error("Invite creation error:", inviteError);
      return NextResponse.json({ error: "Failed to send invite" }, { status: 500 });
    }

    // Create notification for invited user
    await supabaseAdmin.from("notifications").insert({
      user_id: user_id,
      type: "team_invite",
      entity_type: "team_invitation",
      entity_id: invite.id,
      title: "Team Invitation",
      message: `@${inviterProfile?.username || "Someone"} invited you to join "${teamInfo?.name || "a team"}"`,
      actions: JSON.stringify([
        { label: "Accept", action: "ACCEPT_INVITE", invite_id: invite.id },
        { label: "Reject", action: "REJECT_INVITE", invite_id: invite.id }
      ]),
      is_read: false,
    });

    return NextResponse.json({ 
      success: true, 
      invite_id: invite.id,
      message: "Invite sent successfully" 
    }, { status: 201 });

  } catch (error) {
    console.error("Invite creation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
