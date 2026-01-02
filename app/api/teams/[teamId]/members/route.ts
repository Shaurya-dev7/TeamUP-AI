import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type RouteParams = { params: Promise<{ teamId: string }> };

// GET: List team members (for team members only)
export async function GET(request: NextRequest, { params }: RouteParams) {
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

    // Check if user is a member
    const { data: membership } = await supabaseAdmin
      .from("team_members")
      .select("role")
      .eq("team_id", teamIdNum)
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: "Not a team member" }, { status: 403 });
    }

    // Fetch all members with profile info
    const { data: members, error } = await supabaseAdmin
      .from("team_members")
      .select(`
        id,
        user_id,
        role,
        joined_at,
        updated_at,
        profiles:user_id (id, username, name, skills)
      `)
      .eq("team_id", teamIdNum)
      .order("role", { ascending: true })
      .order("joined_at", { ascending: true });

    if (error) {
      console.error("Members fetch error:", error);
      return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 });
    }

    const membersData = (members || []).map((m: any) => ({
      id: m.id,
      user_id: m.user_id,
      role: m.role,
      joined_at: m.joined_at,
      username: m.profiles?.username,
      name: m.profiles?.name,
      skills: m.profiles?.skills,
    }));

    return NextResponse.json({ 
      members: membersData,
      user_role: membership.role,
    });

  } catch (error) {
    console.error("Members API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH: Update member role (leader/co_leader only)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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
    const { member_id, new_role } = body;

    if (!member_id || !new_role) {
      return NextResponse.json({ error: "member_id and new_role required" }, { status: 400 });
    }

    if (!["co_leader", "member"].includes(new_role)) {
      return NextResponse.json({ error: "Invalid role. Use 'co_leader' or 'member'" }, { status: 400 });
    }

    // Check if user is leader or co_leader
    const { data: actorMembership } = await supabaseAdmin
      .from("team_members")
      .select("role")
      .eq("team_id", teamIdNum)
      .eq("user_id", user.id)
      .single();

    if (!actorMembership || !["leader", "co_leader"].includes(actorMembership.role)) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    // Get target member
    const { data: targetMember } = await supabaseAdmin
      .from("team_members")
      .select("role, user_id")
      .eq("id", member_id)
      .eq("team_id", teamIdNum)
      .single();

    if (!targetMember) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Cannot change leader's role
    if (targetMember.role === "leader") {
      return NextResponse.json({ error: "Cannot change leader's role" }, { status: 403 });
    }

    // Co-leaders can only demote other co-leaders if they are not themselves
    if (actorMembership.role === "co_leader" && targetMember.role === "co_leader" && new_role === "member") {
      // Only leader can demote co-leaders
      return NextResponse.json({ error: "Only the leader can demote co-leaders" }, { status: 403 });
    }

    // Update role
    const { error: updateError } = await supabaseAdmin
      .from("team_members")
      .update({ role: new_role })
      .eq("id", member_id);

    if (updateError) {
      console.error("Role update error:", updateError);
      return NextResponse.json({ error: "Failed to update role" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: `Role updated to ${new_role}` });

  } catch (error) {
    console.error("Member update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE: Remove member or leave team
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get("user_id");

    // Get actor's membership
    const { data: actorMembership } = await supabaseAdmin
      .from("team_members")
      .select("role")
      .eq("team_id", teamIdNum)
      .eq("user_id", user.id)
      .single();

    if (!actorMembership) {
      return NextResponse.json({ error: "Not a team member" }, { status: 403 });
    }

    // Determine if leaving self or removing another
    const isLeavingSelf = !targetUserId || targetUserId === user.id;
    const removeUserId = isLeavingSelf ? user.id : targetUserId;

    if (!isLeavingSelf) {
      // Removing another member - need leader/co_leader permission
      if (!["leader", "co_leader"].includes(actorMembership.role)) {
        return NextResponse.json({ error: "Permission denied" }, { status: 403 });
      }

      // Get target member
      const { data: targetMember } = await supabaseAdmin
        .from("team_members")
        .select("role")
        .eq("team_id", teamIdNum)
        .eq("user_id", targetUserId)
        .single();

      if (!targetMember) {
        return NextResponse.json({ error: "Member not found" }, { status: 404 });
      }

      // Cannot remove leader
      if (targetMember.role === "leader") {
        return NextResponse.json({ error: "Cannot remove the team leader" }, { status: 403 });
      }

      // Co-leaders can only remove members, not other co-leaders
      if (actorMembership.role === "co_leader" && targetMember.role === "co_leader") {
        return NextResponse.json({ error: "Co-leaders cannot remove other co-leaders" }, { status: 403 });
      }
    } else {
      // Leaving self
      if (actorMembership.role === "leader") {
        return NextResponse.json({ 
          error: "Leader cannot leave. Transfer leadership or delete the team." 
        }, { status: 400 });
      }
    }

    // Get team's conversation_id to remove from chat
    const { data: team } = await supabaseAdmin
      .from("teams")
      .select("conversation_id")
      .eq("id", teamIdNum)
      .single();

    // Remove from team
    const { error: deleteError } = await supabaseAdmin
      .from("team_members")
      .delete()
      .eq("team_id", teamIdNum)
      .eq("user_id", removeUserId);

    if (deleteError) {
      console.error("Member remove error:", deleteError);
      return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
    }

    // Also remove from conversation
    if (team?.conversation_id) {
      await supabaseAdmin
        .from("conversation_participants")
        .delete()
        .eq("conversation_id", team.conversation_id)
        .eq("user_id", removeUserId);
    }

    return NextResponse.json({ 
      success: true, 
      message: isLeavingSelf ? "Left team successfully" : "Member removed" 
    });

  } catch (error) {
    console.error("Member delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
