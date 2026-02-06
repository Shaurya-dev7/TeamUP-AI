/**
 * =============================================================================
 * TEAM API ROUTES - /api/teams/[teamId]
 * =============================================================================
 * 
 * SECURITY: IDOR (Insecure Direct Object Reference) Prevention
 * 
 * This file implements strict authorization controls to prevent IDOR attacks:
 * 
 * 1. USER IDENTITY: userId is ALWAYS derived from the JWT token via getUser(),
 *    NEVER from request body, query params, or headers. This prevents ID spoofing.
 * 
 * 2. AUTHORIZATION MODEL:
 *    - GET:    Public info for all; private details (members list) for members only
 *    - PATCH:  Requires 'leader' or 'co_leader' role in team_members
 *    - DELETE: Requires 'leader' role ONLY
 * 
 * 3. OWNERSHIP VERIFICATION: Before any mutation, we verify the authenticated
 *    user's role by querying team_members with their server-derived userId.
 * 
 * 4. RESPONSE CODES:
 *    - 401: Missing/invalid authentication token
 *    - 403: Authenticated but lacks required role (IDOR attempt)
 *    - 404: Resource not found (also used for closed teams to non-members)
 * 
 * RLS Note: Supabase RLS policies provide defense-in-depth, but this API uses
 * service role key (bypasses RLS) so ALL authorization is enforced at API layer.
 * =============================================================================
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { TeamSchema } from "@/lib/validators/team";

type RouteParams = { params: Promise<{ teamId: string }> };

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase env variables are missing");
  }
  return createClient(supabaseUrl, supabaseKey);
}

// Demo team generator for teams 100001-100050
function generateDemoTeam(teamId: number) {
  const i = teamId - 100001;
  const teamNames = ["AI Innovators", "Web3 Wizards", "Cloud Crusaders", "Data Dragons", "Mobile Mavericks", "DevOps Dynamos", "Quantum Qrew", "Cyber Sentinels", "Code Commandos", "Blockchain Brigade", "ML Masters", "Full Stack Fury", "Backend Beasts", "Frontend Force", "UX Unicorns"];
  const teamGoals = ["AI/ML Hackathon", "Web3 DeFi Project", "Cloud Architecture", "Data Science", "Mobile App Dev", "DevOps Automation", "Quantum Computing", "Cybersecurity", "Open Source", "Blockchain DApps"];
  const rolesList = ["Frontend Dev", "Backend Dev", "ML Engineer", "DevOps", "Designer", "Data Scientist", "Mobile Dev", "QA Engineer"];
  const joinModes = ['open', 'request', 'closed'] as const;

  return {
    id: teamId,
    name: teamNames[i % teamNames.length],
    description: `This is a demo team focused on ${teamGoals[i % teamGoals.length]}. Looking for passionate developers to join our hackathon squad!`,
    goal: teamGoals[i % teamGoals.length],
    join_mode: joinModes[i % 3],
    max_members: 4 + (i % 4),
    member_count: 1 + (i % 3),
    conversation_id: null,
    created_at: new Date().toISOString(),
    roles_needed: [
      { id: `role-${i}-1`, name: rolesList[i % rolesList.length] },
      { id: `role-${i}-2`, name: rolesList[(i + 3) % rolesList.length] },
    ],
    leader: {
      id: `demo-leader-${i}`,
      username: `leader${i + 1}`,
      name: `Team Leader ${i + 1}`,
    },
  };
}

/**
 * GET /api/teams/[teamId]
 * 
 * SECURITY NOTES:
 * - Authentication is optional (public discovery allowed)
 * - userId derived from JWT token only, never from request
 * - Closed teams return limited info to non-members
 * - Member list ONLY returned to authenticated team members (IDOR prevention)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const supabaseAdmin = getSupabaseAdmin();
  try {
    const { teamId } = await params;
    const teamIdNum = parseInt(teamId);
    
    if (isNaN(teamIdNum)) {
      return NextResponse.json({ error: "Invalid team ID" }, { status: 400 });
    }

    // Get user if authenticated
    const authHeader = request.headers.get("Authorization");
    let userId: string | null = null;
    
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const { data: { user } } = await supabaseAdmin.auth.getUser(token);
      userId = user?.id || null;
    }

    // Fetch team with related data
    const { data: team, error } = await supabaseAdmin
      .from("teams")
      .select(`
        *,
        team_roles_needed (id, role_name),
        team_members (
          id,
          user_id,
          role,
          joined_at,
          profiles:user_id (id, username, name)
        ),
        creator:created_by (id, username, name)
      `)
      .eq("id", teamIdNum)
      .eq("status", "active")
      .single();

    // If not found in DB, check if it's a demo team (100001-100050)
    if (error || !team) {
      if (teamIdNum >= 100001 && teamIdNum <= 100050) {
        const demoTeam = generateDemoTeam(teamIdNum);
        return NextResponse.json({
          team: demoTeam,
          is_member: false,
          user_role: null,
          demo: true,
        });
      }
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Check if user is a member
    const isMember = userId && team.team_members?.some((m: any) => m.user_id === userId);
    const userRole = isMember 
      ? team.team_members.find((m: any) => m.user_id === userId)?.role 
      : null;

    // Check if user has pending request
    let hasPendingRequest = false;
    if (userId && !isMember) {
      const { data: req } = await supabaseAdmin
        .from("team_join_requests")
        .select("id")
        .eq("team_id", teamIdNum)
        .eq("user_id", userId)
        .eq("status", "pending")
        .single();
      
      if (req) hasPendingRequest = true;
    }

    // For closed teams, non-members only see limited info
    if (team.join_mode === 'closed' && !isMember) {
      return NextResponse.json({
        team: {
          id: team.id,
          name: team.name,
          goal: team.goal,
          join_mode: team.join_mode,
          max_members: team.max_members,
          member_count: team.team_members?.length || 0,
          roles_needed: (team.team_roles_needed || []).map((r: any) => r.role_name),
          leader: team.creator ? {
            id: team.creator.id,
            username: team.creator.username,
            name: team.creator.name,
          } : null,
        },
        is_member: false,
        user_role: null,
        has_pending_request: hasPendingRequest,
      });
    }

    // Full details for members or open/request teams
    return NextResponse.json({
      team: {
        id: team.id,
        name: team.name,
        description: team.description,
        goal: team.goal,
        join_mode: team.join_mode,
        max_members: team.max_members,
        conversation_id: team.conversation_id,
        created_at: team.created_at,
        member_count: team.team_members?.length || 0,
        roles_needed: (team.team_roles_needed || []).map((r: any) => ({
          id: r.id,
          name: r.role_name,
        })),
        members: isMember ? team.team_members.map((m: any) => ({
          id: m.id,
          user_id: m.user_id,
          role: m.role,
          joined_at: m.joined_at,
          username: m.profiles?.username,
          name: m.profiles?.name,
        })) : undefined,
        leader: team.creator ? {
          id: team.creator.id,
          username: team.creator.username,
          name: team.creator.name,
        } : null,
        has_pending_request: hasPendingRequest,
      },
      is_member: isMember,
      user_role: userRole,
    });

  } catch (error) {
    console.error("Team fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/teams/[teamId]
 * 
 * SECURITY NOTES (IDOR Prevention):
 * - REQUIRES authentication (401 if missing)
 * - userId derived from JWT token ONLY (never from request body)
 * - REQUIRES 'leader' or 'co_leader' role in team_members table
 * - Role check uses server-derived userId against team_id from URL
 * - Returns 403 if user is not authorized (prevents IDOR)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

    // Validate and sanitize input
    const body = await request.json();
    const validation = TeamSchema.partial().safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ 
        error: "Invalid input", 
        details: validation.error.flatten() 
      }, { status: 400 });
    }

    const { name, description, goal, max_members, join_mode, roles_needed } = validation.data;

    // Update team
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (goal !== undefined) updateData.goal = goal;
    if (max_members !== undefined) updateData.max_members = max_members;
    if (join_mode !== undefined) updateData.join_mode = join_mode;

    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabaseAdmin
        .from("teams")
        .update(updateData)
        .eq("id", teamIdNum);

      if (updateError) {
        console.error("Team update error:", updateError);
        return NextResponse.json({ error: "Failed to update team" }, { status: 500 });
      }

      // Also update conversation title if name changed
      if (name) {
        const { data: team } = await supabaseAdmin
          .from("teams")
          .select("conversation_id")
          .eq("id", teamIdNum)
          .single();

        if (team?.conversation_id) {
          await supabaseAdmin
            .from("conversations")
            .update({ title: name.trim() })
            .eq("id", team.conversation_id);
        }
      }
    }

    // Update roles if provided
    if (roles_needed !== undefined && Array.isArray(roles_needed)) {
      // Delete existing roles
      await supabaseAdmin
        .from("team_roles_needed")
        .delete()
        .eq("team_id", teamIdNum);

      // Insert new roles
      if (roles_needed.length > 0) {
        const rolesInsert = roles_needed
          .filter((r: string) => r.trim())
          .map((role_name: string) => ({
            team_id: teamIdNum,
            role_name: role_name.trim(),
          }));

        if (rolesInsert.length > 0) {
          await supabaseAdmin
            .from("team_roles_needed")
            .insert(rolesInsert);
        }
      }
    }

    return NextResponse.json({ success: true, message: "Team updated" });

  } catch (error) {
    console.error("Team update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/teams/[teamId]
 * 
 * SECURITY NOTES (IDOR Prevention):
 * - REQUIRES authentication (401 if missing)
 * - userId derived from JWT token ONLY (never from request body)
 * - REQUIRES 'leader' role ONLY (co_leaders cannot delete)
 * - Role check uses server-derived userId against team_id from URL
 * - Returns 403 if user is not the leader (prevents IDOR)
 * - Soft delete: sets status='deleted' instead of hard delete
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    // Check if user is leader
    const { data: membership } = await supabaseAdmin
      .from("team_members")
      .select("role")
      .eq("team_id", teamIdNum)
      .eq("user_id", user.id)
      .single();

    if (!membership || membership.role !== "leader") {
      return NextResponse.json({ error: "Only the team leader can delete the team" }, { status: 403 });
    }

    // Soft delete: set status to 'deleted'
    const { error: deleteError } = await supabaseAdmin
      .from("teams")
      .update({ status: "deleted" })
      .eq("id", teamIdNum);

    if (deleteError) {
      console.error("Team delete error:", deleteError);
      return NextResponse.json({ error: "Failed to delete team" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Team deleted" });

  } catch (error) {
    console.error("Team delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
