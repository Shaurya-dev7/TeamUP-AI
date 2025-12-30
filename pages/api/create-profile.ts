import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Service Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 1. Verify User (using Authorization header)
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }
  
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  const userId = user.id;
  const { 
    username, 
    name, // Full Name
    age, 
    gender, 
    college, 
    hostel_city, 
    location, 
    skills, // comma-separated string
    hackathons_participated, 
    projects_completed, 
    achievements 
  } = req.body;

  try {
    // 2. Upsert Profile with all new fields
    const { error: profileErr } = await supabase.from('profiles').upsert({
      id: userId,
      username,
      name,
      age: age ? parseInt(age) : null,
      gender,
      college,
      hostel_city,
      location,
      skills,
      hackathons_participated: hackathons_participated ? parseInt(hackathons_participated) : 0,
      projects_completed: projects_completed ? parseInt(projects_completed) : 0,
      achievements,
    });

    if (profileErr) {
      console.error('Profile Upsert Error:', profileErr);
      // Fallback: If 'is_demo' or other columns don't exist and error, we might need a retry without them.
      // But we assume the migration ran.
      return res.status(500).json({ error: `Failed to save profile: ${profileErr.message}` });
    }

    return res.status(200).json({ success: true });

  } catch (error: any) {
    console.error('Create Profile API Error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
