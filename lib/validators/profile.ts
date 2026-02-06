import { z } from "zod";
import { sanitizeInput } from "@/lib/utils/sanitize";

export const ProfileSchema = z.object({
  // Basic Info
  username: z.string()
    .min(3, "Username must be at least 3 chars")
    .max(50, "Username too long")
    .transform(sanitizeInput),
    
  name: z.string()
    .min(1, "Name is required")
    .max(100, "Name too long")
    .transform(sanitizeInput),
    
  age: z.coerce.number()
    .int()
    .min(13, "Must be at least 13")
    .max(120, "Invalid age")
    .nullable()
    .optional(),
    
  gender: z.string()
    .max(50)
    .nullable()
    .optional()
    .transform(val => val ? sanitizeInput(val) : val),
    
  // Contact / Location
  location: z.string() // city/town
    .max(100)
    .nullable()
    .optional()
    .transform(val => val ? sanitizeInput(val) : val),
    
  hostel_city: z.string()
    .max(100)
    .nullable()
    .optional()
    .transform(val => val ? sanitizeInput(val) : val),

  // Professional / Education
  college: z.string()
    .max(200)
    .nullable()
    .optional()
    .transform(val => val ? sanitizeInput(val) : val),

  college_id: z.string().nullable().optional(), // Often a UUID or ID string
  college_name_raw: z.string().max(200).nullable().optional().transform(val => val ? sanitizeInput(val) : val),
  
  school: z.string().max(200).nullable().optional().transform(val => val ? sanitizeInput(val) : val),
  workplace: z.string().max(200).nullable().optional().transform(val => val ? sanitizeInput(val) : val),

  // Skills & Achievements
  skills: z.string() // expected comma-separated string based on existing code
    .max(1000)
    .nullable()
    .optional()
    .transform(val => val ? sanitizeInput(val) : val),
    
  achievements: z.string()
    .max(2000)
    .nullable()
    .optional()
    .transform(val => val ? sanitizeInput(val) : val),
    
  interests: z.string()
    .max(1000)
    .nullable()
    .optional()
    .transform(val => val ? sanitizeInput(val) : val),

  // Stats
  hackathons_participated: z.coerce.number().int().min(0).nullable().optional().default(0),
  projects_completed: z.coerce.number().int().min(0).nullable().optional().default(0),

  // Social Links
  github_url: z.string().url().max(255).nullable().optional().or(z.literal('')),
  linkedin_url: z.string().url().max(255).nullable().optional().or(z.literal('')),
  profile_picture_url: z.string().url().max(500).nullable().optional().or(z.literal('')),
  
  // Complex / Arrays (Sanitized as JSON if needed, but schema validates structure)
  certificates: z.array(z.any()).optional().default([]), // Keep loose for now or define strict shape if known
  synced_contacts: z.array(z.any()).optional().default([]),
  
  // Status
  team_invite_status: z.enum(['not_in_team_open', 'in_team_closed', 'in_team_open', 'looking_for_team', 'do_not_disturb'])
    .optional()
    .default('not_in_team_open'),
});

export type ProfileInput = z.infer<typeof ProfileSchema>;
