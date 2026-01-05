/**
 * Profile Completeness Checker
 * 
 * A user is considered "profile_complete" ONLY if ALL are true:
 * - name (display_name) is not null/empty
 * - profile picture exists (avatar or pfp field)
 * - at least ONE skill OR interest exists
 * - at least ONE of college or workplace is filled
 */

export interface ProfileCompletenessResult {
  isComplete: boolean;
  missing: string[];
}

export function checkProfileCompleteness(profile: any, options: { minimal?: boolean } = {}): ProfileCompletenessResult {
  const missing: string[] = [];

  // Check display name (Always required)
  if (!profile?.name || profile.name.trim() === '') {
    missing.push('display_name');
  }

  // Minimal check (Mandatory fields for Follow/Chat)
  if (options.minimal) {
    if (!profile?.age) missing.push('age');
    if (!profile?.gender) missing.push('gender');
    // Username is handled by auth usually but good to check if profile object has it
    if (!profile?.username) missing.push('username');
    
    return {
      isComplete: missing.length === 0,
      missing,
    };
  }

  // Check profile picture (could be avatar_url, pfp, profile_picture, or profile_picture_url)
  const hasPfp = profile?.avatar_url || profile?.pfp || profile?.profile_picture || profile?.profile_picture_url;
  if (!hasPfp) {
    missing.push('profile_picture');
  }

  // Check skills or interests (at least one)
  const hasSkills = profile?.skills && profile.skills.trim() !== '';
  const hasInterests = profile?.interests && profile.interests.trim() !== '';
  if (!hasSkills && !hasInterests) {
    missing.push('skills_or_interests');
  }

  // Check college or workplace (at least one)
  const hasCollege = profile?.college && profile.college.trim() !== '';
  const hasWorkplace = profile?.workplace && profile.workplace.trim() !== '';
  if (!hasCollege && !hasWorkplace) {
    missing.push('college_or_workplace');
  }

  return {
    isComplete: missing.length === 0,
    missing,
  };
}

/**
 * Human-readable message for incomplete profiles
 */
export function getIncompleteProfileMessage(missing: string[]): string {
  const requirements: string[] = [];
  
  if (missing.includes('display_name')) {
    requirements.push('display name');
  }
  if (missing.includes('profile_picture')) {
    requirements.push('profile picture');
  }
  if (missing.includes('skills_or_interests')) {
    requirements.push('at least one skill or interest');
  }
  if (missing.includes('college_or_workplace')) {
    requirements.push('college or workplace');
  }

  if (requirements.length === 0) {
    return '';
  }

  return `Complete your profile to continue. Missing: ${requirements.join(', ')}.`;
}

/**
 * Short message for UI tooltips
 */
export const INCOMPLETE_PROFILE_TOOLTIP = 
  'Complete your profile to start following and chatting with others.';

export const INCOMPLETE_PROFILE_ERROR = 
  'Profile incomplete. Please add your name, profile picture, skills/interests, and college/workplace before taking this action.';
