export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { TeamSchema } from "@/lib/validators/team";

// Demo data fallback
function getDemoTeams(search: string, limit: number) {
  const teamNames = ["AI Innovators", "Web3 Wizards", "Cloud Crusaders", "Data Dragons", "Mobile Mavericks", "DevOps Dynamos", "Quantum Qrew", "Cyber Sentinels", "Code Commandos", "Blockchain Brigade", "ML Masters", "Full Stack Fury", "Backend Beasts", "Frontend Force", "UX Unicorns"];
  const teamGoals = ["AI/ML Hackathon", "Web3 DeFi Project", "Cloud Architecture", "Data Science", "Mobile App Dev", "DevOps Automation", "Quantum Computing", "Cybersecurity", "Open Source", "Blockchain DApps"];
  const rolesList = ["Frontend Dev", "Backend Dev", "ML Engineer", "DevOps", "Designer", "Data Scientist", "Mobile Dev", "QA Engineer"];
  const joinModes = ['open', 'request', 'closed'];

  const demoTeams = Array.from({ length: 50 }, (_, i) => ({
    id: 100001 + i,
    name: teamNames[i % teamNames.length],
    goal: teamGoals[i % teamGoals.length],
    join_mode: joinModes[i % 3],
    is_private: joinModes[i % 3] === 'closed',
    max_members: 4 + (i % 4),
    member_count: 1 + (i % 3),
    roles_needed: [rolesList[i % rolesList.length], rolesList[(i + 3) % rolesList.length]],
  }));

  // Filter by search
  let filtered = demoTeams;
  if (search) {
    const q = search.toLowerCase();
    filtered = demoTeams.filter(t => 
      t.id.toString().includes(q) || t.name.toLowerCase().includes(q)
    );
  }

  return filtered.slice(0, limit);
}

export async function GET(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "Supabase env variables are missing" }, { status: 500 });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const limit = parseInt(searchParams.get("limit") || "20");

    // Get user from auth header for personalized results
    const authHeader = request.headers.get("Authorization");
    let userId: string | null = null;
    
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const { data: { user } } = await supabaseAdmin.auth.getUser(token);
      userId = user?.id || null;
    }

    const memberOnly = searchParams.get("member_only") === "true";

    // Base query for active teams
    let selectQuery = `
      id,
      name,
      goal,
      description,
      join_mode,
      max_members,
      created_at,
      created_by,
      team_roles_needed (role_name),
      team_members (
        id,
        user_id,
        role,
        profiles:user_id (
          id,
          username,
          name,
          profile_picture_url
        )
      )
    `;

    // If member_only filtering is requested and we have a user
    if (memberOnly && userId) {
      // Use inner join to only return teams where user is a member
      selectQuery = `
        id,
        name,
        goal,
        description,
        join_mode,
        max_members,
        created_at,
        created_by,
        team_roles_needed (role_name),
        team_members!inner (
          id,
          user_id,
          role,
          profiles:user_id (
            id,
            username,
            name,
            profile_picture_url
          )
        )
      `;
    }

    let query = supabaseAdmin
      .from("teams")
      .select(selectQuery)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(limit);

    // Apply member filter if requested
    if (memberOnly && userId) {
      query = query.eq("team_members.user_id", userId);
    } else {
      // Normal browsing filters
      // Search by name or team ID
      if (search) {
        // Check if search might be an ID
        const searchNum = parseInt(search);
        
        // If it's a valid number and actually looks like a number (not "123 abc")
        const isNumeric = !isNaN(searchNum) && String(searchNum) === search;

        if (isNumeric) {
          // Search by exact team ID OR name contains search string
          // distinct id types can be tricky in OR, but Supabase handles basic comparisons
          query = query.or(`id.eq.${searchNum},name.ilike.%${search}%`);
        } else {
          // Search by name only (case insensitive)
          query = query.ilike("name", `%${search}%`);
        }
      } else {
        // Only show open/request teams in browse mode (hide closed)
        query = query.in("join_mode", ["open", "request"]);
      }
    }

    const { data: teams, error } = await query;

    if (error) {
      console.error("Teams fetch error:", error);
      // If table doesn't exist, return demo data
      if (error.code === "42P01" || error.message?.includes("does not exist")) {
        return NextResponse.json({ 
          teams: getDemoTeams(search, limit),
          demo: true 
        });
      }
      return NextResponse.json({ error: "Failed to fetch teams" }, { status: 500 });
    }

    // Fetch pending requests for this user if authenticated
    let pendingRequestTeamIds = new Set<number>();
    if (userId) {
      const { data: requests } = await supabaseAdmin
        .from("team_join_requests")
        .select("team_id")
        .eq("user_id", userId)
        .eq("status", "pending");
      
      if (requests) {
        requests.forEach((r: any) => pendingRequestTeamIds.add(r.team_id));
      }
    }

    // Transform data to include member count, leader, and member avatars
    const teamsWithCounts = (teams || []).map((team: any) => {
      const members = team.team_members || [];
      
      // Find leader
      const leaderMember = members.find((m: any) => m.role === 'leader');
      const leader = leaderMember?.profiles ? {
        id: leaderMember.profiles.id,
        name: leaderMember.profiles.name,
        username: leaderMember.profiles.username,
        avatar_url: leaderMember.profiles.profile_picture_url,
      } : null;
      
      // Get member avatars (up to 5)
      const memberAvatars = members.slice(0, 5).map((m: any) => ({
        id: m.profiles?.id || m.user_id,
        name: m.profiles?.name,
        username: m.profiles?.username,
        avatar_url: m.profiles?.profile_picture_url,
      }));

      return {
        id: team.id,
        name: team.name,
        goal: team.goal,
        description: team.description,
        join_mode: team.join_mode,
        is_private: team.join_mode === 'closed',
        max_members: team.max_members,
        member_count: members.length,
        roles_needed: (team.team_roles_needed || []).map((r: any) => r.role_name),
        created_at: team.created_at,
        has_pending_request: pendingRequestTeamIds.has(team.id),
        leader,
        members: memberAvatars,
      };
    });

    // If no real teams, return demo data (unless member_only, then just return empty)
    if (teamsWithCounts.length === 0) {
      if (memberOnly) {
        return NextResponse.json({ teams: [] });
      }
      return NextResponse.json({ 
        teams: getDemoTeams(search, limit),
        demo: true 
      });
    }

    return NextResponse.json({ teams: teamsWithCounts });
  } catch (error) {
    console.error("Teams API error:", error);
    // Return demo data on any error
    return NextResponse.json({ 
      teams: getDemoTeams("", 20),
      demo: true 
    });
  }
}

