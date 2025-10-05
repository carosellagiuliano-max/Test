-- Additional tables for comprehensive booking system
-- Staff working hours and availability

-- Staff working hours (weekly schedule)
CREATE TABLE staff_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    timezone TEXT NOT NULL DEFAULT 'Europe/Zurich',
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_until DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Ensure staff can't have overlapping availability on same day
    EXCLUDE USING gist (
        staff_id WITH =,
        day_of_week WITH =,
        tsrange(start_time::TEXT::TIME, end_time::TEXT::TIME) WITH &&,
        daterange(effective_from, COALESCE(effective_until, '9999-12-31'::DATE)) WITH &&
    )
);

-- Staff time off periods (vacation, sick days, etc.)
CREATE TABLE staff_time_off (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    reason TEXT,
    type TEXT NOT NULL DEFAULT 'vacation', -- vacation, sick, personal, training
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Prevent overlapping time off for same staff
    EXCLUDE USING gist (
        staff_id WITH =,
        tstzrange(start_time, end_time) WITH &&
    )
);

-- Booking buffer settings per service/staff combination
CREATE TABLE booking_buffers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID REFERENCES users(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    buffer_before_minutes INTEGER NOT NULL DEFAULT 15,
    buffer_after_minutes INTEGER NOT NULL DEFAULT 15,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Either staff-specific or service-specific, or both
    CHECK (staff_id IS NOT NULL OR service_id IS NOT NULL),
    UNIQUE(staff_id, service_id)
);

-- Booking settings (global configuration)
CREATE TABLE booking_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key TEXT NOT NULL UNIQUE,
    setting_value JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default booking settings
INSERT INTO booking_settings (setting_key, setting_value, description) VALUES
('timezone', '"Europe/Zurich"', 'Default timezone for the salon'),
('business_hours', '{"monday": {"start": "09:00", "end": "18:00"}, "tuesday": {"start": "09:00", "end": "18:00"}, "wednesday": {"start": "09:00", "end": "18:00"}, "thursday": {"start": "09:00", "end": "18:00"}, "friday": {"start": "09:00", "end": "18:00"}, "saturday": {"start": "09:00", "end": "16:00"}, "sunday": null}', 'Default business hours'),
('advance_booking_limit_days', '90', 'Maximum days in advance customers can book'),
('min_advance_booking_hours', '2', 'Minimum hours in advance for booking'),
('default_buffer_minutes', '15', 'Default buffer time between appointments'),
('cancellation_policy_hours', '24', 'Hours before appointment when cancellation is allowed'),
('reminder_hours', '[24, 2]', 'Hours before appointment to send reminders'),
('max_appointments_per_day', '10', 'Maximum appointments per staff member per day'),
('working_days', '[1, 2, 3, 4, 5, 6]', 'Working days of the week (1=Monday, 7=Sunday)');

-- Create booking attempts log for debugging and analytics
CREATE TABLE booking_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES users(id),
    service_id UUID NOT NULL REFERENCES services(id),
    staff_id UUID REFERENCES users(id),
    requested_start_time TIMESTAMPTZ NOT NULL,
    requested_end_time TIMESTAMPTZ NOT NULL,
    success BOOLEAN NOT NULL DEFAULT FALSE,
    error_code TEXT,
    error_message TEXT,
    idempotency_key TEXT,
    user_agent TEXT,
    ip_address INET,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_staff_availability_staff_id ON staff_availability(staff_id);
CREATE INDEX idx_staff_availability_day_of_week ON staff_availability(day_of_week);
CREATE INDEX idx_staff_availability_effective_dates ON staff_availability(effective_from, effective_until);

CREATE INDEX idx_staff_time_off_staff_id ON staff_time_off(staff_id);
CREATE INDEX idx_staff_time_off_time_range ON staff_time_off USING gist(tstzrange(start_time, end_time));
CREATE INDEX idx_staff_time_off_start_time ON staff_time_off(start_time);

