import { createServiceClient } from '@/lib/supabase/service';
import * as matching from '@/lib/matching/suggestPeople';

export async function getPeopleRecommendationsByUsername(username: string, top_n = 10) {
  const supabase = createServiceClient();

  // Get user profile and skills
  const { data: userProfile, error: userError } = await supabase
    .from('profiles')
    .select('id,username,skills')
    .eq('username', username)
    .single();

  if (userError || !userProfile) {
    throw new Error('Username not found');
  }

  const userProfileAny: any = userProfile;
  const userSkills = matching.parseSkills(userProfileAny.skills);
  if (!userSkills.length) {
    return { recommendations: [], message: 'No skills found for user.' };
  }

  // Fetch other profiles
  const { data: allProfiles, error: allError } = await supabase
    .from('profiles')
    .select('id,username,skills')
    .neq('username', username);

  if (allError) throw new Error('Failed to fetch profiles');

  const scored = matching.scoreProfilesBySkillOverlap(userSkills, allProfiles || []);
  const recommendations = matching.topByScore(scored, top_n);

  if (!recommendations.length) {
    // Fallback to popular profiles
    const { data: popular, error: popErr } = await supabase
      .from('profiles')
      .select('id,username,skills,followers_count')
      .neq('username', username)
      .order('followers_count', { ascending: false })
      .limit(top_n);

    if (popErr) throw new Error('Failed to fetch popular profiles');

    return { recommendations: popular || [], message: 'No skill-based matches found. Showing popular profiles instead.' };
  }

  return { recommendations };
}

export async function getTeamRecommendationByUsername(username: string, team_size = 6) {
  const supabase = createServiceClient();

  const { data: userProfile, error: userError } = await supabase
    .from('profiles')
    .select('id,username')
    .eq('username', username)
    .single();

  if (userError || !userProfile) throw new Error('Username not found');

  const { data: recommendations, error: recError } = await supabase
    .rpc('recommend_profiles', { p_profile_id: userProfile.id, p_limit: team_size });

  if (recError) throw new Error('Failed to get team recommendations');

  const team = [{ ...userProfile }, ...(recommendations || [])];

  return { team };
}
