-- Add new columns to profiles table for extended profile information

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS github_url text,
ADD COLUMN IF NOT EXISTS linkedin_url text,
ADD COLUMN IF NOT EXISTS profile_picture_url text,
ADD COLUMN IF NOT EXISTS interests text, -- comma separated tags
ADD COLUMN IF NOT EXISTS certificates jsonb DEFAULT '[]'::jsonb, -- [{title, issuer, year, url}]
ADD COLUMN IF NOT EXISTS workplace text,
ADD COLUMN IF NOT EXISTS school text,
ADD COLUMN IF NOT EXISTS synced_contacts jsonb DEFAULT '[]'::jsonb; -- hashed identifiers

-- Comment on new columns
COMMENT ON COLUMN profiles.interests IS 'Comma-separated list of interests';
COMMENT ON COLUMN profiles.certificates IS 'List of certificates in JSON format';
COMMENT ON COLUMN profiles.synced_contacts IS 'List of hashed contact identifiers for recommendation';
