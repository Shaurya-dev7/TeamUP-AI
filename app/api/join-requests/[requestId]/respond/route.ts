export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "Supabase env variables are missing" }, { status: 500 });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

  try {
    const { requestId } = await params;
    
    // Authenticate user
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

    if (!["accept", "decline"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // 1. Fetch Request
    const { data: joinRequest, error: fetchError } = await supabaseAdmin
      .from("team_join_requests")
      .select("*, team:teams!team_id(*)")
      .eq("id", requestId)
      .single();

    if (fetchError || !joinRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (joinRequest.status !== "pending") {
      return NextResponse.json({ error: "Request already processed" }, { status: 400 });
    }

    const team = joinRequest.team;
    
    // 2. Check Permissions (Must be Leader/Co-Leader)
    const { data: requesterMember, error: permError } = await supabaseAdmin
      .from("team_members")
      .select("role")
      .eq("team_id", team.id)
      .eq("user_id", user.id)
      .single();

    if (permError || !requesterMember || !["leader", "co_leader"].includes(requesterMember.role)) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    // 3. Handle Action
    if (action === "decline") {
      const { error: updateError } = await supabaseAdmin
        .from("team_join_requests")
        .update({ 
            status: "rejected", 
            responded_at: new Date().toISOString(),
            responded_by: user.id
        })
        .eq("id", requestId);
        
      if (updateError) throw updateError;
      
      return NextResponse.json({ success: true, message: "Request declined" });
    }

    // Accept Logic
    if (action === "accept") {
        // Check member limit
        const { count } = await supabaseAdmin
            .from("team_members")
            .select("*", { count: 'exact', head: true })
            .eq("team_id", team.id);
            
        if ((count || 0) >= team.max_members) {
            return NextResponse.json({ error: "Team is full" }, { status: 400 });
        }

        // Transaction: Update Request -> Add Member -> Add to Chat
        
        // A. Update Request
        const { error: updateError } = await supabaseAdmin
        .from("team_join_requests")
        .update({ 
            status: "accepted", 
            responded_at: new Date().toISOString(),
            responded_by: user.id
        })
        .eq("id", requestId);
        
        if (updateError) throw updateError;
        
        // B. Add Member
        const { error: insertError } = await supabaseAdmin
            .from("team_members")
            .insert({
                team_id: team.id,
                user_id: joinRequest.user_id,
                role: "member"
            });
            
        if (insertError) {
             // Rollback request update (primitive)
             await supabaseAdmin.from("team_join_requests").update({ status: 'pending' }).eq('id', requestId);
             throw insertError;
        }
        
        // C. Add to Chat (if chat exists)
        if (team.conversation_id) {
             // Check if already in chat (idempotency)
             const { count: chatCount } = await supabaseAdmin
                .from("conversation_participants")
                .select("*", { count: 'exact', head: true })
                .eq("conversation_id", team.conversation_id)
                .eq("user_id", joinRequest.requester_id || joinRequest.user_id);

             if (chatCount === 0) {
                 await supabaseAdmin.from("conversation_participants").insert({
                     conversation_id: team.conversation_id,
                     user_id: joinRequest.requester_id || joinRequest.user_id,
                     role: "member"
                 });
             }
        }
        
        // D. Create notifications
        // Get new member's profile
        const requesterId = joinRequest.requester_id || joinRequest.user_id;
        const { data: newMemberProfile } = await supabaseAdmin
            .from("profiles")
            .select("username, name")
            .eq("id", requesterId)
            .single();

        // Notify the requester that they've been accepted
        await supabaseAdmin.from("notifications").insert({
            user_id: requesterId,
            type: "request_accepted",
            entity_type: "team",
            entity_id: team.id.toString(),
            title: "Request Accepted!",
            message: `You've been accepted to join "${team.name}"`,
            is_read: false,
        });

        // Notify all other team members about new member
        const { data: teamMembers } = await supabaseAdmin
            .from("team_members")
            .select("user_id")
            .eq("team_id", team.id)
            .neq("user_id", requesterId);

        if (teamMembers && teamMembers.length > 0) {
            const notifications = teamMembers.map((member: any) => ({
                user_id: member.user_id,
                type: "member_joined",
                entity_type: "team",
                entity_id: team.id.toString(),
                title: "New Team Member",
                message: `@${newMemberProfile?.username || "Someone"} joined "${team.name}"`,
                is_read: false,
            }));
            await supabaseAdmin.from("notifications").insert(notifications);
        }
        
        return NextResponse.json({ success: true, message: "Member added successfully" });
    }

  } catch (error: any) {
    console.error("Join request response error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
