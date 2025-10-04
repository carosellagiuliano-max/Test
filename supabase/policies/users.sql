-- Users table RLS policies

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile and staff/admin can view customer profiles
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Staff can view customer profiles" ON users
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('staff', 'admin', 'super_admin')
        )
        AND role = 'customer'
    );

CREATE POLICY "Admin can view all user profiles" ON users
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('admin', 'super_admin')
        )
    );

-- Users can update their own profile (limited fields)
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id
        AND role = OLD.role -- Cannot change role
        AND status = OLD.status -- Cannot change status
    );

-- Admin can update user profiles
CREATE POLICY "Admin can update user profiles" ON users
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('admin', 'super_admin')
        )
    );

-- Admin can create new users
CREATE POLICY "Admin can create users" ON users
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('admin', 'super_admin')
        )
    );

-- Soft delete only - no hard deletes
CREATE POLICY "No hard deletes" ON users
    FOR DELETE
    USING (false);