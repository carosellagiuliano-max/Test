// Payment security utilities and error handling for Edge Functions
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Rate limiting storage (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export class SecurityError extends Error {
  constructor(message: string, public code: string, public statusCode: number = 403) {
    super(message);
    this.name = 'SecurityError';
  }
}

export class RateLimitError extends SecurityError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 'RATE_LIMIT_EXCEEDED', 429);
  }
}

export class InvalidSignatureError extends SecurityError {
  constructor(message: string = 'Invalid webhook signature') {
    super(message, 'INVALID_SIGNATURE', 401);
  }
}

/**
 * Rate limiting middleware for payment endpoints
 */
export function createRateLimiter(
  windowMs: number = 60000, // 1 minute window
  maxRequests: number = 10   // 10 requests per minute
) {
  return (identifier: string): void => {
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean up expired entries
    for (const [key, data] of rateLimitStore.entries()) {
      if (data.resetTime < now) {
        rateLimitStore.delete(key);
      }
    }

    const current = rateLimitStore.get(identifier);

    if (!current) {
      // First request in window
      rateLimitStore.set(identifier, {
        count: 1,
        resetTime: now + windowMs,
      });
      return;
    }

    if (current.resetTime < now) {
      // Window has expired, reset
      rateLimitStore.set(identifier, {
        count: 1,
        resetTime: now + windowMs,
      });
      return;
    }

    if (current.count >= maxRequests) {
      throw new RateLimitError(`Rate limit exceeded. Try again in ${Math.ceil((current.resetTime - now) / 1000)} seconds`);
    }

    // Increment counter
    current.count += 1;
  };
}

/**
 * Extract client identifier for rate limiting
 */
export function getClientIdentifier(request: Request): string {
  // Try to get authenticated user ID first
  const authHeader = request.headers.get('Authorization');
  if (authHeader) {
    try {
      // Extract user ID from JWT (simplified - in production use proper JWT parsing)
      const token = authHeader.replace('Bearer ', '');
      // This is a simplified approach - use proper JWT library in production
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.sub) {
        return `user:${payload.sub}`;
      }
    } catch {
      // Continue to IP-based identification
    }
  }

  // Fall back to IP address
  const forwarded = request.headers.get('x-forwarded-for');
  const cfConnecting = request.headers.get('cf-connecting-ip');
  const realIp = request.headers.get('x-real-ip');

  const ip = forwarded?.split(',')[0]?.trim() || cfConnecting || realIp || 'unknown';
  return `ip:${ip}`;
}

/**
 * Verify webhook signatures with constant-time comparison
 */
export async function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
  algorithm: 'sha256' | 'sha1' = 'sha256'
): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: `SHA-${algorithm === 'sha256' ? '256' : '1'}` },
      false,
      ['sign']
    );

    const signatureBytes = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
    const expectedSignature = Array.from(new Uint8Array(signatureBytes))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Handle different signature formats
    let providedSignature = signature;

    // Stripe format: "t=timestamp,v1=signature"
    if (signature.includes('v1=')) {
      const parts = signature.split(',');
      const v1Part = parts.find(part => part.startsWith('v1='));
      if (v1Part) {
        providedSignature = v1Part.substring(3);
      }
    }

    // SumUp format: "sha256=signature"
    if (signature.startsWith('sha256=')) {
      providedSignature = signature.substring(7);
    }

    // Use constant-time comparison
    return timingSafeEqual(expectedSignature, providedSignature);
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

/**
 * Verify Stripe webhook signature with timestamp validation
 */
