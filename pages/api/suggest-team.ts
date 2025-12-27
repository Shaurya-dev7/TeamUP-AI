import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';



const role_skills = {
  'Frontend Developer': ['frontend', 'react', 'angular', 'html', 'css', 'javascript'],
  'Backend Developer': ['backend', 'node', 'django', 'spring', 'flask', 'api', 'java', 'python'],
  'UI/UX Designer': ['ui/ux', 'design', 'figma', 'adobe', 'prototype'],
  'Data Scientist/ML Engineer': ['ml', 'machine learning', 'data science', 'ai', 'python', 'statistics'],
  'DevOps/Cloud Engineer': ['devops', 'cloud', 'aws', 'azure', 'docker', 'kubernetes'],
  'Project Manager/Leader': ['management', 'leader', 'project', 'scrum', 'agile']
};

function findCandidatesForRole(profiles: any[], skills_col: string, role_keywords: string[], top_n = 10) {
  return profiles.filter(p => {
    const skills = (p[skills_col] || '').split(';');
    return skills.some((skill: string) => role_keywords.some(kw => skill.toLowerCase().includes(kw)));
  }).slice(0, top_n);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { username, team_size = 6 } = req.body;
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Get user profile and skills
  const { data: userProfile, error: userError } = await supabase
    .from('profiles')
    .select('id,username,skills')
    .eq('username', username)
    .single();
  if (userError || !userProfile) {
    return res.status(404).json({ error: 'Username not found', details: userError?.message });
  }

  // Parse user's skills
  const user_skills = (userProfile.skills || '').split(/[,;]+/).map(s => s.trim().toLowerCase()).filter(Boolean);
  if (!user_skills.length) {
    return res.status(200).json({ team: [], message: 'No skills found for user. Add skills to your profile for better team suggestions.' });
  }

  // Determine user role
  let user_role = null;
  for (const [role, keywords] of Object.entries(role_skills)) {
    if (user_skills.some(skill => keywords.some(kw => skill && skill.includes(kw)))) {
      user_role = role;
      break;
    }
  }
  if (!user_role) {
    return res.status(200).json({ team: [], message: 'No matching role found for user. Try updating your skills.' });
  }

  // Build team: start with user
  const team = [{ ...userProfile, skills: user_skills }];
  const filled_roles = new Set(user_role ? [user_role] : []);

  // Helper to find candidates for a role
  async function findCandidatesForRole(keywords: string[], excludeIds: string[], top_n = 10) {
    // Find profiles with matching skills in the flat skills column
    const { data: candidates } = await supabase
      .from('profiles')
      .select('id,username,skills')
      .not('id', 'in', `(${excludeIds.map(id => `'${id}'`).join(',')})`);
    // Score by number of matching role keywords
    const scored = (candidates || []).map((p: any) => {
      const theirSkills = (p.skills || '').split(/[,;]+/).map((s: string) => s.trim().toLowerCase()).filter(Boolean);
      const overlap = theirSkills.filter((s: string) => keywords.includes(s));
      return { ...p, skills: theirSkills, score: overlap.length };
    }).filter(p => p.score > 0);
    return scored.sort((a, b) => b.score - a.score).slice(0, top_n);
  }

  let excludeIds = [userProfile.id];
  for (const [role, keywords] of Object.entries(role_skills)) {
    if (role === user_role) continue;
    const candidates = await findCandidatesForRole(keywords, excludeIds, 10);
    if (candidates.length > 0) {
      team.push(candidates[0]);
      filled_roles.add(role);
      excludeIds.push(candidates[0].id);
    }
    if (team.length >= team_size) break;
  }
  if (team.length === 1) {
    return res.status(200).json({ team, message: 'No suitable teammates found. Try updating your skills or wait for more users.' });
  }
  // Fill remaining spots with random users
  if (team.length < team_size) {
    const { data: others } = await supabase
      .from('profiles')
      .select('id,username,display_name')
      .not('id', 'in', `(${excludeIds.map(id => `'${id}'`).join(',')})`)
      .limit(team_size - team.length);
    (others || []).forEach((p: any) => team.push(p));
  }
  res.json({ team });
}
