# Deployment Guide - Coiffeur Platform

## Overview

This document provides comprehensive deployment procedures for the Coiffeur Platform, including CI/CD pipeline configuration, environment management, and deployment strategies.

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   GitHub Repo   │    │   GitHub Actions │    │    Netlify      │
│                 │───▶│                 │───▶│                 │
│  Source Code    │    │   CI/CD Pipeline │    │  Static Hosting │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │    Supabase     │
                       │                 │
                       │  Database +     │
                       │  Edge Functions │
                       └─────────────────┘
```

## Environments

### Development

**Purpose**: Local development and testing
**URL**: http://localhost:3000
**Database**: Local Supabase instance
**Payment**: Test mode with mock providers

**Setup**:
```bash
# Clone repository
git clone https://github.com/your-org/coiffeur-platform.git
cd coiffeur-platform

# Install dependencies
pnpm install

# Start local Supabase
pnpm db:start

# Run migrations
pnpm db:reset

# Start development server
pnpm dev
```

### Staging

**Purpose**: Pre-production testing and QA
**URL**: https://staging--coiffeur-platform.netlify.app
**Database**: Staging Supabase project
**Payment**: Test mode with real providers

**Configuration**:
```env
NODE_ENV=staging
NEXT_PUBLIC_SUPABASE_URL=https://staging-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=staging-anon-key
STRIPE_SECRET_KEY=sk_test_staging_key
SUMUP_API_KEY=staging_sumup_key
SENTRY_DSN=https://staging@sentry.io/project
```

### Production

**Purpose**: Live customer-facing environment
**URL**: https://coiffeur-platform.ch
**Database**: Production Supabase project
**Payment**: Live mode with real transactions

**Configuration**:
```env
NODE_ENV=production
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=prod-anon-key
STRIPE_SECRET_KEY=sk_live_prod_key
SUMUP_API_KEY=live_sumup_key
SENTRY_DSN=https://prod@sentry.io/project
```

## CI/CD Pipeline

### Workflow Overview

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   PR Created│───▶│  Code Quality│───▶│    Tests    │───▶│   Build     │
│             │    │   • Lint    │    │  • Unit     │    │ Verification│
│             │    │   • Format  │    │  • Integration│    │             │
│             │    │   • Types   │    │  • E2E      │    │             │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                                                                  │
┌─────────────┐    ┌─────────────┐    ┌─────────────┐            │
│  Monitoring │◀───│  Production │◀───│ Deployment  │◀───────────┘
│   Setup     │    │   Deploy    │    │ to Staging  │
└─────────────┘    └─────────────┘    └─────────────┘
```

### GitHub Actions Workflows

**1. CI Pipeline** (`.github/workflows/ci.yml`)
- Triggered on: PR creation, pushes to main/develop
- Jobs: Code quality, tests, security audit, build verification

**2. Deployment Pipeline** (`.github/workflows/deploy.yml`)
- Triggered on: Pushes to main, manual dispatch
- Jobs: Pre-deployment checks, Supabase deployment, Netlify deployment, post-deployment tests

**3. Release Pipeline** (`.github/workflows/release.yml`)
- Triggered on: Version tags
- Jobs: Release creation, changelog generation, artifact publishing

### Pipeline Stages

#### Stage 1: Code Quality
```yaml
jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - name: ESLint
        run: pnpm lint
      - name: TypeScript
        run: pnpm type-check
      - name: Formatting
        run: pnpm format:check
```

#### Stage 2: Testing
```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      supabase:
        image: supabase/supabase:latest
    steps:
      - name: Unit Tests
        run: pnpm test:coverage
      - name: Integration Tests
        run: pnpm test:integration
```

#### Stage 3: E2E Testing
```yaml
jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - name: Install Playwright
        run: pnpm playwright install
      - name: Run E2E Tests
        run: pnpm test:e2e
```

#### Stage 4: Build Verification
```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Build Application
        run: pnpm build
      - name: Upload Artifacts
        uses: actions/upload-artifact@v3
```

#### Stage 5: Deployment
```yaml
jobs:
  deploy:
    needs: [quality, test, e2e, build]
    environment: production
    steps:
      - name: Deploy Supabase
        run: supabase functions deploy
      - name: Deploy Netlify
        uses: nwtgck/actions-netlify@v2.1
```

## Deployment Strategies

### Continuous Deployment (Main Branch)

**Trigger**: Every push to main branch
**Process**:
1. Automated testing
2. Build verification
3. Deploy to staging
4. Run smoke tests
5. Deploy to production
6. Monitor deployment

**Safeguards**:
- All tests must pass
- Manual approval for production (optional)
- Automatic rollback on failure
- Health checks after deployment

### Manual Deployment

**Trigger**: Manual workflow dispatch
**Use Cases**:
- Emergency fixes
- Scheduled maintenance
- Feature flag toggles

**Process**:
```bash
# Via GitHub UI
1. Go to Actions tab
2. Select "Deploy to Production"
3. Click "Run workflow"
4. Select environment and options
5. Confirm deployment
```