export async function verifyStripeSignature(
  payload: string,
  signature: string,
  secret: string,
  toleranceSeconds: number = 300
): Promise<boolean> {
  try {
    // Parse signature
    const elements = signature.split(',');
    let timestamp: string | undefined;
    let v1Signature: string | undefined;

    for (const element of elements) {
      const [key, value] = element.split('=');
      if (key === 't') {
        timestamp = value;
      } else if (key === 'v1') {
        v1Signature = value;
      }
    }

    if (!timestamp || !v1Signature) {
      throw new InvalidSignatureError('Invalid signature format');
    }

    // Verify timestamp is within tolerance
    const now = Math.floor(Date.now() / 1000);
    const webhookTime = parseInt(timestamp, 10);

    if (Math.abs(now - webhookTime) > toleranceSeconds) {
      throw new InvalidSignatureError('Webhook timestamp too old');
    }

    // Verify signature
    const signedPayload = `${timestamp}.${payload}`;
    return await verifyWebhookSignature(signedPayload, v1Signature, secret);
  } catch (error) {
    if (error instanceof InvalidSignatureError) {
      throw error;
    }
    console.error('Stripe signature verification error:', error);
    return false;
  }
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Sanitize and validate request headers
 */
export function sanitizeHeaders(headers: Headers): Record<string, string> {
  const sanitized: Record<string, string> = {};
  const allowedHeaders = [
    'content-type',
    'authorization',
    'user-agent',
    'x-forwarded-for',
    'cf-connecting-ip',
    'stripe-signature',
    'x-sumup-signature',
    'idempotency-key',
  ];

  for (const [key, value] of headers.entries()) {
    const lowerKey = key.toLowerCase();
    if (allowedHeaders.includes(lowerKey)) {
      // Truncate excessively long headers
      sanitized[lowerKey] = value.length > 1000 ? value.substring(0, 1000) + '...' : value;
    }
  }

  return sanitized;
}

/**
 * Log security events for audit trail
 */
export async function logSecurityEvent(
  supabase: any,
  eventType: string,
  details: Record<string, any>,
  request: Request,
  severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
) {
  try {
    const clientId = getClientIdentifier(request);
    const headers = sanitizeHeaders(request.headers);

    await supabase
      .from('security_audit_log')
      .insert({
        event_type: eventType,
        severity,
        client_identifier: clientId,
        request_headers: headers,
        event_details: details,
        created_at: new Date().toISOString(),
      });
  } catch (error) {
    console.error('Failed to log security event:', error);
    // Don't throw - logging failure shouldn't break the main flow
  }
}

/**
 * Validate and sanitize payment amounts
 */
export function validatePaymentAmount(amount: number, currency: string = 'chf'): void {
  if (typeof amount !== 'number' || !Number.isInteger(amount)) {
    throw new SecurityError('Amount must be an integer', 'INVALID_AMOUNT', 400);
  }

  if (amount <= 0) {
    throw new SecurityError('Amount must be positive', 'INVALID_AMOUNT', 400);
  }

  // Swiss Franc limits (in cents)
  const MAX_AMOUNT_CHF = 50000000; // 500,000 CHF
  const MIN_AMOUNT_CHF = 100;      // 1.00 CHF

  if (currency.toLowerCase() === 'chf') {
    if (amount > MAX_AMOUNT_CHF) {
      throw new SecurityError('Amount exceeds maximum limit', 'AMOUNT_TOO_HIGH', 400);
    }

    if (amount < MIN_AMOUNT_CHF) {
      throw new SecurityError('Amount below minimum limit', 'AMOUNT_TOO_LOW', 400);
    }
  }
}

/**
 * Create secure response with proper headers
 */
export function createSecureResponse(
  data: any,
  status: number = 200,
  additionalHeaders: Record<string, string> = {}
): Response {
  const headers = {
    'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    ...additionalHeaders,
  };

  return new Response(JSON.stringify(data), {
    status,
    headers,
  });
}

/**
 * Error handler middleware
 */
export function handleError(error: Error): Response {
  console.error('Payment API Error:', error);

  // Security errors
  if (error instanceof SecurityError) {
    return createSecureResponse(
      {
        error: error.message,
        code: error.code,
      },
      error.statusCode
    );
  }

  // Validation errors
  if (error.name === 'ValidationError') {
    return createSecureResponse(
      {
        error: error.message,
        code: 'VALIDATION_ERROR',
      },
      400
    );
  }

  // Provider errors (Stripe, SumUp)
  if (error.name === 'ProviderError') {
    return createSecureResponse(
      {
        error: 'Payment provider error',
        code: 'PROVIDER_ERROR',
      },
      502
    );
  }

  // Default error response (don't expose internal details)
  return createSecureResponse(
    {
      error: 'An internal error occurred',
      code: 'INTERNAL_ERROR',
    },
    500
  );
}

/**
 * Middleware to validate authentication and apply rate limiting
 */
export async function withSecurity(
  request: Request,
  handler: (request: Request) => Promise<Response>,
  options: {
    requireAuth?: boolean;
    rateLimitWindow?: number;
    rateLimitMax?: number;
  } = {}
): Promise<Response> {
  const {
    requireAuth = true,
    rateLimitWindow = 60000,
    rateLimitMax = 10,
  } = options;

  try {
    // Apply rate limiting
    const clientId = getClientIdentifier(request);
    const rateLimiter = createRateLimiter(rateLimitWindow, rateLimitMax);
    rateLimiter(clientId);

    // Validate authentication if required
    if (requireAuth) {
      const authHeader = request.headers.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new SecurityError('Missing or invalid authorization header', 'UNAUTHORIZED', 401);
      }
    }

    // Call the actual handler
    return await handler(request);

  } catch (error) {
    // Log security events
    if (error instanceof SecurityError) {
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      await logSecurityEvent(
        supabaseAdmin,
        error.code,
        { message: error.message, statusCode: error.statusCode },
        request,
        error.statusCode >= 400 ? 'high' : 'medium'
      );
    }

    return handleError(error as Error);
  }
}

/**
 * Database connection with security context
 */
export function createSecureSupabaseClient(authHeader?: string) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');

  if (!supabaseUrl || !supabaseKey) {
    throw new SecurityError('Database configuration missing', 'CONFIG_ERROR', 500);
  }

  if (authHeader) {
    return createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: { Authorization: authHeader },
      },
    });
  }

  // Return admin client for webhook handlers
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!serviceRoleKey) {
    throw new SecurityError('Service role key missing', 'CONFIG_ERROR', 500);
  }

  return createClient(supabaseUrl, serviceRoleKey);
}