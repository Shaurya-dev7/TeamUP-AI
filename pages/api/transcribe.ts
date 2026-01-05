import type { NextApiRequest, NextApiResponse } from 'next';
import { createServiceClient } from '@/lib/supabase/service';
import { createClient } from '@supabase/supabase-js';

// In-memory rate limiting (per user)
const userRateLimits: Map<string, { count: number; resetAt: number }> = new Map();
const userCooldowns: Map<string, number> = new Map();

/**
 * POST /api/transcribe
 * Receives audio blob, transcribes using Whisper, returns text
 * 
 * Rate limiting:
 * - Cooldown: 30s between requests
 * - Max requests per minute: configurable via voice_input_settings
 */
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '5mb', // Max audio file size
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createServiceClient();

    // Authenticate user
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const userId = user.id;

    // Check if voice input is enabled
    // @ts-ignore
    const { data: settings } = await (supabase as any)
      .from('voice_input_settings')
      .select('enabled, cooldown_seconds, max_requests_per_minute')
      .single();

    if (!settings?.enabled) {
      return res.status(403).json({ error: 'Voice input is disabled' });
    }

    const cooldownSeconds = settings.cooldown_seconds || 30;
    const maxRequestsPerMinute = settings.max_requests_per_minute || 10;

    // Check cooldown
    const lastRequest = userCooldowns.get(userId);
    const now = Date.now();
    if (lastRequest && (now - lastRequest) < cooldownSeconds * 1000) {
      const remainingSeconds = Math.ceil((cooldownSeconds * 1000 - (now - lastRequest)) / 1000);
      return res.status(429).json({ 
        error: 'Cooldown active',
        retry_after: remainingSeconds
      });
    }

    // Check rate limit
    const userLimit = userRateLimits.get(userId);
    if (userLimit) {
      if (now < userLimit.resetAt) {
        if (userLimit.count >= maxRequestsPerMinute) {
          return res.status(429).json({ 
            error: 'Rate limit exceeded',
            retry_after: Math.ceil((userLimit.resetAt - now) / 1000)
          });
        }
        userLimit.count++;
      } else {
        // Reset the counter
        userRateLimits.set(userId, { count: 1, resetAt: now + 60000 });
      }
    } else {
      userRateLimits.set(userId, { count: 1, resetAt: now + 60000 });
    }

    // Update cooldown
    userCooldowns.set(userId, now);

    // Get audio data from request
    const { audio } = req.body;
    
    if (!audio) {
      return res.status(400).json({ error: 'Audio data required' });
    }

    // Transcribe using OpenAI Whisper API
    const transcribedText = await transcribeAudio(audio);

    return res.status(200).json({ 
      text: transcribedText,
      success: true
    });

  } catch (err) {
    console.error('/api/transcribe error:', err);
    return res.status(500).json({ error: 'Transcription failed' });
  }
}

/**
 * Transcribe audio using OpenAI Whisper API
 * Falls back to mock response if no API key configured
 */
async function transcribeAudio(audioBase64: string): Promise<string> {
  const openaiApiKey = process.env.OPENAI_API_KEY;

  // If no API key, return mock response for development
  if (!openaiApiKey) {
    console.log('OPENAI_API_KEY not set - returning mock transcription');
    return '[Voice input - configure OPENAI_API_KEY for real transcription]';
  }

  try {
    // Convert base64 to blob
    const audioBuffer = Buffer.from(audioBase64, 'base64');
    
    // Create form data for Whisper API
    const formData = new FormData();
    const audioBlob = new Blob([audioBuffer], { type: 'audio/webm' });
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'whisper-1');
    formData.append('language', 'en'); // Can be made configurable

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Whisper API error:', errorText);
      throw new Error('Whisper API request failed');
    }

    const result = await response.json();
    return result.text || '';
  } catch (error) {
    console.error('Transcription error:', error);
    throw error;
  }
}
