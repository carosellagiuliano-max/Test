-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- =====================
-- PROFILES POLICIES
-- =====================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- Staff and admins can view all profiles
CREATE POLICY "Staff can view all profiles"
    ON profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('staff', 'admin', 'super_admin')
        )
    );

-- =====================
-- SERVICE CATEGORIES POLICIES
-- =====================

-- Everyone can view active service categories
CREATE POLICY "Public can view active service categories"
    ON service_categories FOR SELECT
    USING (active = true);

-- Only admins can modify service categories
CREATE POLICY "Admins can manage service categories"
    ON service_categories FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'super_admin')
        )
    );

-- =====================
-- SERVICES POLICIES
-- =====================

-- Everyone can view active services
CREATE POLICY "Public can view active services"
    ON services FOR SELECT
    USING (active = true);

-- Only admins can manage services
CREATE POLICY "Admins can manage services"
    ON services FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'super_admin')
        )
    );

-- =====================
-- STAFF POLICIES
-- =====================

-- Everyone can view active staff members
CREATE POLICY "Public can view active staff"
    ON staff FOR SELECT
    USING (active = true);

-- Staff can view and update their own record
CREATE POLICY "Staff can manage own record"
    ON staff FOR ALL
    USING (id = auth.uid());

-- Admins can manage all staff
CREATE POLICY "Admins can manage all staff"
    ON staff FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'super_admin')
        )
    );

-- =====================
-- APPOINTMENTS POLICIES
-- =====================

-- Customers can view their own appointments
CREATE POLICY "Customers can view own appointments"
    ON appointments FOR SELECT
    USING (customer_id = auth.uid());

-- Customers can create appointments
CREATE POLICY "Authenticated users can create appointments"
    ON appointments FOR INSERT
    WITH CHECK (customer_id = auth.uid());

-- Customers can cancel their own appointments (update status only)
CREATE POLICY "Customers can cancel own appointments"
    ON appointments FOR UPDATE
    USING (
        customer_id = auth.uid()
        AND status IN ('pending', 'confirmed')
    )
    WITH CHECK (
        customer_id = auth.uid()
        AND status = 'cancelled'
    );

-- Staff can view appointments assigned to them
CREATE POLICY "Staff can view assigned appointments"
    ON appointments FOR SELECT
    USING (staff_id = auth.uid());

-- Staff can update appointments assigned to them
CREATE POLICY "Staff can update assigned appointments"
    ON appointments FOR UPDATE
    USING (staff_id = auth.uid());

-- Admins can manage all appointments
CREATE POLICY "Admins can manage all appointments"
    ON appointments FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'super_admin')
        )
    );

-- =====================
-- PAYMENTS POLICIES
-- =====================

-- Customers can view their own payments
CREATE POLICY "Customers can view own payments"
    ON payments FOR SELECT
    USING (customer_id = auth.uid());

-- Staff can view payments for their appointments
CREATE POLICY "Staff can view related payments"
    ON payments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM appointments a
            WHERE a.id = payments.appointment_id
            AND a.staff_id = auth.uid()
        )
    );

-- Admins can view all payments
CREATE POLICY "Admins can view all payments"
    ON payments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'super_admin')
        )
    );

-- Only system can create/update payments (via service role)
-- No INSERT/UPDATE policies for regular users

-- =====================
-- PRODUCTS POLICIES
-- =====================

-- Everyone can view active products
CREATE POLICY "Public can view active products"
    ON products FOR SELECT
    USING (active = true);

-- Only admins can manage products
CREATE POLICY "Admins can manage products"
    ON products FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'super_admin')
        )
    );

-- =====================
-- PRODUCT CATEGORIES POLICIES
-- =====================

-- Everyone can view active product categories
CREATE POLICY "Public can view active product categories"
    ON product_categories FOR SELECT
    USING (active = true);

-- Only admins can manage product categories
CREATE POLICY "Admins can manage product categories"
    ON product_categories FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'super_admin')
        )
    );

-- =====================
-- ORDERS POLICIES
-- =====================

-- Customers can view their own orders
CREATE POLICY "Customers can view own orders"
    ON orders FOR SELECT
    USING (customer_id = auth.uid());

-- Customers can create orders
CREATE POLICY "Customers can create orders"
    ON orders FOR INSERT
    WITH CHECK (customer_id = auth.uid());

-- Staff can view and update orders
CREATE POLICY "Staff can manage orders"
    ON orders FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('staff', 'admin', 'super_admin')
        )
    );

-- =====================
-- ORDER ITEMS POLICIES
-- =====================

-- Customers can view items from their own orders
CREATE POLICY "Customers can view own order items"
    ON order_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM orders o
            WHERE o.id = order_items.order_id
            AND o.customer_id = auth.uid()
        )
    );

-- Staff can manage order items
CREATE POLICY "Staff can manage order items"
    ON order_items FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('staff', 'admin', 'super_admin')
        )
    );

-- =====================
-- NOTIFICATIONS POLICIES
-- =====================

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
    ON notifications FOR SELECT
    USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
    ON notifications FOR UPDATE
    USING (user_id = auth.uid());

-- System creates notifications (via service role)
-- No INSERT policy for regular users

-- =====================
-- AUDIT LOG POLICIES
-- =====================

-- Only super admins can view audit logs
CREATE POLICY "Super admins can view audit logs"
    ON audit_log FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'super_admin'
        )
    );

-- No one can modify audit logs (append-only via service role)

-- =====================
-- HELPER FUNCTIONS
-- =====================

-- Function to check if user is staff or admin
CREATE OR REPLACE FUNCTION is_staff_or_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role IN ('staff', 'admin', 'super_admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION is_staff_or_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;