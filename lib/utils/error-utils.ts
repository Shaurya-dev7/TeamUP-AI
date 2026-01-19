/**
 * API Error Utilities - Security Layer
 * 
 * NEVER return raw Supabase errors or internal details.
 * ALL errors must be sanitized before being sent to clients.
 */

// ============================================================
// Error Logging (Server-Side Only)
// ============================================================

/**
 * Log API error with full details (server-side only)
 * This captures the complete error for debugging while keeping
 * client responses safe.
 */
export function logApiError(
  context: string,
  error: unknown,
  additionalInfo?: Record<string, unknown>
): void {
  const timestamp = new Date().toISOString();
  const errorDetails = {
    timestamp,
    context,
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
    } : error,
    ...additionalInfo,
  };
  
  console.error(`[API Error] ${context}:`, JSON.stringify(errorDetails, null, 2));
}

// ============================================================
// Error Response Types
// ============================================================

interface SafeErrorResponse {
  error: string;
}

// ============================================================
// Sanitized Error Responses
// ============================================================

/**
 * Known safe error messages that can be shown to users
 */
const SAFE_ERROR_MESSAGES: Record<string, string> = {
  // Auth errors
  'invalid_credentials': 'Invalid email or password',
  'invalid_token': 'Session expired. Please log in again.',
  'unauthorized': 'Unauthorized',
  'missing_auth': 'Authentication required',
  
  // Resource errors
  'not_found': 'Not found',
  'profile_not_found': 'Profile not found',
  'team_not_found': 'Team not found',
  'user_not_found': 'User not found',
  
  // Permission errors
  'permission_denied': 'Permission denied',
  'forbidden': 'Access denied',
  
  // Validation errors
  'invalid_input': 'Invalid input',
  'missing_required': 'Required fields missing',
  
  // Rate limiting
  'rate_limited': 'Too many requests. Please try again later.',
  
  // Generic
  'internal_error': 'Something went wrong. Please try again.',
  'database_error': 'Unable to process request',
  'unknown': 'An error occurred',
};

/**
 * Get safe error message for client response
 * NEVER exposes internal error details
 */
export function getSafeErrorMessage(errorKey: string): string {
  return SAFE_ERROR_MESSAGES[errorKey] || SAFE_ERROR_MESSAGES['unknown'];
}

/**
 * Create a safe error response object
 * Use this for ALL API error responses
 */
export function safeError(errorKey: string): SafeErrorResponse {
  return {
    error: getSafeErrorMessage(errorKey),
  };
}

/**
 * Create safe error response from Supabase error
 * Maps Supabase error codes to safe messages
 */
export function safeSupabaseError(error: any, context?: string): SafeErrorResponse {
  // Log full error server-side
  logApiError(context || 'Supabase operation', error);
  
  // Map common Supabase error codes to safe messages
  const code = error?.code;
  
  switch (code) {
    case 'PGRST116': // Row not found
      return safeError('not_found');
    case '42P01': // Table doesn't exist
      return safeError('database_error');
    case '23505': // Unique constraint violation
      return safeError('invalid_input');
    case '23503': // Foreign key violation
      return safeError('invalid_input');
    case 'PGRST301': // JWT expired
      return safeError('invalid_token');
    case '42501': // Permission denied
      return safeError('permission_denied');
    default:
      return safeError('internal_error');
  }
}

// ============================================================
// NextApiResponse Helpers (Pages Router)
// ============================================================

import type { NextApiResponse } from 'next';

/**
 * Send safe error response (Pages Router)
 */
export function sendSafeError(
  res: NextApiResponse,
  status: number,
  errorKey: string,
  logContext?: string,
  error?: unknown
): void {
  if (error && logContext) {
    logApiError(logContext, error);
  }
  res.status(status).json(safeError(errorKey));
}

/**
 * Send safe Supabase error response (Pages Router)
 */
export function sendSafeSupabaseError(
  res: NextApiResponse,
  error: any,
  context: string
): void {
  const status = mapSupabaseErrorToStatus(error);
  res.status(status).json(safeSupabaseError(error, context));
}

// ============================================================
// NextResponse Helpers (App Router)
// ============================================================

import { NextResponse } from 'next/server';

/**
 * Create safe error NextResponse (App Router)
 */
export function safeNextResponse(
  status: number,
  errorKey: string,
  logContext?: string,
  error?: unknown
): NextResponse {
  if (error && logContext) {
    logApiError(logContext, error);
  }
  return NextResponse.json(safeError(errorKey), { status });
}

/**
 * Create safe Supabase error NextResponse (App Router)
 */
export function safeSupabaseNextResponse(
  error: any,
  context: string
): NextResponse {
  const status = mapSupabaseErrorToStatus(error);
  return NextResponse.json(safeSupabaseError(error, context), { status });
}

// ============================================================
// Utility Functions
// ============================================================

/**
 * Map Supabase error codes to HTTP status codes
 */
function mapSupabaseErrorToStatus(error: any): number {
  const code = error?.code;
  
  switch (code) {
    case 'PGRST116': // Row not found
      return 404;
    case 'PGRST301': // JWT expired
      return 401;
    case '42501': // Permission denied
      return 403;
    case '23505': // Unique constraint
    case '23503': // Foreign key
    case '22P02': // Invalid input
      return 400;
    default:
      return 500;
  }
}
