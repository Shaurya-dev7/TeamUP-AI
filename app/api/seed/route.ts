export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const teamNames = [
  "AI Innovators", "Web3 Wizards", "Cloud Crusaders", "Data Dragons", "Mobile Mavericks", 
  "DevOps Dynamos", "Quantum Qrew", "Cyber Sentinels", "Code Commandos", "Blockchain Brigade", 
  "ML Masters", "Full Stack Fury", "Backend Beasts", "Frontend Force", "UX Unicorns", 
  "API Architects", "Script Squad", "Bug Busters", "Tech Titans", "Innovation Inc", 
  "Pixel Perfect", "Logic Lords", "Byte Battalion", "Neural Nomads", "Agile Avengers", 
  "Sprint Stars", "Deploy Demons", "Git Guardians", "Lambda Legion", "Server Samurai", 
  "Cloud Kings", "Data Dreamers", "Code Catalysts", "Binary Bosses", "Stack Surfers", 
  "Hash Heroes", "Query Queens", "Merge Masters", "Commit Crew", "Branch Bandits", 
  "Pull Pirates", "Push Pioneers", "Build Breakers", "Test Titans", "Debug Divas", 
  "Lint Lords", "Parse Patrol", "Compile Clan", "Runtime Rebels", "Exception Elite"
];

const teamGoals = [
  "Building an AI accessibility tool for the visually impaired",
  "Creating a decentralized crowdfunding platform",
  "Developing a serverless microservices architecture",
  "Analyzing climate data for better crop yields",
  "Building a cross-platform fitness tracking app",
  "Automating CI/CD pipelines for legacy systems",
  "Simulating quantum circuits for educational purposes",
  "Creating a secure password manager with zero-knowledge proofs",
  "Contributing to major open source libraries",
  "Building a DAO for community governance",
  "Training a model to detect deepfakes",
  "Building a full-stack e-commerce solution",
  "Optimizing database queries for high-load systems",
  "Designing a design system for rapid prototyping",
  "Connecting IoT devices for smart home automation"
];

const rolesList = [
  "Frontend Dev", "Backend Dev", "ML Engineer", "DevOps Engineer", 
  "UI/UX Designer", "Data Scientist", "Mobile Dev", "QA Engineer", 
  "Product Manager", "Blockchain Dev"
];

const joinModes = ['open', 'request', 'closed'] as const;

export async function GET(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "Supabase env variables are missing" }, { status: 500 });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

  try {
    // 1. Security Check (Basic prevention of accidental public use)
    const { searchParams } = new URL(request.url);
    const secret = process.env.SEED_SECRET;
    
    if (!secret) {
      // If secret is not configured in env, DISABLE the route entirely for safety
      return NextResponse.json({ error: "Seed route is disabled." }, { status: 403 });
    }

    if (searchParams.get("secret") !== secret) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    // 2. Get a valid user to be the owner (Use the first found profile)
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .limit(1);

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ error: "No profiles found. Sign up a user first." }, { status: 400 });
    }
    
    const ownerId = profiles[0].id;
    const createdTeams = [];
    const errors = [];

    // 3. Loop and create teams
    for (let i = 0; i < 50; i++) {
      const name = teamNames[i % teamNames.length];
      const goal = teamGoals[i % teamGoals.length];
      const joinMode = joinModes[i % 3]; // Rotate modes
      const roles = [rolesList[i % rolesList.length], rolesList[(i + 3) % rolesList.length]];

      try {
        // A. Create Conversation
        const { data: conversation, error: convError } = await supabaseAdmin
          .from("conversations")
          .insert({
            type: "group",
            title: name,
          })
          .select("id")
          .single();

        if (convError || !conversation) throw new Error(`Conv error: ${convError?.message}`);

        // B. Create Team
        const { data: team, error: teamError } = await supabaseAdmin
          .from("teams")
          .insert({
            name: `${name} ${i + 1}`, // Ensure uniqueness
            description: `We are a passionate team working on ${goal}. Join us!`,
            goal: goal,
            max_members: 4 + (i % 4),
            join_mode: joinMode,
            status: 'active',
            conversation_id: conversation.id,
            created_by: ownerId,
          })
          .select("id")
          .single();

        if (teamError || !team) throw new Error(`Team error: ${teamError?.message}`);

        // C. Add Owner as Leader
        await supabaseAdmin.from("team_members").insert({
          team_id: team.id,
          user_id: ownerId,
          role: "leader"
        });

        // D. Add Roles Needed
        const rolesInsert = roles.map(r => ({
          team_id: team.id,
          role_name: r
        }));
        await supabaseAdmin.from("team_roles_needed").insert(rolesInsert);

        // E. Add Owner to Conversation
        await supabaseAdmin.from("conversation_participants").insert({
          conversation_id: conversation.id,
          user_id: ownerId,
          role: "admin"
        });

        createdTeams.push(team.id);

      } catch (e: any) {
        console.error(`Failed to create team ${i}:`, e);
        errors.push(e.message);
      }
    }

    return NextResponse.json({ 
      success: true, 
      created_count: createdTeams.length, 
      errors_count: errors.length,
      sample_team_ids: createdTeams.slice(0, 5) 
    });

  } catch (error: any) {
    console.error("Seed error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
