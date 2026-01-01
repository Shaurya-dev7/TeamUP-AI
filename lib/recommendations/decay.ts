/**
 * Time Decay & Account Age Multipliers
 * 
 * These functions apply temporal weighting to recommendation scores.
 * Designed to be ML-replaceable - isolated, pure functions.
 */

/**
 * Calculate time decay weight based on event age
 * Recent events matter more than old ones
 */
export function getTimeDecayWeight(eventDate: Date): number {
  const now = new Date();
  const daysDiff = (now.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24);

  if (daysDiff <= 7) return 1.0;       // Full weight for last 7 days
  if (daysDiff <= 30) return 0.5;      // Half weight for 7-30 days
  return 0.2;                           // Low weight for older events
}

/**
 * Calculate account age multiplier
 * New accounts get lower scores (anti-spam measure)
 */
export function getAccountAgeMultiplier(createdAt: Date): number {
  const now = new Date();
  const daysDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);

  if (daysDiff < 7) return 0.2;        // Very new accounts
  if (daysDiff <= 30) return 0.6;      // New accounts
  return 1.0;                           // Established accounts
}

/**
 * Apply time decay to a score based on event date
 */
export function applyTimeDecay(basePoints: number, eventDate: Date): number {
  return basePoints * getTimeDecayWeight(eventDate);
}

/**
 * Cap score to prevent extreme outliers
 */
export const MAX_SCORE = 100;

export function capScore(score: number): number {
  return Math.min(score, MAX_SCORE);
}

/**
 * Convert raw score to match percentage (0-100%)
 * Uses a logarithmic scale for better distribution
 */
export function scoreToMatchPercentage(score: number): number {
  if (score <= 0) return 0;
  
  // Logarithmic mapping: score 1 = ~20%, score 50 = ~85%, score 100 = 100%
  const percentage = Math.min(100, Math.round(20 + (80 * Math.log10(score + 1) / Math.log10(MAX_SCORE + 1))));
  
  return percentage;
}