### Blue-Green Deployment (Advanced)

**Benefits**:
- Zero-downtime deployments
- Instant rollback capability
- Production-like testing environment

**Implementation** (Future Enhancement):
```yaml
# Blue-Green deployment strategy
deploy-green:
  steps:
    - name: Deploy to Green Environment
      run: deploy-to-green.sh
    - name: Run Health Checks
      run: health-check-green.sh
    - name: Switch Traffic
      run: switch-to-green.sh
```

## Environment Configuration

### Secrets Management

**GitHub Secrets**:
```
# Production Secrets
NETLIFY_AUTH_TOKEN=***
NETLIFY_SITE_ID=***
SUPABASE_ACCESS_TOKEN=***
SUPABASE_PROJECT_ID=***
STRIPE_SECRET_KEY=***
SUMUP_API_KEY=***
SENTRY_DSN=***
SENTRY_AUTH_TOKEN=***

# Notification Secrets
SLACK_WEBHOOK_URL=***

# Staging Secrets (prefixed with STAGING_)
STAGING_NETLIFY_SITE_ID=***
STAGING_SUPABASE_PROJECT_ID=***
```

**Environment Variables**:
```bash
# Netlify Environment Variables
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=https://coiffeur-platform.ch
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_***
NODE_ENV=production
```

### Configuration Management

**Environment-Specific Config**:
```typescript
// config/environments.ts
export const config = {
  development: {
    api: {
      supabase: {
        url: 'http://localhost:54321',
        anonKey: 'local-anon-key'
      }
    }
  },
  staging: {
    api: {
      supabase: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      }
    }
  },
  production: {
    api: {
      supabase: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      }
    }
  }
}
```

## Database Deployment

### Migration Strategy

**Development**:
```bash
# Create new migration
pnpm db:migration "add_new_feature"

# Apply migrations locally
pnpm db:reset
```

**Staging/Production**:
```bash
# Automated via CI/CD
supabase db push --linked

# Manual deployment (emergency)
supabase link --project-ref $PROJECT_ID
supabase db push
```

### Migration Best Practices