export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "Supabase env variables are missing" }, { status: 500 });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

  try {
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
    
    // ZOD VALIDATION
    const result = TeamSchema.safeParse(body);
    if (!result.success) {
       return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 });
    }
    
    const { name, description, goal, max_members, join_mode, roles_needed } = result.data;

    // ... continue with logic using sanitized data ...

    // === ATOMIC TRANSACTION ===
    // 1. Create group conversation
    // 2. Create team with conversation_id
    // 3. Add creator as leader
    // 4. Add roles needed
    // 5. Add creator to conversation

    // Step 1: Create group conversation
    // @ts-ignore
    const { data: conversation, error: convError } = await supabaseAdmin
      .from("conversations")
      .insert({
        type: "group",
        title: name.trim(),
      })
      .select("id")
      .single();

    if (convError || !conversation) {
      console.error("Conversation creation failed:", convError);
      return NextResponse.json({ error: `Failed to create team chat: ${convError?.message || 'Unknown error'}` }, { status: 500 });
    }

    // Step 2: Create team with conversation_id
    const { data: team, error: teamError } = await supabaseAdmin
      .from("teams")
      .insert({
        name: name.trim(),
        description: description || null,
        goal: goal || null,
        max_members: max_members || 10,
        join_mode: join_mode || 'request', // Default to request
        status: 'active', // Explicitly set status so team is visible
        conversation_id: conversation.id,
        created_by: user.id,
      })
      .select("id")
      .single();

    if (teamError || !team) {
      // Rollback: delete conversation
      // @ts-ignore
      await supabaseAdmin.from("conversations").delete().eq("id", conversation.id);
      console.error("Team creation failed:", teamError);
      return NextResponse.json({ error: `Failed to create team: ${teamError?.message || 'Unknown error'}` }, { status: 500 });
    }

    // Step 3: Add creator as leader
    const { error: memberError } = await supabaseAdmin
      .from("team_members")
      .insert({
        team_id: team.id,
        user_id: user.id,
        role: "leader",
      });

    if (memberError) {
      // Rollback: delete team and conversation
      await supabaseAdmin.from("teams").delete().eq("id", team.id);
      // @ts-ignore
      await supabaseAdmin.from("conversations").delete().eq("id", conversation.id);
      console.error("Member creation failed:", memberError);
      return NextResponse.json({ error: "Failed to add team leader" }, { status: 500 });
    }

    // Step 4: Add roles needed (if provided)
    if (roles_needed && Array.isArray(roles_needed) && roles_needed.length > 0) {
      const rolesInsert = roles_needed
        .filter((r: string) => r.trim())
        .map((role_name: string) => ({
          team_id: team.id,
          role_name: role_name.trim(),
        }));

      if (rolesInsert.length > 0) {
        const { error: rolesError } = await supabaseAdmin
          .from("team_roles_needed")
          .insert(rolesInsert);

        if (rolesError) {
          console.error("Roles insert warning:", rolesError);
          // Non-critical, don't rollback
        }
      }
    }

    // Step 5: Add creator to conversation as admin
    // @ts-ignore
    const { error: participantError } = await supabaseAdmin
      .from("conversation_participants")
      .insert({
        conversation_id: conversation.id,
        user_id: user.id,
        role: "admin",
      });

    if (participantError) {
      console.error("Participant add warning:", participantError);
      // Non-critical, don't rollback
    }

    return NextResponse.json({ 
      success: true, 
      team_id: team.id,
      conversation_id: conversation.id,
      message: "Team created successfully" 
    }, { status: 201 });

  } catch (error) {
    console.error("Team creation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
