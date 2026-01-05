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

    // Check if voice input is enabled - default to true for dev if table doesn't exist
    // @ts-ignore
    const { data: settings, error: settingsError } = await (supabase as any)
      .from('voice_note_settings')
      .select('enabled, cooldown_seconds, max_requests_per_minute')
      .single();

    // Default to enabled if settings not found or error
    const isEnabled = settingsError ? true : (settings?.enabled ?? true);
    
    if (!isEnabled) {
      return res.status(403).json({ error: 'Voice input is disabled' });
    }

    const cooldownSeconds = settings?.cooldown_seconds || 30;
    const maxRequestsPerMinute = settings?.max_requests_per_minute || 10;

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
    return 'This is a mock transcription. Add OPENAI_API_KEY to .env.local for real voice-to-text.';
  }

  try {
    // Convert base64 to buffer
    const audioBuffer = Buffer.from(audioBase64, 'base64');
    
    // Create multipart boundary
    const boundary = '----FormBoundary' + Math.random().toString(36).substring(2);
    
    // Build multipart form data manually for Node.js
    const parts: Buffer[] = [];
    
    // Add file part
    parts.push(Buffer.from(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="file"; filename="audio.webm"\r\n` +
      `Content-Type: audio/webm\r\n\r\n`
    ));
    parts.push(audioBuffer);
    parts.push(Buffer.from('\r\n'));
    
    // Add model part
    parts.push(Buffer.from(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="model"\r\n\r\n` +
      `whisper-1\r\n`
    ));
    
    // Add language part (optional)
    parts.push(Buffer.from(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="language"\r\n\r\n` +
      `en\r\n`
    ));
    
    // Close boundary
    parts.push(Buffer.from(`--${boundary}--\r\n`));
    
    const body = Buffer.concat(parts);

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      },
      body: body,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Whisper API error:', response.status, errorText);
      throw new Error(`Whisper API request failed: ${response.status}`);
    }

    const result = await response.json();
    return result.text || '';
  } catch (error) {
    console.error('Transcription error:', error);
    throw error;
  }
}

