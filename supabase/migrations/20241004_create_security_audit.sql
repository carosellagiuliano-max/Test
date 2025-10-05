-- Create security audit tables for payment system

-- Security audit log table
CREATE TABLE security_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    client_identifier TEXT NOT NULL,
    request_headers JSONB,
    event_details JSONB NOT NULL,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Rate limiting tracking (alternative to in-memory storage)
CREATE TABLE rate_limit_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_identifier TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    request_count INTEGER NOT NULL DEFAULT 1,
    window_start TIMESTAMPTZ NOT NULL,
    window_end TIMESTAMPTZ NOT NULL,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Unique constraint for tracking windows
    CONSTRAINT rate_limit_tracking_unique UNIQUE (client_identifier, endpoint, window_start)
);

-- Failed authentication attempts
CREATE TABLE auth_failures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_identifier TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    failure_reason TEXT NOT NULL,
    headers JSONB,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Suspicious activity tracking
CREATE TABLE suspicious_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_identifier TEXT NOT NULL,
    activity_type TEXT NOT NULL,
    risk_score INTEGER NOT NULL CHECK (risk_score BETWEEN 1 AND 100),
    details JSONB NOT NULL,
    resolved BOOLEAN NOT NULL DEFAULT FALSE,

    -- Response actions
    action_taken TEXT,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_security_audit_log_event_type ON security_audit_log(event_type);
CREATE INDEX idx_security_audit_log_severity ON security_audit_log(severity);
CREATE INDEX idx_security_audit_log_client_id ON security_audit_log(client_identifier);
CREATE INDEX idx_security_audit_log_created_at ON security_audit_log(created_at);

CREATE INDEX idx_rate_limit_tracking_client_endpoint ON rate_limit_tracking(client_identifier, endpoint);
CREATE INDEX idx_rate_limit_tracking_window_end ON rate_limit_tracking(window_end);

CREATE INDEX idx_auth_failures_client_id ON auth_failures(client_identifier);
CREATE INDEX idx_auth_failures_created_at ON auth_failures(created_at);

CREATE INDEX idx_suspicious_activity_client_id ON suspicious_activity(client_identifier);
CREATE INDEX idx_suspicious_activity_resolved ON suspicious_activity(resolved);
CREATE INDEX idx_suspicious_activity_risk_score ON suspicious_activity(risk_score);
CREATE INDEX idx_suspicious_activity_created_at ON suspicious_activity(created_at);

-- Trigger for automatic timestamp updates
CREATE TRIGGER update_rate_limit_tracking_updated_at
    BEFORE UPDATE ON rate_limit_tracking
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suspicious_activity_updated_at
    BEFORE UPDATE ON suspicious_activity
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up old rate limit records
CREATE OR REPLACE FUNCTION cleanup_rate_limit_tracking()
RETURNS void AS $$
BEGIN
    DELETE FROM rate_limit_tracking
    WHERE window_end < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old audit logs (keep 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS void AS $$
BEGIN
    DELETE FROM security_audit_log
    WHERE created_at < NOW() - INTERVAL '90 days';

    DELETE FROM auth_failures
    WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Function to calculate risk score based on recent activity
CREATE OR REPLACE FUNCTION calculate_risk_score(p_client_identifier TEXT)
RETURNS INTEGER AS $$
DECLARE
    auth_failures_count INTEGER;
    recent_payment_failures INTEGER;
    high_severity_events INTEGER;
    base_score INTEGER := 10;
    risk_score INTEGER;
BEGIN
    -- Count authentication failures in last hour
    SELECT COUNT(*) INTO auth_failures_count
    FROM auth_failures
    WHERE client_identifier = p_client_identifier
    AND created_at > NOW() - INTERVAL '1 hour';

    -- Count payment failures in last 24 hours
    SELECT COUNT(*) INTO recent_payment_failures
    FROM payment_audit_log
    WHERE event_type IN ('payment_failed', 'payment_cancelled')
    AND created_at > NOW() - INTERVAL '24 hours'
    AND event_data->>'client_identifier' = p_client_identifier;

    -- Count high severity security events in last 24 hours
    SELECT COUNT(*) INTO high_severity_events
    FROM security_audit_log
    WHERE client_identifier = p_client_identifier
    AND severity IN ('high', 'critical')
    AND created_at > NOW() - INTERVAL '24 hours';

    -- Calculate risk score
    risk_score := base_score
                + (auth_failures_count * 20)
                + (recent_payment_failures * 10)
                + (high_severity_events * 30);

    -- Cap at 100
    RETURN LEAST(risk_score, 100);
END;
$$ LANGUAGE plpgsql;

-- Function to detect suspicious patterns
CREATE OR REPLACE FUNCTION detect_suspicious_activity(p_client_identifier TEXT)
RETURNS void AS $$
DECLARE
    risk_score INTEGER;
    activity_record RECORD;
BEGIN
    -- Calculate current risk score
    SELECT calculate_risk_score(p_client_identifier) INTO risk_score;

    -- Only proceed if risk score is concerning
    IF risk_score < 50 THEN
        RETURN;
    END IF;

    -- Check if we already have an unresolved suspicious activity record
    SELECT * INTO activity_record
    FROM suspicious_activity
    WHERE client_identifier = p_client_identifier
    AND resolved = FALSE
    ORDER BY created_at DESC
    LIMIT 1;

    IF activity_record.id IS NOT NULL THEN
        -- Update existing record if risk score increased
        IF risk_score > activity_record.risk_score THEN
            UPDATE suspicious_activity
            SET
                risk_score = risk_score,
                details = jsonb_set(
                    details,
                    '{risk_increase}',
                    to_jsonb(risk_score - activity_record.risk_score)
                ),
                updated_at = NOW()
            WHERE id = activity_record.id;
        END IF;
    ELSE
        -- Create new suspicious activity record
        INSERT INTO suspicious_activity (
            client_identifier,
            activity_type,
            risk_score,
            details
        ) VALUES (
            p_client_identifier,
            'high_risk_pattern',
            risk_score,
            jsonb_build_object(
                'detected_at', NOW(),
                'risk_factors', jsonb_build_object(
                    'auth_failures', (SELECT COUNT(*) FROM auth_failures
                                    WHERE client_identifier = p_client_identifier
                                    AND created_at > NOW() - INTERVAL '1 hour'),
                    'payment_failures', (SELECT COUNT(*) FROM payment_audit_log
                                        WHERE event_type IN ('payment_failed', 'payment_cancelled')
                                        AND created_at > NOW() - INTERVAL '24 hours'
                                        AND event_data->>'client_identifier' = p_client_identifier),
                    'security_events', (SELECT COUNT(*) FROM security_audit_log
                                      WHERE client_identifier = p_client_identifier
                                      AND severity IN ('high', 'critical')
                                      AND created_at > NOW() - INTERVAL '24 hours')
                )
            )
        );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security for security tables
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_failures ENABLE ROW LEVEL SECURITY;
ALTER TABLE suspicious_activity ENABLE ROW LEVEL SECURITY;

-- Policies (admin access only for security tables)
CREATE POLICY "Admin access only" ON security_audit_log
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin access only" ON rate_limit_tracking
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin access only" ON auth_failures
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin access only" ON suspicious_activity
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Grant permissions to service role
GRANT ALL ON security_audit_log TO service_role;
GRANT ALL ON rate_limit_tracking TO service_role;
GRANT ALL ON auth_failures TO service_role;
GRANT ALL ON suspicious_activity TO service_role;