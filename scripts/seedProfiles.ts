// Usage: set SUPABASE_SERVICE_ROLE_KEY in .env.local, then run with a TypeScript runner (e.g. `npx ts-node scripts/seedProfiles.ts`)
import { createClient } from "@supabase/supabase-js";
// @ts-ignore - uuid types may not be installed in the workspace
import { v4 as uuidv4 } from "uuid";

// For TypeScript/Node.js compatibility
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

// Prefer the service role key for seeding (required for inserts/upserts on protected tables)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase URL or Key missing in environment variables. Set SUPABASE_SERVICE_ROLE_KEY for seeding.");
}
const supabase = createClient(supabaseUrl, supabaseKey);


const profiles = [
  {
    username: "alice",
    display_name: "Alice Smith",
    bio: "Frontend developer and designer.",
    avatar_url: null,
    availability_status: "available",
    interests: "Web Dev, UI/UX, Open Source",
  },
  {
    username: "bob",
    display_name: "Bob Johnson",
    bio: "Backend specialist, Node.js & Python.",
    avatar_url: null,
    availability_status: "busy",
    interests: "Node.js, Python, APIs",
  },
  {
    username: "carol",
    display_name: "Carol Lee",
    bio: "Fullstack engineer, loves React.",
    avatar_url: null,
    availability_status: "available",
    interests: "React, Fullstack, Startups",
  },
  {
    username: "daniel",
    display_name: "Daniel Kim",
    bio: "AI/ML enthusiast, Kaggle competitor.",
    avatar_url: null,
    availability_status: "available",
    interests: "AI, ML, Data Science",
  },
  {
    username: "emma",
    display_name: "Emma Brown",
    bio: "Mobile app developer, Flutter & Swift.",
    avatar_url: null,
    availability_status: "busy",
    interests: "Mobile, Flutter, iOS",
  },
  {
    username: "frank",
    display_name: "Frank Green",
    bio: "DevOps and cloud expert.",
    avatar_url: null,
    availability_status: "available",
    interests: "DevOps, AWS, Docker",
  },
  {
    username: "grace",
    display_name: "Grace Miller",
    bio: "UI/UX designer, Figma lover.",
    avatar_url: null,
    availability_status: "available",
    interests: "Design, Figma, Prototyping",
  },
  {
    username: "henry",
    display_name: "Henry Wilson",
    bio: "Cybersecurity analyst.",
    avatar_url: null,
    availability_status: "busy",
    interests: "Cybersecurity, Networking",
  },
  {
    username: "irene",
    display_name: "Irene Davis",
    bio: "Data scientist, pandas & SQL.",
    avatar_url: null,
    availability_status: "available",
    interests: "Data Science, SQL, Pandas",
  },
  {
    username: "jack",
    display_name: "Jack White",
    bio: "Game developer, Unity & Unreal.",
    avatar_url: null,
    availability_status: "available",
    interests: "Game Dev, Unity, C#",
  },
];


async function seedProfiles() {
  for (const profile of profiles) {
    const id = uuidv4();
    const { error } = await supabase.from("profiles").upsert([
      {
        id,
        username: profile.username,
        display_name: profile.display_name,
        bio: profile.bio,
        avatar_url: profile.avatar_url,
        availability_status: profile.availability_status,
        interests: profile.interests || null,
      },
    ], { onConflict: 'username' });
    if (error) {
      console.error(`Error inserting profile ${profile.username}:`, error.message);
    }
  }
  console.log("Seeded 10 profiles.");
}

seedProfiles();
