# 🚀 Production Deployment Checklist

## Pre-Deployment Requirements

### 1. ✅ Supabase Setup
- [ ] Create production Supabase project at https://supabase.com
- [ ] Note down the project ID and region
- [ ] Configure authentication providers
- [ ] Enable Row Level Security on all tables
- [ ] Set up database backups

### 2. ✅ Payment Providers
#### Stripe
- [ ] Create Stripe account at https://stripe.com
- [ ] Switch to live mode
- [ ] Get live API keys (publishable and secret)
- [ ] Configure webhook endpoint: `https://coiffeur-platform.ch/api/stripe-webhook`
- [ ] Add webhook signing secret to environment variables

#### SumUp
- [ ] Create SumUp merchant account
- [ ] Get production API credentials
- [ ] Configure webhook URL: `https://coiffeur-platform.ch/api/sumup-webhook`
- [ ] Test payment flow with real card

### 3. ✅ Netlify Setup
- [ ] Create Netlify account at https://netlify.com
- [ ] Create new site from Git
- [ ] Connect to GitHub repository
- [ ] Configure build settings:
  - Build command: `pnpm install && pnpm build`
  - Publish directory: `apps/web/.next`
  - Node version: 18

### 4. ✅ Domain Configuration
- [ ] Purchase domain (coiffeur-platform.ch)
- [ ] Configure DNS settings in Netlify
- [ ] Set up SSL certificate (automatic in Netlify)
- [ ] Configure email records (SPF, DKIM, DMARC)

## Environment Variables Setup

### Step 1: Copy Production Template
```bash
cp .env.production .env.production.local
```

### Step 2: Configure Supabase Variables
```bash
# Get these from Supabase Dashboard > Settings > API
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
SUPABASE_PROJECT_ID=YOUR_PROJECT_ID
```

### Step 3: Configure Payment Variables
```bash
# Stripe (from Stripe Dashboard)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# SumUp (from SumUp Dashboard)
SUMUP_APP_ID=...
SUMUP_APP_SECRET=...
SUMUP_AFFILIATE_KEY=...
```

### Step 4: Add to Netlify Dashboard
1. Go to Site Settings > Environment Variables
2. Add all variables from `.env.production.local`
3. Save and trigger deploy

## Database Deployment

### Step 1: Link Local to Production
```bash
# Install Supabase CLI if not installed
npm install -g supabase

# Link to production project
supabase link --project-ref YOUR_PROJECT_ID

# Login if needed
supabase login
```

### Step 2: Push Database Schema
```bash
# Push all migrations to production
supabase db push

# Verify migrations
supabase db status
```

### Step 3: Deploy Edge Functions
```bash
# Deploy all edge functions
supabase functions deploy

# Or deploy individually
supabase functions deploy book-appointment
supabase functions deploy stripe-webhook
supabase functions deploy sumup-webhook
```

### Step 4: Seed Initial Data (Optional)
```bash
# Connect to production database
supabase db reset --db-url postgresql://...

# Or run seed script
node scripts/seed-production.js
```

## GitHub Secrets Configuration

### Add these secrets to GitHub repository:
1. Go to Settings > Secrets and variables > Actions
2. Add the following secrets:

```yaml
NETLIFY_AUTH_TOKEN        # From Netlify user settings
NETLIFY_SITE_ID          # From Netlify site settings
SUPABASE_ACCESS_TOKEN    # From Supabase account settings
SUPABASE_PROJECT_ID      # Your production project ID
STRIPE_SECRET_KEY        # Live Stripe key
SUMUP_API_KEY           # Production SumUp key
SENTRY_DSN              # From Sentry project settings
SENTRY_AUTH_TOKEN       # For source map uploads
```

## Deployment Commands

### Initial Deployment
```bash
# 1. Ensure all tests pass
pnpm qa:pre-deploy

# 2. Create production build
pnpm build:prod

# 3. Deploy to staging first
pnpm deploy:staging

# 4. Test staging deployment
# Visit: https://staging--coiffeur-platform.netlify.app

# 5. Deploy to production
pnpm deploy:prod
```

### Manual Deployment via GitHub
```bash
# 1. Merge to main branch
git checkout main
git merge develop
git push origin main

# 2. GitHub Actions will automatically deploy

# 3. Monitor deployment
# Go to GitHub > Actions tab
```

### Emergency Rollback
```bash
# Option 1: Via Netlify Dashboard
# 1. Go to Deploys tab
# 2. Find last working deploy
# 3. Click "Publish deploy"

# Option 2: Via CLI
netlify rollback

# Option 3: Via Git
git revert HEAD
git push origin main
```

