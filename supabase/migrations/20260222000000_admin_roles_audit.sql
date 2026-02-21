-- Migration to update admin roles and add audit logs

-- 1. Update the check constraint or enum for admin_roles
-- Assuming admin_roles used a check constraint on the 'role' column.
-- First, drop the old constraint if it exists. (We'll use a safer approach for text columns).

-- Let's define the new role hierarchy in the existing check constraint
ALTER TABLE admin_roles DROP CONSTRAINT IF EXISTS admin_roles_role_check;

ALTER TABLE admin_roles 
ADD CONSTRAINT admin_roles_role_check 
CHECK (role IN ('super_admin', 'admin', 'senior_moderator', 'moderator'));

-- 2. Create the admin_activity_logs table
CREATE TABLE IF NOT EXISTS admin_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    target_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    old_role TEXT,
    new_role TEXT,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Add RLS policies for admin_activity_logs
ALTER TABLE admin_activity_logs ENABLE ROW LEVEL SECURITY;

-- Only super_admins and admins can view logs
CREATE POLICY "Super Admins and Admins can view audit logs"
    ON admin_activity_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM admin_roles 
            WHERE admin_roles.user_id = auth.uid() 
            AND admin_roles.role IN ('super_admin', 'admin')
        )
    );

-- Only service role can insert (handled via backend API)
-- No insert policy for users.

-- 4. Enable RLS on admin_roles (if not already enabled)
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;

-- Only super admins can manage super_admin roles
-- We will handle complex logic in the backend API, so we just allow read access for admins to check roles
CREATE POLICY "Admins can view admin roles"
    ON admin_roles
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM admin_roles a 
            WHERE a.user_id = auth.uid()
        )
    );