**Safe Migrations**:
- Always additive (add columns, don't remove)
- Use transactions for multi-step changes
- Test migrations on staging first
- Include rollback procedures

**Example Migration**:
```sql
-- migrations/20241001_add_appointment_notes.sql
BEGIN;

-- Add new column (safe operation)
ALTER TABLE appointments
ADD COLUMN notes TEXT;

-- Add index for performance
CREATE INDEX CONCURRENTLY idx_appointments_notes
ON appointments(notes)
WHERE notes IS NOT NULL;

COMMIT;
```

### Edge Function Deployment

**Automatic Deployment**:
```yaml
# In deploy.yml
- name: Deploy Edge Functions
  run: |
    supabase functions deploy book-appointment
    supabase functions deploy booking-availability
    supabase functions deploy payment-process
```

**Manual Deployment**:
```bash
# Deploy all functions
supabase functions deploy

# Deploy specific function
supabase functions deploy book-appointment

# Deploy with environment variables
supabase functions deploy --env-file .env.production
```

## Netlify Configuration

### Build Settings

**Build Command**: `pnpm build`
**Publish Directory**: `apps/web/.next`
**Node Version**: `18`

### Build Configuration

```toml
# netlify.toml
[build]
  publish = "apps/web/.next"
  command = "pnpm build"

[build.environment]
  NODE_VERSION = "18"
  NPM_FLAGS = "--version"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[[headers]]
  for = "/_next/static/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/api/*"
  [headers.values]
    Cache-Control = "no-cache"
```

### Deploy Hooks

**Production Deploy Hook**:
```bash
# Trigger deployment via webhook
curl -X POST https://api.netlify.com/build_hooks/YOUR_HOOK_ID
```

**Branch Deploy Configuration**:
```toml
[context.staging]
  command = "pnpm build:staging"

[context.branch-deploy]
  command = "pnpm build"
```

## Monitoring & Health Checks

### Health Check Endpoints

**Application Health**:
```typescript
// pages/api/health.ts
export default function handler(req, res) {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version
  })
}
```

**Database Health**:
```typescript
// pages/api/health/database.ts
export default async function handler(req, res) {
  try {
    const { data, error } = await supabase
      .from('health_check')
      .select('*')
      .limit(1)

    if (error) throw error

    res.status(200).json({ status: 'healthy' })
  } catch (error) {
    res.status(500).json({ status: 'unhealthy', error })
  }
}
```

### Deployment Monitoring

**Sentry Release Tracking**:
```bash
# Automatic release creation
curl -X POST \
  https://sentry.io/api/0/organizations/your-org/releases/ \
  -H "Authorization: Bearer $SENTRY_AUTH_TOKEN" \
  -d '{"version": "$RELEASE_VERSION"}'
```

**Slack Notifications**:
```yaml
# Successful deployment notification
- name: Notify Success
  uses: 8398a7/action-slack@v3
  with:
    status: success
    channel: '#deployments'
    text: '🚀 Deployment successful'
```

## Rollback Procedures

### Automatic Rollback

**Trigger Conditions**:
- Health check failures
- Error rate > 5%
- Response time > 5 seconds
- Critical test failures

**Implementation**:
```yaml
# Automatic rollback on failure
- name: Health Check
  run: |
    if ! curl -f $PRODUCTION_URL/api/health; then
      echo "Health check failed, rolling back..."
      exit 1
    fi

# On failure, rollback job runs
rollback:
  if: failure()
  steps:
    - name: Rollback Netlify
      run: |
        # Revert to previous deploy
        netlify api updateSite --data '{"published_deploy_id": "$PREVIOUS_DEPLOY_ID"}'
```

### Manual Rollback

**Database Rollback**:
```bash
# Restore from backup
supabase db reset --restore-from backup-20241001.sql

# Or point-in-time recovery
supabase db restore --time "2024-10-01 10:00:00"
```

**Application Rollback**:
```bash
# Via Netlify Dashboard
1. Go to Site Deploys
2. Find previous successful deploy
3. Click "Publish deploy"

# Via CLI
netlify deploy --prod --dir=previous-build/
```

## Security Considerations

### Deployment Security

**Access Controls**:
- GitHub branch protection rules
- Required status checks
- Restricted push access
- Environment protection rules

**Secret Management**:
- Encrypted GitHub secrets
- Least privilege access
- Regular secret rotation
- Audit logging

### Environment Isolation

**Network Isolation**:
- Separate Supabase projects per environment
- Different API keys per environment
- Isolated database instances

**Data Protection**:
- No production data in staging
- Anonymized test data
- GDPR-compliant data handling

## Troubleshooting

### Common Deployment Issues

#### Build Failures

**Symptoms**: Build process exits with error
**Causes**:
- TypeScript errors
- Missing dependencies
- Environment variable issues

**Resolution**:
```bash
# Check build locally
pnpm build

# Verify environment variables
env | grep NEXT_PUBLIC

# Check for TypeScript errors
pnpm type-check
```

#### Deployment Failures

**Symptoms**: Deployment process fails
**Causes**:
- Invalid Netlify configuration
- Supabase connection issues
- Missing secrets

**Resolution**:
```bash
# Check Netlify deploy logs
netlify logs

# Verify Supabase connection
supabase status

# Test with staging environment first
```

#### Post-Deployment Issues

**Symptoms**: Site loads but features broken
**Causes**:
- Environment variable misconfiguration
- Database migration issues
- Third-party service issues

**Resolution**:
```bash
# Check application logs
netlify functions:log

# Verify database state
supabase db status

# Test API endpoints
curl -f $PRODUCTION_URL/api/health
```

### Emergency Procedures

#### Complete Outage

1. **Immediate Response**:
   - Roll back to last known good deployment
   - Post status update
   - Notify team via Slack

2. **Investigation**:
   - Check monitoring dashboards
   - Review recent changes
   - Analyze error logs

3. **Communication**:
   - Update status page
   - Notify customers if needed
   - Provide ETA for resolution

#### Database Issues

1. **Assessment**:
   - Check Supabase dashboard
   - Review recent migrations
   - Assess data integrity

2. **Recovery**:
   - Point-in-time recovery if needed
   - Roll back problematic migrations
   - Verify data consistency

3. **Prevention**:
   - Review migration process
   - Improve testing procedures
   - Update backup strategy

## Performance Optimization

### Build Optimization

**Bundle Analysis**:
```bash
# Analyze bundle size
pnpm build
pnpm bundle-analyzer

# Check for unnecessary dependencies
npx depcheck
```

**Build Caching**:
```yaml
# GitHub Actions cache
- name: Cache dependencies
  uses: actions/cache@v3
  with:
    path: ~/.pnpm-store
    key: ${{ runner.os }}-pnpm-${{ hashFiles('**/pnpm-lock.yaml') }}
```

### Runtime Optimization

**CDN Configuration**:
```toml
# netlify.toml
[[headers]]
  for = "/_next/static/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/images/*"
  [headers.values]
    Cache-Control = "public, max-age=86400"
```

**Image Optimization**:
```typescript
// next.config.js
module.exports = {
  images: {
    domains: ['your-project.supabase.co'],
    formats: ['image/webp', 'image/avif']
  }
}
```

## Compliance & Auditing

### Swiss Data Protection

**Data Residency**:
- Supabase EU region deployment
- Netlify EU edge locations
- GDPR-compliant data processing

**Audit Trail**:
- All deployments logged
- Access controls documented
- Change history maintained

### Financial Compliance

**Transaction Logging**:
- All payments tracked
- VAT calculations audited
- Financial reports generated

**Backup Requirements**:
- 10-year data retention
- Immutable backup storage
- Regular recovery testing

---

**Document Version**: 1.0
**Last Updated**: October 2024
**Next Review**: January 2025
**Owner**: DevOps Team