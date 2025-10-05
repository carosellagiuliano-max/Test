-- Create comprehensive payment system tables with Swiss compliance

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types for payment system
CREATE TYPE payment_provider AS ENUM ('stripe', 'sumup');
CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded');
CREATE TYPE vat_rate_type AS ENUM ('STANDARD', 'REDUCED', 'SPECIAL');
CREATE TYPE stock_reservation_status AS ENUM ('active', 'completed', 'expired', 'cancelled');
CREATE TYPE audit_event_type AS ENUM (
    'checkout_session_created',
    'payment_intent_created',
    'payment_completed',
    'payment_failed',
    'payment_cancelled',
    'refund_initiated',
    'refund_completed',
    'sumup_checkout_created',
    'checkout_status_changed',
    'stock_reserved',
    'stock_released'
);

-- Payments table - Central payment tracking
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID NOT NULL,
    customer_id UUID NOT NULL,
    provider payment_provider NOT NULL,
    amount INTEGER NOT NULL, -- Amount in cents (Swiss Rappen)
    currency TEXT NOT NULL DEFAULT 'chf',
    status payment_status NOT NULL DEFAULT 'pending',

    -- Idempotency and tracking
    idempotency_key TEXT UNIQUE,

    -- Stripe specific fields
    stripe_session_id TEXT,
    stripe_payment_intent_id TEXT,
    stripe_customer_id TEXT,

    -- SumUp specific fields
    sumup_checkout_id TEXT,
    sumup_checkout_reference TEXT,
    sumup_transaction_id TEXT,

    -- Payment data and metadata
    payment_data JSONB,
    metadata JSONB,

    -- Error handling
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    paid_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,

    -- Constraints
    CONSTRAINT payments_amount_positive CHECK (amount > 0),
    CONSTRAINT payments_currency_valid CHECK (currency IN ('chf', 'eur', 'usd')),
    CONSTRAINT payments_stripe_session_unique UNIQUE (stripe_session_id),
    CONSTRAINT payments_sumup_checkout_unique UNIQUE (sumup_checkout_id)
);

-- VAT breakdown table for Swiss compliance
CREATE TABLE payment_vat_breakdown (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    service_id UUID,
    service_name TEXT NOT NULL,
    base_amount INTEGER NOT NULL, -- Amount before VAT in cents
    vat_rate vat_rate_type NOT NULL,
    vat_amount INTEGER NOT NULL, -- VAT amount in cents
    total_amount INTEGER NOT NULL, -- Total including VAT

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT vat_amounts_positive CHECK (base_amount > 0 AND vat_amount >= 0 AND total_amount > 0),
    CONSTRAINT vat_total_correct CHECK (total_amount = base_amount + vat_amount)
);

-- Stock reservations for in-store payments
CREATE TABLE stock_reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID NOT NULL,
    appointment_id UUID NOT NULL,
    customer_id UUID NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    status stock_reservation_status NOT NULL DEFAULT 'active',

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    expired_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,

    -- Constraints
    CONSTRAINT stock_quantity_positive CHECK (quantity > 0)
);

-- Payment audit log for compliance and debugging
CREATE TABLE payment_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
    event_type audit_event_type NOT NULL,
    provider payment_provider NOT NULL,
    event_data JSONB NOT NULL,

    -- User tracking
    created_by UUID,
    ip_address INET,
    user_agent TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Webhook events for deduplication
CREATE TABLE webhook_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider payment_provider NOT NULL,
    event_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    processed BOOLEAN NOT NULL DEFAULT FALSE,
    event_data JSONB NOT NULL,

    -- Processing info
    processed_at TIMESTAMPTZ,
    retry_count INTEGER DEFAULT 0,
    error_message TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Unique constraint for deduplication
    CONSTRAINT webhook_events_provider_event_unique UNIQUE (provider, event_id)
);

-- Refunds table
CREATE TABLE refunds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
    provider payment_provider NOT NULL,
    amount INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'chf',
    reason TEXT,
    status payment_status NOT NULL DEFAULT 'pending',

    -- Provider specific fields
    stripe_refund_id TEXT,
    sumup_refund_id TEXT,
    transaction_id TEXT,

    -- Refund data
    refund_data JSONB,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    refunded_at TIMESTAMPTZ,

    -- Constraints
    CONSTRAINT refunds_amount_positive CHECK (amount > 0)
);