## Post-Deployment Verification

### 1. Health Checks
```bash
# Check application health
curl https://coiffeur-platform.ch/api/health

# Check database connection
curl https://coiffeur-platform.ch/api/health/database

# Check edge functions
curl https://YOUR_PROJECT.supabase.co/functions/v1/health
```

### 2. Test Critical Flows
- [ ] User registration and login
- [ ] Booking appointment
- [ ] Payment processing (Stripe)
- [ ] Payment processing (SumUp)
- [ ] Email notifications
- [ ] Admin dashboard access

### 3. Monitor Performance
- [ ] Check Lighthouse score
- [ ] Verify Sentry is receiving events
- [ ] Check Google Analytics tracking
- [ ] Monitor server response times

### 4. Security Verification
- [ ] SSL certificate active
- [ ] Security headers present
- [ ] RLS policies enforced
- [ ] API rate limiting active

## Monitoring Setup

### 1. Sentry Configuration
```bash
# Create Sentry project at https://sentry.io
# Add DSN to environment variables
SENTRY_DSN=https://...@sentry.io/...

# Create release
sentry-cli releases new v1.0.0
sentry-cli releases set-commits v1.0.0 --auto
sentry-cli releases finalize v1.0.0
```

### 2. Uptime Monitoring
- [ ] Set up uptime monitoring (e.g., UptimeRobot)
- [ ] Configure alerts for downtime
- [ ] Monitor critical endpoints

### 3. Error Alerts
- [ ] Configure Sentry alerts
- [ ] Set up Slack notifications
- [ ] Configure email alerts

## Swiss Compliance

### 1. Data Protection
- [ ] Verify data stored in EU region
- [ ] Implement data export functionality
- [ ] Set up data retention policies
- [ ] Configure GDPR compliance features

### 2. Financial Compliance
- [ ] Configure VAT rates (7.7%, 2.5%, 3.7%)
- [ ] Test QR-Bill generation
- [ ] Verify invoice formatting
- [ ] Set up financial audit logs

### 3. Legal Requirements
- [ ] Update privacy policy
- [ ] Update terms of service
- [ ] Add cookie consent banner
- [ ] Configure data processing agreements

## Backup Strategy

### 1. Database Backups
```bash
# Configure automatic backups in Supabase
# Dashboard > Settings > Database > Backups

# Manual backup
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
```

### 2. Code Backups
- [ ] Ensure Git repository is backed up
- [ ] Create release tags for each deployment
- [ ] Document rollback procedures

### 3. Configuration Backups
- [ ] Backup environment variables
- [ ] Document all API keys securely
- [ ] Maintain configuration changelog

## Support Documentation

### 1. Create Operation Runbooks
- [ ] Deployment procedures
- [ ] Rollback procedures
- [ ] Incident response plan
- [ ] Monitoring dashboard links

### 2. Customer Support
- [ ] Set up support email
- [ ] Create FAQ documentation
- [ ] Prepare user guides
- [ ] Set up feedback collection

## Final Checklist

Before going live:
- [ ] All tests passing
- [ ] Security audit completed
- [ ] Performance benchmarks met
- [ ] Backup strategy tested
- [ ] Monitoring configured
- [ ] Documentation complete
- [ ] Team trained on procedures
- [ ] Customer communication prepared

## Launch Day

1. **Morning (9:00 AM)**
   - [ ] Final backup of existing system
   - [ ] Team standup meeting
   - [ ] Deploy to production

2. **Testing Phase (10:00 AM - 12:00 PM)**
   - [ ] Run smoke tests
   - [ ] Test all critical paths
   - [ ] Monitor error rates

3. **Soft Launch (12:00 PM)**
   - [ ] Enable for staff only
   - [ ] Gather feedback
   - [ ] Fix any issues

4. **Public Launch (2:00 PM)**
   - [ ] Enable for all users
   - [ ] Monitor closely
   - [ ] Respond to issues immediately

5. **End of Day (6:00 PM)**
   - [ ] Team debrief
   - [ ] Document lessons learned
   - [ ] Plan for next day support

## Emergency Contacts

- **Technical Lead**: [Your Name] - [Phone]
- **DevOps**: [Contact] - [Phone]
- **Stripe Support**: +1-888-924-2743
- **SumUp Support**: [Local Number]
- **Supabase Support**: support@supabase.com
- **Netlify Support**: Via dashboard

---

**Document Version**: 1.0
**Last Updated**: October 2024
**Next Review**: Before deployment
**Owner**: Development Team