import type { NextApiRequest, NextApiResponse } from 'next';
import { createServiceClient } from '@/lib/supabase/service';
import { createClient } from '@supabase/supabase-js';
import {
  logUserInteraction,
  logSearchEvent,
  logProfileViewEvent,
  logChatEvent,
  logNegativeFeedback,
  INTERACTION_TYPES,
  CHAT_EVENT_TYPES,
  NEGATIVE_FEEDBACK_TYPES,
  VIEW_SOURCES,
  EVENT_VERSION,
} from '@/lib/events/logger';

/**
 * Client-side Event Logging API
 * 
 * POST /api/log-event
 * Body: { event_type, payload, client_ts }
 * 
 * Supported event_type values:
 * - user_interaction
 * - search_event
 * - profile_view_event
 * - chat_event
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get current user from auth header (optional for some events)
  const authHeader = req.headers.authorization;
  let currentUsername: string | null = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '');
    const supabaseAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    const { data: { user } } = await supabaseAuth.auth.getUser(token);
    if (user) {
      const supabase = createServiceClient();
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();
      currentUsername = profile?.username || null;
    }
  }

  const { event_type, payload, client_ts } = req.body;

  if (!event_type || !payload) {
    return res.status(400).json({ error: 'event_type and payload required' });
  }

  // Fire-and-forget - don't await, respond immediately
  try {
    switch (event_type) {
      case 'user_interaction':
        // { target_username, interaction_type, source, metadata }
        if (currentUsername && payload.target_username) {
          logUserInteraction(
            currentUsername,
            payload.target_username,
            payload.interaction_type,
            payload.source,
            { ...payload.metadata, client_ts }
          );
        }
        break;

      case 'search_event':
        // { search_query, result_clicked_username }
        if (currentUsername) {
          logSearchEvent(
            currentUsername,
            payload.search_query,
            payload.result_clicked_username
          );
        }
        break;

      case 'profile_view_event':
        // { viewed_username, view_duration_ms, source }
        if (currentUsername && payload.viewed_username) {
          logProfileViewEvent(
            currentUsername,
            payload.viewed_username,
            payload.view_duration_ms,
            payload.source
          );
        }
        break;

      case 'chat_event':
        // { target_username, chat_event_type, metadata }
        if (currentUsername && payload.target_username) {
          logChatEvent(
            currentUsername,
            payload.target_username,
            payload.chat_event_type,
            { ...payload.metadata, client_ts }
          );
        }
        break;

      default:
        console.warn('[LogEvent] Unknown event_type:', event_type);
    }
  } catch (e) {
    // Never fail the request due to logging errors
    console.error('[LogEvent] Error:', e);
  }

  // Always respond success - logging should never block UX
  return res.json({ logged: true });
}
