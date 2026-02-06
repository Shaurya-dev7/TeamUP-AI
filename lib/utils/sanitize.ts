/**
 * Simple sanitization utility to strip HTML tags from input string.
 * Used for basic XSS prevention in free-text fields.
 * 
 * @param text The input string to sanitize
 * @returns The sanitized string with HTML tags removed
 */
export function sanitizeInput(text: string | null | undefined): string {
  if (!text) return "";
  
  // Convert to string just in case
  const str = String(text);
  
  // Regex to match HTML tags
  // This matches anything starting with < and ending with > which covers basic tags
  // It's not a full HTML parser but sufficient for preventing basic injection in plain text fields
  return str.replace(/<[^>]*>/g, "").trim();
}
