-- Services table RLS policies

-- Enable RLS
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_availability ENABLE ROW LEVEL SECURITY;

-- Anyone can view active services
CREATE POLICY "Anyone can view active services" ON services
    FOR SELECT
    USING (status = 'active');

-- Staff can view all services
CREATE POLICY "Staff can view all services" ON services
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('staff', 'admin', 'super_admin')
        )
    );

-- Admin can manage services
CREATE POLICY "Admin can manage services" ON services
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('admin', 'super_admin')
        )
    );

-- Service Categories policies
CREATE POLICY "Anyone can view active service categories" ON service_categories
    FOR SELECT
    USING (status = 'active');

CREATE POLICY "Staff can view all service categories" ON service_categories
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('staff', 'admin', 'super_admin')
        )
    );

CREATE POLICY "Admin can manage service categories" ON service_categories
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('admin', 'super_admin')
        )
    );

-- Service Staff assignments policies
CREATE POLICY "Staff can view own service assignments" ON service_staff
    FOR SELECT
    USING (auth.uid() = staff_id);

CREATE POLICY "Admin can view all service assignments" ON service_staff
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Admin can manage service assignments" ON service_staff
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('admin', 'super_admin')
        )
    );

-- Service Availability policies
CREATE POLICY "Anyone can view service availability" ON service_availability
    FOR SELECT
    USING (is_available = true);

CREATE POLICY "Staff can view own availability" ON service_availability
    FOR SELECT
    USING (auth.uid() = staff_id);

CREATE POLICY "Admin can view all availability" ON service_availability
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Staff can update own availability" ON service_availability
    FOR UPDATE
    USING (auth.uid() = staff_id)
    WITH CHECK (auth.uid() = staff_id);

CREATE POLICY "Admin can manage all availability" ON service_availability
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('admin', 'super_admin')
        )
    );