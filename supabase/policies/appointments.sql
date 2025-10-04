-- Appointments table RLS policies

-- Enable RLS
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Customers can view their own appointments
CREATE POLICY "Customers can view own appointments" ON appointments
    FOR SELECT
    USING (auth.uid() = customer_id);

-- Staff can view appointments assigned to them
CREATE POLICY "Staff can view assigned appointments" ON appointments
    FOR SELECT
    USING (
        auth.uid() = staff_id
        AND EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('staff', 'admin', 'super_admin')
        )
    );

-- Admin can view all appointments
CREATE POLICY "Admin can view all appointments" ON appointments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('admin', 'super_admin')
        )
    );

-- Customers can create appointments for themselves
CREATE POLICY "Customers can create own appointments" ON appointments
    FOR INSERT
    WITH CHECK (
        auth.uid() = customer_id
        AND EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role = 'customer'
        )
    );

-- Staff can create appointments
CREATE POLICY "Staff can create appointments" ON appointments
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('staff', 'admin', 'super_admin')
        )
    );

-- Customers can update their own appointments (limited fields)
CREATE POLICY "Customers can update own appointments" ON appointments
    FOR UPDATE
    USING (
        auth.uid() = customer_id
        AND status IN ('pending', 'confirmed')
    )
    WITH CHECK (
        auth.uid() = customer_id
        AND customer_id = OLD.customer_id -- Cannot change customer
        AND staff_id = OLD.staff_id -- Cannot change staff
        AND service_id = OLD.service_id -- Cannot change service
        AND price_cents = OLD.price_cents -- Cannot change price
    );

-- Staff can update appointments assigned to them
CREATE POLICY "Staff can update assigned appointments" ON appointments
    FOR UPDATE
    USING (
        auth.uid() = staff_id
        AND EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('staff', 'admin', 'super_admin')
        )
    );

-- Admin can update all appointments
CREATE POLICY "Admin can update all appointments" ON appointments
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('admin', 'super_admin')
        )
    );

-- Soft delete only through status update
CREATE POLICY "No hard deletes on appointments" ON appointments
    FOR DELETE
    USING (false);