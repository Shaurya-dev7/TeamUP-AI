import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { logApiError } from '@/lib/utils/error-utils';
import { ProfileSchema } from '@/lib/validators/profile';

// Initialize Supabase Service Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 1. Verify User (using Authorization header)
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

  // 2. Validate & Sanitize Input
  const validation = ProfileSchema.safeParse(req.body);
  
  if (!validation.success) {
     return res.status(400).json({ 
       error: 'Invalid input', 
       details: validation.error.flatten() 
     });
  }

  // Validated data - safe to use
  const data = validation.data;

  try {
    // 3. Upsert Profile
    // We explicitly map fields to ensure only allowlisted data enters the DB
    const profilePayload = {
      id: userId, // SECURITY: Always use ID from token
      username: data.username,
      name: data.name,
      age: data.age,
      gender: data.gender,
      
      // Location / Contact
      location: data.location,
      hostel_city: data.hostel_city,
      
      // Professional / Education
      college: data.college,
      college_id: data.college_id,
      college_name_raw: data.college_name_raw,
      school: data.school,
      workplace: data.workplace,
      
      // Skills & Achievements
      skills: data.skills,
      achievements: data.achievements,
      interests: data.interests,
      
      // Stats
      hackathons_participated: data.hackathons_participated,
      projects_completed: data.projects_completed,
      
      // URLs
      github_url: data.github_url,
      linkedin_url: data.linkedin_url,
      profile_picture_url: data.profile_picture_url,
      
      // JSON / Complex
      certificates: data.certificates,
      synced_contacts: data.synced_contacts,
      
      // Status
      team_invite_status: data.team_invite_status,
    };

    const { error: profileErr } = await supabase.from('profiles').upsert(profilePayload);

    if (profileErr) {
      console.error('Profile Upsert Error:', profileErr);

      // Graceful Fallback: If migration hasn't run, retry without database-only columns
      if (profileErr.message.includes("Could not find the 'college_id' column")) {
        console.warn("Schema mismatch detected (missing college_id). Retrying without college fields.");
        
        const fallbackPayload = { ...profilePayload };
        delete (fallbackPayload as any).college_id;
        delete (fallbackPayload as any).college_name_raw;
        
        const { error: retryErr } = await supabase.from('profiles').upsert(fallbackPayload);

        if (retryErr) {
             logApiError('Profile upsert retry failed', retryErr, { userId });
             return res.status(500).json({ error: 'Failed to save profile' });
        }
        // Success on retry
        return res.status(200).json({ success: true, warning: "Profile saved, but College ID could not be stored due to pending database updates." });
      }

      logApiError('Profile upsert', profileErr, { userId });
      return res.status(500).json({ error: 'Failed to save profile' });
    }

    return res.status(200).json({ success: true });

  } catch (error: any) {
    logApiError('Create Profile API', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
