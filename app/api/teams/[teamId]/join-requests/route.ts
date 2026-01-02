import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type RouteParams = { params: Promise<{ teamId: string }> };

// GET: List pending join requests (leader/co_leader only)
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

    // Fetch pending requests
    const { data: requests, error } = await supabaseAdmin
      .from("team_join_requests")
      .select(`
        id,
        user_id,
        message,
        status,
        created_at,
        requester:user_id (id, username, name, skills)
      `)
      .eq("team_id", teamIdNum)
      .eq("status", "pending")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Requests fetch error:", error);
      return NextResponse.json({ error: "Failed to fetch requests" }, { status: 500 });
    }

    const requestsData = (requests || []).map((req: any) => ({
      id: req.id,
      message: req.message,
      created_at: req.created_at,
      user: {
        id: req.requester?.id,
        username: req.requester?.username,
        name: req.requester?.name,
        skills: req.requester?.skills,
      },
    }));

    return NextResponse.json({ requests: requestsData });

  } catch (error) {
    console.error("Requests API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST: Submit join request (for open teams only)
export async function POST(request: NextRequest, { params }: RouteParams) {
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
    const { message } = body;

    // Check if team exists, is active, and limit checks
    const { data: team } = await supabaseAdmin
      .from("teams")
      .select("id, join_mode, status, max_members, conversation_id")
      .eq("id", teamIdNum)
      .eq("status", "active")
      .single();

    if (!team) {
      return NextResponse.json({ error: "Team not found or inactive" }, { status: 404 });
    }

    if (team.join_mode === 'closed') {
      return NextResponse.json({ 
        error: "This team is closed. Contact the leader to get an invite." 
      }, { status: 400 });
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
      .eq("user_id", user.id)
      .single();

    if (existingMember) {
      return NextResponse.json({ error: "You are already a team member" }, { status: 400 });
    }

    // Check for existing pending request
    const { data: existingRequest } = await supabaseAdmin
      .from("team_join_requests")
      .select("id")
      .eq("team_id", teamIdNum)
      .eq("user_id", user.id)
      .eq("status", "pending")
      .single();

    if (existingRequest) {
      return NextResponse.json({ error: "You already have a pending request" }, { status: 400 });
    }

    // --- NEW LOGIC: Handle Open vs Request ---
    if (team.join_mode === 'open') {
      // Direct Join
      const { error: memberError } = await supabaseAdmin
        .from("team_members")
        .insert({
          team_id: teamIdNum,
          user_id: user.id,
          role: "member",
        });

      if (memberError) {
        console.error("Member add error:", memberError);
        return NextResponse.json({ error: "Failed to join team" }, { status: 500 });
      }

      // Add to conversation (chat)
      if (team.conversation_id) {
         const { error: chatError } = await supabaseAdmin
          .from("conversation_participants")
          .insert({
            conversation_id: team.conversation_id,
            user_id: user.id,
            role: "member",
          });
          
         if (chatError) console.error("Failed to add to chat", chatError);
      }

      // Get team name and new member profile for notification
      const { data: teamInfo } = await supabaseAdmin
        .from("teams")
        .select("name")
        .eq("id", teamIdNum)
        .single();

      const { data: newMemberProfile } = await supabaseAdmin
        .from("profiles")
        .select("username, name")
        .eq("id", user.id)
        .single();

      // Notify all other team members about new member
      const { data: teamMembers } = await supabaseAdmin
        .from("team_members")
        .select("user_id")
        .eq("team_id", teamIdNum)
        .neq("user_id", user.id);

      if (teamMembers && teamMembers.length > 0) {
        const notifications = teamMembers.map((member: any) => ({
          user_id: member.user_id,
          type: "member_joined",
          entity_type: "team",
          entity_id: teamIdNum.toString(),
          title: "New Team Member",
          message: `@${newMemberProfile?.username || "Someone"} joined "${teamInfo?.name || "your team"}"`,
          is_read: false,
        }));
        await supabaseAdmin.from("notifications").insert(notifications);
      }

      return NextResponse.json({ 
        success: true, 
        joined: true,
        message: "You have joined the team!" 
      }, { status: 200 });
    
    } else {
      // Request Mode (Original Logic)
      const { data: joinRequest, error: requestError } = await supabaseAdmin
        .from("team_join_requests")
        .insert({
          team_id: teamIdNum,
          user_id: user.id,
          message: message || null,
        })
        .select("id")
        .single();

      if (requestError) {
        console.error("Request creation error:", requestError);
        return NextResponse.json({ error: "Failed to submit request" }, { status: 500 });
      }

      // Get team name and requester profile for notification
      const { data: teamInfo } = await supabaseAdmin
        .from("teams")
        .select("name")
        .eq("id", teamIdNum)
        .single();

      const { data: requesterProfile } = await supabaseAdmin
        .from("profiles")
        .select("username, name")
        .eq("id", user.id)
        .single();

      // Notify all leaders and co-leaders about the join request
      const { data: leaders } = await supabaseAdmin
        .from("team_members")
        .select("user_id")
        .eq("team_id", teamIdNum)
        .in("role", ["leader", "co_leader"]);

      if (leaders && leaders.length > 0) {
        const notifications = leaders.map((leader: any) => ({
          user_id: leader.user_id,
          type: "join_request",
          entity_type: "team_join_request",
          entity_id: joinRequest.id,
          title: "Join Request",
          message: `@${requesterProfile?.username || "Someone"} requested to join "${teamInfo?.name || "your team"}"`,
          actions: JSON.stringify([
            { label: "Accept", action: "ACCEPT_REQUEST", request_id: joinRequest.id },
            { label: "Reject", action: "REJECT_REQUEST", request_id: joinRequest.id }
          ]),
          is_read: false,
        }));
        await supabaseAdmin.from("notifications").insert(notifications);
      }

      return NextResponse.json({ 
        success: true, 
        joined: false,
        request_id: joinRequest.id,
        message: "Join request submitted successfully" 
      }, { status: 201 });
    }

  } catch (error) {
    console.error("Request creation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH: Accept or reject join request (leader/co_leader only)
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
    const { request_id, action } = body;

    if (!request_id || !action) {
      return NextResponse.json({ error: "request_id and action required" }, { status: 400 });
    }

    if (!["accept", "reject"].includes(action)) {
      return NextResponse.json({ error: "action must be 'accept' or 'reject'" }, { status: 400 });
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

    // Get the join request
    const { data: joinRequest } = await supabaseAdmin
      .from("team_join_requests")
      .select("id, user_id, status")
      .eq("id", request_id)
      .eq("team_id", teamIdNum)
      .single();

    if (!joinRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (joinRequest.status !== "pending") {
      return NextResponse.json({ error: "Request already processed" }, { status: 400 });
    }

    if (action === "accept") {
      // Check if team is full
      const { data: team } = await supabaseAdmin
        .from("teams")
        .select("max_members, conversation_id")
        .eq("id", teamIdNum)
        .single();

      const { count: memberCount } = await supabaseAdmin
        .from("team_members")
        .select("id", { count: "exact", head: true })
        .eq("team_id", teamIdNum);

      if (team && memberCount && memberCount >= team.max_members) {
        return NextResponse.json({ error: "Team is full" }, { status: 400 });
      }

      // Add user to team
      const { error: memberError } = await supabaseAdmin
        .from("team_members")
        .insert({
          team_id: teamIdNum,
          user_id: joinRequest.user_id,
          role: "member",
        });

      if (memberError) {
        console.error("Member add error:", memberError);
        return NextResponse.json({ error: "Failed to add member" }, { status: 500 });
      }

      // Add to conversation
      if (team?.conversation_id) {
        await supabaseAdmin
          .from("conversation_participants")
          .insert({
            conversation_id: team.conversation_id,
            user_id: joinRequest.user_id,
            role: "member",
          });
      }
    }

    // Update request status
    const newStatus = action === "accept" ? "accepted" : "rejected";
    const { error: updateError } = await supabaseAdmin
      .from("team_join_requests")
      .update({ 
        status: newStatus,
        responded_at: new Date().toISOString(),
        responded_by: user.id,
      })
      .eq("id", request_id);

    if (updateError) {
      console.error("Request update error:", updateError);
      return NextResponse.json({ error: "Failed to update request" }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: action === "accept" ? "Request accepted" : "Request rejected"
    });

  } catch (error) {
    console.error("Request update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
