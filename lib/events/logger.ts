/**
 * ML Event Logger - Append-only event logging for recommendations
 * 
 * Rules:
 * - NEVER update existing rows
 * - ALWAYS insert new rows (append-only)
 * - Logging failures must NOT block user actions
 * - All writes are fire-and-forget
 */

import { createServiceClient } from '@/lib/supabase/service';

// Current event schema version - increment when meaning changes
export const EVENT_VERSION = 1;

// Standardized interaction types (prevents typo-driven data pollution)
export const INTERACTION_TYPES = {
  PROFILE_VIEW: 'profile_view',
  FOLLOW: 'follow',
  UNFOLLOW: 'unfollow',
  CHAT_OPEN: 'chat_open',
  MESSAGE_SENT: 'message_sent',
} as const;

export const CHAT_EVENT_TYPES = {
  CHAT_OPEN: 'chat_open',
  MESSAGE_SENT: 'message_sent',
} as const;

export const NEGATIVE_FEEDBACK_TYPES = {
  BLOCK: 'block',
  UNFOLLOW: 'unfollow',
  MUTE: 'mute',
} as const;

export const VIEW_SOURCES = {
  SEARCH: 'search',
  DISCOVER: 'discover',
  PROFILE: 'profile',
  DIRECT: 'direct',
} as const;

type InteractionType = typeof INTERACTION_TYPES[keyof typeof INTERACTION_TYPES];
type ChatEventType = typeof CHAT_EVENT_TYPES[keyof typeof CHAT_EVENT_TYPES];
type NegativeFeedbackType = typeof NEGATIVE_FEEDBACK_TYPES[keyof typeof NEGATIVE_FEEDBACK_TYPES];
type ViewSource = typeof VIEW_SOURCES[keyof typeof VIEW_SOURCES];

interface BaseMetadata {
  event_version?: number;
  client_ts?: string;
  [key: string]: any;
}

/**
 * Log user-to-user interaction (fire-and-forget)
 */
export async function logUserInteraction(
  actorUsername: string,
  targetUsername: string,
  interactionType: InteractionType,
  source?: ViewSource | string,
  metadata?: BaseMetadata
): Promise<void> {
  try {
    const supabase = createServiceClient();
    await (supabase as any)
      .from('user_interactions')
      .insert({
        actor_username: actorUsername,
        target_username: targetUsername,
        interaction_type: interactionType,
        source,
        metadata: { event_version: EVENT_VERSION, ...metadata },
      });
  } catch (e) {
    console.error('[EventLogger] user_interactions error:', e);
  }
}

/**
 * Log search event (fire-and-forget)
 */
export async function logSearchEvent(
  username: string,
  searchQuery: string,
  resultClickedUsername?: string | null
): Promise<void> {
  try {
    const supabase = createServiceClient();
    await (supabase as any)
      .from('search_events')
      .insert({
        username,
        search_query: searchQuery,
        result_clicked_username: resultClickedUsername,
      });
  } catch (e) {
    console.error('[EventLogger] search_events error:', e);
  }
}

/**
 * Log profile view event with duration (fire-and-forget)
 */
export async function logProfileViewEvent(
  viewerUsername: string,
  viewedUsername: string,
  viewDurationMs?: number,
  source?: ViewSource | string
): Promise<void> {
  try {
    const supabase = createServiceClient();
    await (supabase as any)
      .from('profile_view_events')
      .insert({
        viewer_username: viewerUsername,
        viewed_username: viewedUsername,
        view_duration_ms: viewDurationMs,
        source,
      });
  } catch (e) {
    console.error('[EventLogger] profile_view_events error:', e);
  }
}

/**
 * Log chat event (fire-and-forget)
 */
export async function logChatEvent(
  openerUsername: string,
  targetUsername: string,
  eventType: ChatEventType,
  metadata?: BaseMetadata
): Promise<void> {
  try {
    const supabase = createServiceClient();
    await (supabase as any)
      .from('chat_events')
      .insert({
        opener_username: openerUsername,
        target_username: targetUsername,
        event_type: eventType,
        metadata: { event_version: EVENT_VERSION, ...metadata },
      });
  } catch (e) {
    console.error('[EventLogger] chat_events error:', e);
  }
}

/**
 * Log negative feedback event (fire-and-forget)
 * NOTE: This is the AUTHORITATIVE source for negative signals
 */
export async function logNegativeFeedback(
  actorUsername: string,
  targetUsername: string,
  eventType: NegativeFeedbackType,
  reason?: string
): Promise<void> {
  try {
    const supabase = createServiceClient();
    await (supabase as any)
      .from('negative_feedback_events')
      .insert({
        actor_username: actorUsername,
        target_username: targetUsername,
        event_type: eventType,
        reason,
      });
  } catch (e) {
    console.error('[EventLogger] negative_feedback_events error:', e);
  }
}

/**
 * Upsert user context for cold-start ML (fire-and-forget)
 * This is the ONLY table that uses upsert
 */
export async function upsertUserContext(
  username: string,
  context: {
    college?: string;
    workplace?: string;
    city?: string;
    country?: string;
  }
): Promise<void> {
  try {
    const supabase = createServiceClient();
    await (supabase as any)
      .from('user_context')
      .upsert({
        username,
        ...context,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'username' });
  } catch (e) {
    console.error('[EventLogger] user_context error:', e);
  }
}