-- Subscription payments for recurring billing
CREATE TABLE subscription_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stripe_subscription_id TEXT NOT NULL,
    stripe_invoice_id TEXT NOT NULL,
    customer_id UUID,
    amount INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'chf',
    status payment_status NOT NULL DEFAULT 'pending',

    -- Billing period
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    paid_at TIMESTAMPTZ,

    -- Constraints
    CONSTRAINT subscription_payments_amount_positive CHECK (amount > 0),
    CONSTRAINT subscription_payments_period_valid CHECK (period_end > period_start)
);

-- Subscriptions table
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stripe_subscription_id TEXT UNIQUE NOT NULL,
    stripe_customer_id TEXT NOT NULL,
    customer_id UUID,
    status TEXT NOT NULL,

    -- Subscription period
    current_period_start TIMESTAMPTZ NOT NULL,
    current_period_end TIMESTAMPTZ NOT NULL,
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,

    -- Metadata
    metadata JSONB,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_payments_appointment_id ON payments(appointment_id);
CREATE INDEX idx_payments_customer_id ON payments(customer_id);
CREATE INDEX idx_payments_provider_status ON payments(provider, status);
CREATE INDEX idx_payments_created_at ON payments(created_at);
CREATE INDEX idx_payments_stripe_session_id ON payments(stripe_session_id) WHERE stripe_session_id IS NOT NULL;
CREATE INDEX idx_payments_sumup_checkout_id ON payments(sumup_checkout_id) WHERE sumup_checkout_id IS NOT NULL;

CREATE INDEX idx_vat_breakdown_payment_id ON payment_vat_breakdown(payment_id);

CREATE INDEX idx_stock_reservations_service_id ON stock_reservations(service_id);
CREATE INDEX idx_stock_reservations_appointment_id ON stock_reservations(appointment_id);
CREATE INDEX idx_stock_reservations_expires_at ON stock_reservations(expires_at);
CREATE INDEX idx_stock_reservations_status ON stock_reservations(status);

CREATE INDEX idx_audit_log_payment_id ON payment_audit_log(payment_id);
CREATE INDEX idx_audit_log_created_at ON payment_audit_log(created_at);
CREATE INDEX idx_audit_log_event_type ON payment_audit_log(event_type);

CREATE INDEX idx_webhook_events_provider_processed ON webhook_events(provider, processed);
CREATE INDEX idx_webhook_events_created_at ON webhook_events(created_at);

CREATE INDEX idx_refunds_payment_id ON refunds(payment_id);
CREATE INDEX idx_refunds_created_at ON refunds(created_at);

-- Triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_refunds_updated_at BEFORE UPDATE ON refunds
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically expire stock reservations
CREATE OR REPLACE FUNCTION expire_stock_reservations()
RETURNS void AS $$
BEGIN
    UPDATE stock_reservations
    SET
        status = 'expired',
        expired_at = NOW()
    WHERE
        status = 'active'
        AND expires_at <= NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to calculate Swiss VAT
CREATE OR REPLACE FUNCTION calculate_swiss_vat(base_amount INTEGER, vat_rate vat_rate_type)
RETURNS INTEGER AS $$
BEGIN
    RETURN CASE vat_rate
        WHEN 'STANDARD' THEN ROUND(base_amount * 0.081)
        WHEN 'REDUCED' THEN ROUND(base_amount * 0.026)
        WHEN 'SPECIAL' THEN ROUND(base_amount * 0.038)
        ELSE 0
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Row Level Security (RLS) policies
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_vat_breakdown ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;

-- Payments policies
CREATE POLICY "Users can view their own payments" ON payments
    FOR SELECT USING (customer_id = auth.uid());

CREATE POLICY "Users can create payments for themselves" ON payments
    FOR INSERT WITH CHECK (customer_id = auth.uid());

-- VAT breakdown policies
CREATE POLICY "Users can view VAT breakdown for their payments" ON payment_vat_breakdown
    FOR SELECT USING (
        payment_id IN (
            SELECT id FROM payments WHERE customer_id = auth.uid()
        )
    );

-- Stock reservations policies
CREATE POLICY "Users can view their own reservations" ON stock_reservations
    FOR SELECT USING (customer_id = auth.uid());

CREATE POLICY "Users can create reservations for themselves" ON stock_reservations
    FOR INSERT WITH CHECK (customer_id = auth.uid());

-- Payment audit log policies (read-only for users)
CREATE POLICY "Users can view audit logs for their payments" ON payment_audit_log
    FOR SELECT USING (
        payment_id IN (
            SELECT id FROM payments WHERE customer_id = auth.uid()
        )
    );

-- Refunds policies
CREATE POLICY "Users can view refunds for their payments" ON refunds
    FOR SELECT USING (
        payment_id IN (
            SELECT id FROM payments WHERE customer_id = auth.uid()
        )
    );

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;