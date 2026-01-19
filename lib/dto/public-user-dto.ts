/**
 * Public User DTOs - Security Layer
 * 
 * NEVER return raw Supabase rows directly.
 * ALL public API responses must pass through these serializers.
 * 
 * Internal fields that are NEVER exposed:
 * - id (internal UUID)
 * - team_id (internal reference)
 * - role (internal permission)
 * - created_at (internal timestamp)
 * - updated_at (internal timestamp)
 * - suspended (internal status)
 * - admin metadata
 */

// ============================================================
// Type Definitions
// ============================================================

/**
 * Public user info for lists, search results, recommendations
 * This is the ONLY structure that should be returned for user arrays
 */
export interface PublicUserDTO {
  username: string;
  name: string | null;
  avatar_url: string | null;
  skills: string | null;
  college: string | null;
  location: string | null;
}

/**
 * Extended public user with engagement metrics
 * For recommendations and suggestions
 */
export interface PublicUserWithMetricsDTO extends PublicUserDTO {
  followers_count: number;
  following_count?: number;
  matching_interests_count?: number;
  matchPercentage?: number;
}

/**
 * Public profile for profile pages (self or public view)
 * More fields than list view, but still sanitized
 */
export interface PublicProfileDTO extends PublicUserDTO {
  bio: string | null;
  interests: string | null;
  age: number | null;
  gender: string | null;
  workplace: string | null;
  school: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  hackathons_participated: number;
  projects_completed: number;
  achievements: string | null;
  followers_count: number;
  following_count: number;
  team_invite_status: string | null;
}

/**
 * Follower/Following list item
 */
export interface PublicFollowUserDTO {
  username: string;
  name: string | null;
}

// ============================================================
// Serializer Functions
// ============================================================

/**
 * Convert raw profile to public user DTO (for lists)
 * SAFE: Only exposes public-facing data
 */
export function toPublicUser(profile: any): PublicUserDTO {
  return {
    username: profile?.username || '',
    name: profile?.name || null,
    avatar_url: profile?.profile_picture_url || profile?.avatar_url || null,
    skills: profile?.skills || null,
    college: profile?.college || null,
    location: profile?.location || null,
  };
}

/**
 * Convert raw profile to public user with metrics (for recommendations)
 * SAFE: Only exposes public-facing data plus engagement counts
 */
export function toPublicUserWithMetrics(
  profile: any,
  metrics: {
    followers_count?: number;
    following_count?: number;
    matching_interests_count?: number;
    matchPercentage?: number;
  } = {}
): PublicUserWithMetricsDTO {
  return {
    ...toPublicUser(profile),
    followers_count: metrics.followers_count ?? 0,
    following_count: metrics.following_count,
    matching_interests_count: metrics.matching_interests_count,
    matchPercentage: metrics.matchPercentage,
  };
}

/**
 * Convert raw profile to full public profile DTO
 * SAFE: Only exposes public-facing data for profile pages
 */
export function toPublicProfile(
  profile: any,
  counts: { followers_count: number; following_count: number }
): PublicProfileDTO {
  return {
    username: profile?.username || '',
    name: profile?.name || null,
    avatar_url: profile?.profile_picture_url || profile?.avatar_url || null,
    bio: profile?.bio || null,
    skills: profile?.skills || null,
    college: profile?.college || null,
    location: profile?.location || null,
    interests: profile?.interests || null,
    age: profile?.age || null,
    gender: profile?.gender || null,
    workplace: profile?.workplace || null,
    school: profile?.school || null,
    github_url: profile?.github_url || null,
    linkedin_url: profile?.linkedin_url || null,
    hackathons_participated: profile?.hackathons_participated || 0,
    projects_completed: profile?.projects_completed || 0,
    achievements: profile?.achievements || null,
    followers_count: counts.followers_count,
    following_count: counts.following_count,
    team_invite_status: profile?.team_invite_status || null,
  };
}

/**
 * Convert raw follow/profile to follow user DTO
 * SAFE: Minimal exposure for follower/following lists
 */
export function toPublicFollowUser(profile: any): PublicFollowUserDTO {
  return {
    username: profile?.username || '',
    name: profile?.name || null,
  };
}

/**
 * Batch convert profiles to public users
 */
export function toPublicUserList(profiles: any[]): PublicUserDTO[] {
  return (profiles || []).map(toPublicUser);
}

/**
 * Batch convert profiles to public users with metrics
 */
export function toPublicUserWithMetricsList(
  profiles: any[],
  metricsMap: Map<string, { followers_count?: number; following_count?: number; matching_interests_count?: number }>
): PublicUserWithMetricsDTO[] {
  return (profiles || []).map(p => {
    const metrics = metricsMap.get(p.username?.toLowerCase()) || metricsMap.get(p.id) || {};
    return toPublicUserWithMetrics(p, metrics);
  });
}

/**
 * Batch convert profiles to follow user list
 */
export function toPublicFollowUserList(profiles: any[]): PublicFollowUserDTO[] {
  return (profiles || []).map(toPublicFollowUser);
}