CREATE INDEX idx_booking_buffers_staff_id ON booking_buffers(staff_id);
CREATE INDEX idx_booking_buffers_service_id ON booking_buffers(service_id);

CREATE INDEX idx_booking_attempts_customer_id ON booking_attempts(customer_id);
CREATE INDEX idx_booking_attempts_service_id ON booking_attempts(service_id);
CREATE INDEX idx_booking_attempts_staff_id ON booking_attempts(staff_id);
CREATE INDEX idx_booking_attempts_created_at ON booking_attempts(created_at);
CREATE INDEX idx_booking_attempts_idempotency_key ON booking_attempts(idempotency_key);

-- Add triggers for updated_at
CREATE TRIGGER update_staff_availability_updated_at BEFORE UPDATE ON staff_availability FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_staff_time_off_updated_at BEFORE UPDATE ON staff_time_off FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_booking_buffers_updated_at BEFORE UPDATE ON booking_buffers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_booking_settings_updated_at BEFORE UPDATE ON booking_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to calculate available time slots
CREATE OR REPLACE FUNCTION calculate_available_slots(
    p_service_id UUID,
    p_staff_id UUID DEFAULT NULL,
    p_date DATE DEFAULT CURRENT_DATE,
    p_days_ahead INTEGER DEFAULT 1
)
RETURNS TABLE (
    staff_id UUID,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    available BOOLEAN,
    reason TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_service services%ROWTYPE;
    v_current_date DATE;
    v_end_date DATE;
    v_timezone TEXT;
    v_buffer_minutes INTEGER;
    rec RECORD;
BEGIN
    -- Get service details
    SELECT * INTO v_service FROM services WHERE id = p_service_id AND status = 'active';
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Service not found or inactive';
    END IF;

    -- Get timezone setting
    SELECT setting_value::TEXT INTO v_timezone
    FROM booking_settings
    WHERE setting_key = 'timezone';
    v_timezone := COALESCE(TRIM('"' FROM v_timezone), 'Europe/Zurich');

    -- Calculate date range
    v_current_date := p_date;
    v_end_date := p_date + p_days_ahead;

    -- Get default buffer time
    SELECT setting_value::INTEGER INTO v_buffer_minutes
    FROM booking_settings
    WHERE setting_key = 'default_buffer_minutes';
    v_buffer_minutes := COALESCE(v_buffer_minutes, 15);

    -- Generate slots for each day and staff member
    FOR rec IN
        SELECT DISTINCT
            CASE
                WHEN p_staff_id IS NOT NULL THEN p_staff_id
                ELSE ss.staff_id
            END as staff_id,
            d.date_val,
            sa.start_time,
            sa.end_time
        FROM generate_series(v_current_date, v_end_date, '1 day'::interval) d(date_val)
        CROSS JOIN (
            SELECT staff_id FROM service_staff ss
            WHERE ss.service_id = p_service_id
            AND (p_staff_id IS NULL OR ss.staff_id = p_staff_id)
        ) ss
        INNER JOIN staff_availability sa ON sa.staff_id = ss.staff_id
        WHERE sa.day_of_week = EXTRACT(DOW FROM d.date_val)
        AND d.date_val >= sa.effective_from
        AND (sa.effective_until IS NULL OR d.date_val <= sa.effective_until)
        ORDER BY staff_id, date_val, start_time
    LOOP
        -- Generate 15-minute slots within working hours
        FOR v_slot_start IN
            SELECT generate_series(
                (rec.date_val + rec.start_time)::TIMESTAMPTZ,
                (rec.date_val + rec.end_time - (v_service.duration_minutes || ' minutes')::INTERVAL)::TIMESTAMPTZ,
                '15 minutes'::INTERVAL
            )
        LOOP
            DECLARE
                v_slot_end TIMESTAMPTZ;
                v_available BOOLEAN := TRUE;
                v_reason TEXT := NULL;
                v_conflict_count INTEGER;
            BEGIN
                v_slot_end := v_slot_start + (v_service.duration_minutes || ' minutes')::INTERVAL;

                -- Check for time off
                SELECT COUNT(*) INTO v_conflict_count
                FROM staff_time_off sto
                WHERE sto.staff_id = rec.staff_id
                AND tstzrange(sto.start_time, sto.end_time) && tstzrange(v_slot_start, v_slot_end);

                IF v_conflict_count > 0 THEN
                    v_available := FALSE;
                    v_reason := 'Staff not available (time off)';
                END IF;

                -- Check for existing appointments (including buffer time)
                IF v_available THEN
                    SELECT COUNT(*) INTO v_conflict_count
                    FROM appointments a
                    WHERE a.staff_id = rec.staff_id
                    AND a.status NOT IN ('cancelled', 'no_show')
                    AND tstzrange(
                        a.start_time - (v_buffer_minutes || ' minutes')::INTERVAL,
                        a.end_time + (v_buffer_minutes || ' minutes')::INTERVAL
                    ) && tstzrange(v_slot_start, v_slot_end);

                    IF v_conflict_count > 0 THEN
                        v_available := FALSE;
                        v_reason := 'Time slot not available';
                    END IF;
                END IF;

                -- Check if slot is in the past
                IF v_available AND v_slot_start <= NOW() + (v_service.min_advance_booking_hours || ' hours')::INTERVAL THEN
                    v_available := FALSE;
                    v_reason := 'Slot is too soon';
                END IF;

                -- Return the slot
                RETURN QUERY SELECT rec.staff_id, v_slot_start, v_slot_end, v_available, v_reason;
            END;
        END LOOP;
    END LOOP;

    RETURN;
END;
$$;

-- Create function to validate booking request
CREATE OR REPLACE FUNCTION validate_booking_request(
    p_customer_id UUID,
    p_staff_id UUID,
    p_service_id UUID,
    p_start_time TIMESTAMPTZ,
    p_idempotency_key TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_service services%ROWTYPE;
    v_end_time TIMESTAMPTZ;
    v_conflict_count INTEGER;
    v_result JSONB := '{"valid": true, "errors": []}'::JSONB;
    v_errors TEXT[] := '{}';
BEGIN
    -- Check service exists and is active
    SELECT * INTO v_service FROM services WHERE id = p_service_id AND status = 'active';
    IF NOT FOUND THEN
        v_errors := array_append(v_errors, 'Service not found or inactive');
    ELSE
        v_end_time := p_start_time + (v_service.duration_minutes || ' minutes')::INTERVAL;
    END IF;

    -- Check staff exists and is active
    IF NOT EXISTS (SELECT 1 FROM users WHERE id = p_staff_id AND role = 'staff' AND status = 'active') THEN
        v_errors := array_append(v_errors, 'Staff member not found or inactive');
    END IF;

    -- Check customer exists
    IF NOT EXISTS (SELECT 1 FROM users WHERE id = p_customer_id AND status = 'active') THEN
        v_errors := array_append(v_errors, 'Customer not found or inactive');
    END IF;

    -- Check if staff can provide this service
    IF NOT EXISTS (SELECT 1 FROM service_staff WHERE service_id = p_service_id AND staff_id = p_staff_id) THEN
        v_errors := array_append(v_errors, 'Staff member cannot provide this service');
    END IF;

    -- Check for time conflicts with existing appointments
    SELECT COUNT(*) INTO v_conflict_count
    FROM appointments
    WHERE staff_id = p_staff_id
    AND status NOT IN ('cancelled', 'no_show')
    AND tstzrange(start_time, end_time) && tstzrange(p_start_time, v_end_time);

    IF v_conflict_count > 0 THEN
        v_errors := array_append(v_errors, 'Time slot conflicts with existing appointment');
    END IF;

    -- Check for staff time off
    SELECT COUNT(*) INTO v_conflict_count
    FROM staff_time_off
    WHERE staff_id = p_staff_id
    AND tstzrange(start_time, end_time) && tstzrange(p_start_time, v_end_time);

    IF v_conflict_count > 0 THEN
        v_errors := array_append(v_errors, 'Staff member is not available during this time');
    END IF;

    -- Check minimum advance booking time
    IF p_start_time <= NOW() + (v_service.min_advance_booking_hours || ' hours')::INTERVAL THEN
        v_errors := array_append(v_errors, 'Booking must be made at least ' || v_service.min_advance_booking_hours || ' hours in advance');
    END IF;

    -- Check maximum advance booking time
    IF p_start_time > NOW() + (v_service.max_advance_booking_days || ' days')::INTERVAL THEN
        v_errors := array_append(v_errors, 'Booking cannot be made more than ' || v_service.max_advance_booking_days || ' days in advance');
    END IF;

    -- Check idempotency key for duplicate requests
    IF p_idempotency_key IS NOT NULL THEN
        IF EXISTS (SELECT 1 FROM booking_attempts WHERE idempotency_key = p_idempotency_key AND success = TRUE) THEN
            v_errors := array_append(v_errors, 'Duplicate booking request');
        END IF;
    END IF;

    -- Build result
    IF array_length(v_errors, 1) > 0 THEN
        v_result := jsonb_build_object(
            'valid', false,
            'errors', array_to_json(v_errors),
            'suggested_times', '[]'::JSONB
        );
    END IF;

    RETURN v_result;
END;
$$;

-- Enable pg_cron extension for scheduling reminders
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create function to send appointment reminders
CREATE OR REPLACE FUNCTION send_appointment_reminders()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    reminder_hours INTEGER[];
    reminder_hour INTEGER;
    appointment_count INTEGER := 0;
    rec RECORD;
BEGIN
    -- Get reminder hours from settings
    SELECT setting_value::JSONB INTO reminder_hours
    FROM booking_settings
    WHERE setting_key = 'reminder_hours';

    IF reminder_hours IS NULL THEN
        reminder_hours := '[24, 2]';
    END IF;

    -- Loop through each reminder time
    FOR reminder_hour IN SELECT * FROM jsonb_array_elements_text(reminder_hours::JSONB)
    LOOP
        -- Find appointments that need reminders
        FOR rec IN
            SELECT
                a.id,
                a.customer_id,
                a.staff_id,
                a.service_id,
                a.start_time,
                u.email,
                u.first_name,
                u.last_name,
                s.name as service_name,
                staff.first_name as staff_first_name,
                staff.last_name as staff_last_name
            FROM appointments a
            INNER JOIN users u ON a.customer_id = u.id
            INNER JOIN services s ON a.service_id = s.id
            INNER JOIN users staff ON a.staff_id = staff.id
            WHERE a.status = 'confirmed'
            AND a.reminder_sent_at IS NULL
            AND a.start_time > NOW()
            AND a.start_time <= NOW() + (reminder_hour || ' hours')::INTERVAL
            AND a.start_time >= NOW() + ((reminder_hour - 1) || ' hours')::INTERVAL
        LOOP
            -- Create notification
            INSERT INTO notifications (
                user_id,
                title,
                message,
                type,
                priority,
                metadata
            ) VALUES (
                rec.customer_id,
                'Appointment Reminder',
                'You have an appointment for ' || rec.service_name || ' with ' ||
                rec.staff_first_name || ' ' || rec.staff_last_name || ' at ' ||
                to_char(rec.start_time AT TIME ZONE 'Europe/Zurich', 'DD/MM/YYYY HH24:MI'),
                'appointment_reminder',
                'normal',
                jsonb_build_object(
                    'appointment_id', rec.id,
                    'reminder_hours', reminder_hour
                )
            );

            -- Mark reminder as sent
            UPDATE appointments
            SET reminder_sent_at = NOW()
            WHERE id = rec.id;

            appointment_count := appointment_count + 1;
        END LOOP;
    END LOOP;

    RETURN appointment_count;
END;
$$;

-- Schedule reminder job to run every hour
SELECT cron.schedule('appointment-reminders', '0 * * * *', 'SELECT send_appointment_reminders();');