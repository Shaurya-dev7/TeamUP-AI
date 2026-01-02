export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type RouteParams = { params: Promise<{ inviteId: string }> };

// POST: Accept or decline invite (idempotent)
export async function POST(request: NextRequest, { params }: RouteParams) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "Supabase env variables are missing" }, { status: 500 });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

  try {
    const { inviteId } = await params;

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
    const { action } = body;

    if (!action || !["accept", "decline"].includes(action)) {
      return NextResponse.json({ error: "action must be 'accept' or 'decline'" }, { status: 400 });
    }

    // Get the invite
    const { data: invite } = await supabaseAdmin
      .from("team_invites")
      .select(`
        id,
        team_id,
        invited_user_id,
        status,
        expires_at,
        team:teams (id, name, status, max_members, conversation_id)
      `)
      .eq("id", inviteId)
      .single();

    if (!invite) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }

    // Verify user is the invited user
    if (invite.invited_user_id !== user.id) {
      return NextResponse.json({ error: "This invite is not for you" }, { status: 403 });
    }

    // Idempotent: if already processed, return success
    if (invite.status !== "pending") {
      return NextResponse.json({ 
        success: true, 
        message: `Invite already ${invite.status}`,
        already_processed: true,
      });
    }

    // Check if expired
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      // Update status to expired
      await supabaseAdmin
        .from("team_invites")
        .update({ status: "expired", responded_at: new Date().toISOString() })
        .eq("id", inviteId);

      return NextResponse.json({ error: "Invite has expired" }, { status: 400 });
    }

    const team = invite.team as any;

    // Check if team is still active
    if (!team || team.status !== "active") {
      await supabaseAdmin
        .from("team_invites")
        .update({ status: "expired", responded_at: new Date().toISOString() })
        .eq("id", inviteId);

      return NextResponse.json({ error: "Team no longer exists or is inactive" }, { status: 400 });
    }

    if (action === "accept") {
      // Check if already a member (idempotent)
      const { data: existingMember } = await supabaseAdmin
        .from("team_members")
        .select("id")
        .eq("team_id", invite.team_id)
        .eq("user_id", user.id)
        .single();

      if (existingMember) {
        // Already a member, just update invite status
        await supabaseAdmin
          .from("team_invites")
          .update({ status: "accepted", responded_at: new Date().toISOString() })
          .eq("id", inviteId);

        return NextResponse.json({ 
          success: true, 
          message: "You are already a team member",
          already_member: true,
        });
      }

      // Check if team is full
      const { count: memberCount } = await supabaseAdmin
        .from("team_members")
        .select("id", { count: "exact", head: true })
        .eq("team_id", invite.team_id);

      if (memberCount && memberCount >= team.max_members) {
        return NextResponse.json({ error: "Team is full" }, { status: 400 });
      }

      // Add user to team
      const { error: memberError } = await supabaseAdmin
        .from("team_members")
        .insert({
          team_id: invite.team_id,
          user_id: user.id,
          role: "member",
        });

      if (memberError) {
        console.error("Member add error:", memberError);
        return NextResponse.json({ error: "Failed to join team" }, { status: 500 });
      }

      // Add to conversation
      if (team.conversation_id) {
        await supabaseAdmin
          .from("conversation_participants")
          .insert({
            conversation_id: team.conversation_id,
            user_id: user.id,
            role: "member",
          });
      }

      // Update invite status
      await supabaseAdmin
        .from("team_invites")
        .update({ status: "accepted", responded_at: new Date().toISOString() })
        .eq("id", inviteId);

      // Get new member's profile for notification
      const { data: newMemberProfile } = await supabaseAdmin
        .from("profiles")
        .select("username, name")
        .eq("id", user.id)
        .single();

      // Notify all team members about new member
      const { data: teamMembers } = await supabaseAdmin
        .from("team_members")
        .select("user_id")
        .eq("team_id", invite.team_id)
        .neq("user_id", user.id);

      if (teamMembers && teamMembers.length > 0) {
        const notifications = teamMembers.map((member: any) => ({
          user_id: member.user_id,
          type: "member_joined",
          entity_type: "team",
          entity_id: invite.team_id.toString(),
          title: "New Team Member",
          message: `@${newMemberProfile?.username || "Someone"} joined "${team.name}"`,
          is_read: false,
        }));
        await supabaseAdmin.from("notifications").insert(notifications);
      }

      return NextResponse.json({ 
        success: true, 
        team_id: invite.team_id,
        message: "You have joined the team!" 
      });

    } else {
      // Decline
      await supabaseAdmin
        .from("team_invitations")
        .update({ status: "rejected", responded_at: new Date().toISOString() })
        .eq("id", inviteId);

      return NextResponse.json({ 
        success: true, 
        message: "Invite declined" 
      });
    }

  } catch (error) {
    console.error("Invite respond error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
