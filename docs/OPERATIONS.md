# Operations Guide - Coiffeur Platform

## Overview

This document provides essential operational procedures for the Coiffeur Platform, including deployment processes, monitoring, troubleshooting, and emergency response procedures.

## Quick Reference

### Critical Information

- **Production URL**: https://coiffeur-platform.netlify.app
- **Staging URL**: https://staging--coiffeur-platform.netlify.app
- **Monitoring**: https://sentry.io/organizations/your-org/projects/coiffeur-platform/
- **Status Page**: https://status.netlify.com
- **Support Email**: support@coiffeur-platform.ch

### Emergency Contacts

- **Development Team Lead**: [Your Email]
- **DevOps Engineer**: [DevOps Email]
- **Business Owner**: [Business Email]
- **On-call Phone**: [Emergency Phone]

## Deployment Procedures

### Normal Deployment

1. **Create Pull Request**
   ```bash
   git checkout -b feature/your-feature
   git commit -m "feat: your feature description"
   git push origin feature/your-feature
   ```

2. **Review Process**
   - All tests must pass in CI
   - At least one approval required
   - No blocking security issues

3. **Merge to Main**
   - Automatic deployment triggers
   - Monitor deployment in GitHub Actions
   - Verify deployment in production

### Emergency Deployment

For critical fixes that cannot wait for normal review:

1. **Create hotfix branch**
   ```bash
   git checkout -b hotfix/critical-fix
   ```

2. **Deploy directly to main** (emergency only)
   ```bash
   git push origin hotfix/critical-fix:main
   ```

3. **Monitor deployment closely**
   - Watch GitHub Actions
   - Check Sentry for errors
   - Verify fix in production

4. **Create post-incident review**

### Rollback Procedure

If deployment fails or introduces critical issues:

1. **Immediate Rollback**
   - Go to [Netlify Admin](https://app.netlify.com)
   - Navigate to Deploys
   - Find last successful deployment
   - Click "Publish deploy"

2. **Database Rollback** (if needed)
   ```bash
   # Connect to Supabase dashboard
   # Go to Database > Backups
   # Restore from latest stable backup
   ```

3. **Verify Rollback**
   - Check production functionality
   - Monitor error rates in Sentry
   - Notify team of successful rollback

## Testing Procedures

### Running Tests Locally

```bash
# Install dependencies
pnpm install

# Run all tests
pnpm test:all

# Run specific test types
pnpm test:unit          # Unit tests
pnpm test:integration   # Integration tests
pnpm test:e2e          # End-to-end tests
pnpm test:load         # Load tests
```

### Test Environment Setup

```bash
# Start local Supabase
pnpm db:start

# Run database migrations
pnpm db:reset

# Start development server
pnpm dev
```

### Debugging Test Failures

1. **Check test logs**
   ```bash
   pnpm test:coverage --reporter=verbose
   ```

2. **Run tests in UI mode**
   ```bash
   pnpm test:ui
   pnpm test:e2e:ui
   ```

3. **Debug specific test**
   ```bash
   pnpm test:debug tests/unit/booking-logic.test.ts
   ```

## Monitoring & Alerting

### Key Metrics to Monitor

1. **Application Performance**
   - Response times < 2s (95th percentile)
   - Error rate < 1%
   - Uptime > 99.9%

2. **Business Metrics**
   - Booking completion rate > 95%
   - Payment success rate > 99%
   - Customer satisfaction > 4.5/5

3. **Infrastructure Metrics**
   - Database response time < 100ms
   - Edge function cold starts < 500ms
   - CDN cache hit rate > 90%

### Sentry Configuration

**Error Thresholds:**
- Critical: Payment failures, booking system down
- High: User-facing errors, slow page loads
- Medium: Non-critical feature issues
- Low: Debug information, feature usage

**Alert Channels:**
- Critical: Slack #dev-alerts + SMS
- High: Slack #dev-alerts
- Medium: Slack #dev-monitoring
- Low: Email digest

### Performance Monitoring

**Core Web Vitals Targets:**
- First Contentful Paint: < 1.5s
- Largest Contentful Paint: < 2.5s
- Cumulative Layout Shift: < 0.1
- First Input Delay: < 100ms

## Troubleshooting Guide

### Common Issues

#### 1. Booking System Not Working

**Symptoms:**
- Users can't create appointments
- "Service unavailable" errors
- Booking form not loading

**Investigation Steps:**
1. Check Supabase edge functions status
2. Verify database connectivity
3. Check for recent deployments
4. Review Sentry error logs

**Resolution:**
```bash
# Check edge function logs
supabase functions logs book-appointment

# Test edge function directly
curl -X POST https://your-project.supabase.co/functions/v1/book-appointment \
  -H "Authorization: Bearer $ANON_KEY" \
  -d '{"test": true}'
```

#### 2. Payment Processing Failures

**Symptoms:**
- Payment forms not submitting
- Stripe/SumUp errors
- Incomplete transactions

**Investigation Steps:**
1. Check payment provider status pages
2. Verify API keys are valid
3. Check webhook configurations
4. Review payment logs in Sentry

**Resolution:**
```bash
# Test Stripe connection
curl https://api.stripe.com/v1/payment_intents \
  -H "Authorization: Bearer $STRIPE_SECRET_KEY"

# Check SumUp status
curl https://api.sumup.com/v0.1/me \
  -H "Authorization: Bearer $SUMUP_TOKEN"
```

#### 3. Database Connection Issues

**Symptoms:**
- 500 errors on data-dependent pages
- Slow loading times
- Connection timeouts

**Investigation Steps:**
1. Check Supabase dashboard health
2. Review connection pool usage
3. Check for long-running queries
4. Verify database migrations

**Resolution:**
```bash
# Check database health
supabase status

# Review slow queries
# Access Supabase Dashboard > Database > Logs
```

#### 4. Performance Issues

**Symptoms:**
- Slow page loads
- High bounce rate
- Poor Core Web Vitals

**Investigation Steps:**
1. Check Lighthouse scores
2. Review bundle sizes
3. Analyze network requests
4. Check CDN performance

**Resolution:**
```bash
# Analyze bundle size
pnpm build && pnpm analyze

# Run performance audit
lighthouse https://your-site.com --output=json
```

### Emergency Response Procedures

#### Severity Levels

**P0 - Critical (Resolve within 1 hour)**
- Complete site outage
- Payment system down
- Data breach or security incident
- Customer data loss

**P1 - High (Resolve within 4 hours)**
- Major feature outage
- Significant performance degradation
- Authentication issues
- Mobile app not functioning

**P2 - Medium (Resolve within 24 hours)**
- Minor feature issues
- Cosmetic bugs
- Non-critical third-party integrations down
- Moderate performance issues

**P3 - Low (Resolve within 72 hours)**
- Enhancement requests
- Documentation issues
- Minor UX improvements
- Non-urgent optimizations

#### Incident Response Process

1. **Detection**
   - Automated alerts (Sentry, Netlify)
   - Customer reports
   - Team member discovery

2. **Assessment**
   - Determine severity level
   - Identify affected systems
   - Estimate customer impact

3. **Communication**
   ```
   # P0/P1 Incidents
   - Immediate Slack notification
   - Update status page
   - Notify stakeholders

   # P2/P3 Incidents
   - Slack notification
   - Create GitHub issue
   ```

4. **Investigation**
   - Check recent deployments
   - Review monitoring dashboards
   - Analyze error logs
   - Test affected functionality

5. **Resolution**
   - Apply immediate fix or rollback
   - Verify resolution
   - Update status page
   - Document incident

6. **Post-Incident**
   - Conduct blameless post-mortem
   - Identify preventive measures
   - Update procedures
   - Schedule follow-up improvements

## Swiss Compliance Procedures

### Data Protection (Swiss DPA)

**Data Access Logging:**
- All customer data access is logged
- Purpose and user are recorded
- Retention period: 2 years
- Monthly audit reports generated

**Data Export Requests:**
```bash
# Customer data export
pnpm run export-customer-data --customer-id=<id>

# Generates JSON file with all customer data
# Must be provided within 30 days
```

**Data Deletion Requests:**
```bash
# Customer data deletion
pnpm run delete-customer-data --customer-id=<id> --confirm

# Anonymizes or deletes all customer data
# Must be completed within 30 days
```

### Financial Compliance

**Transaction Monitoring:**
- All payments logged with Swiss tax requirements
- VAT calculations verified (7.7%)
- Monthly financial reports generated
- Audit trail maintained for 10 years

**Required Documentation:**
- Invoice generation (automated)
- Receipt generation (automated)
- Tax reporting (quarterly)
- Financial audit preparation (yearly)

## Backup & Recovery

### Database Backups

**Automatic Backups:**
- Daily full backups (Supabase managed)
- Point-in-time recovery available
- 30-day retention period
- Cross-region replication

**Manual Backup:**
```bash
# Create manual backup
supabase db dump --data-only > backup-$(date +%Y%m%d).sql

# Restore from backup
supabase db reset
psql -h localhost -p 54322 -U postgres -d postgres < backup-20240101.sql
```

### Code & Configuration Backups

**Repository Backups:**
- GitHub with full history
- Automated daily backups to AWS S3
- Configuration stored in encrypted format
- Secrets managed via GitHub Secrets

### Disaster Recovery

**Recovery Time Objectives (RTO):**
- Database: 15 minutes
- Application: 30 minutes
- Full system: 1 hour

**Recovery Point Objectives (RPO):**
- Database: 1 hour
- Application state: 24 hours
- User data: Real-time

## Environment Management

### Environment Variables

**Development:**
```bash
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=local-anon-key
NODE_ENV=development
```

**Staging:**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://staging-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=staging-anon-key
NODE_ENV=staging
```

**Production:**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=prod-anon-key
NODE_ENV=production
```

### Secrets Management

**GitHub Secrets:**
- `SUPABASE_ACCESS_TOKEN`: For deployment automation
- `STRIPE_SECRET_KEY`: Payment processing
- `SUMUP_API_KEY`: Alternative payment processing
- `SENTRY_DSN`: Error tracking
- `SLACK_WEBHOOK_URL`: Team notifications

**Rotation Schedule:**
- API Keys: Every 90 days
- Database passwords: Every 60 days
- Signing keys: Every 180 days

## Performance Optimization

### Frontend Optimization

```bash
# Bundle analysis
pnpm build
pnpm bundle-analyzer

# Image optimization
npm run optimize-images

# Cache optimization
# Configure in next.config.js
```

### Database Optimization

```sql
-- Index optimization
EXPLAIN ANALYZE SELECT * FROM appointments WHERE date >= NOW();

-- Connection pooling
-- Configure in Supabase dashboard

-- Query optimization
-- Use EXPLAIN ANALYZE for slow queries
```

### CDN & Caching

**Netlify Edge:**
- Static assets: 1 year cache
- API responses: 5 minutes cache
- Dynamic pages: No cache

**Browser Caching:**
- Images: 30 days
- CSS/JS: 1 year with versioning
- HTML: No cache

## Security Procedures

### Security Monitoring

**Automated Scans:**
- Daily dependency vulnerability scans
- Weekly OWASP ZAP scans
- Monthly penetration testing
- Quarterly security audits

**Security Alerts:**
- New vulnerabilities in dependencies
- Suspicious authentication patterns
- Unusual data access patterns
- Failed login attempts (rate limiting)

### Incident Response

**Security Incident Classifications:**
- **Critical**: Data breach, system compromise
- **High**: Unauthorized access, service disruption
- **Medium**: Vulnerability discovery, suspicious activity
- **Low**: Policy violations, social engineering attempts

**Response Procedures:**
1. Isolate affected systems
2. Preserve evidence
3. Notify authorities (if required)
4. Implement containment measures
5. Communicate with stakeholders
6. Conduct forensic analysis
7. Implement preventive measures

## Contact Information

### Internal Team

| Role | Name | Email | Phone |
|------|------|-------|-------|
| Tech Lead | [Name] | [email] | [phone] |
| DevOps | [Name] | [email] | [phone] |
| Security | [Name] | [email] | [phone] |
| Product | [Name] | [email] | [phone] |

### External Vendors

| Service | Contact | Support URL | Emergency |
|---------|---------|-------------|-----------|
| Supabase | support@supabase.io | https://supabase.com/support | N/A |
| Netlify | support@netlify.com | https://netlify.com/support | N/A |
| Stripe | support@stripe.com | https://stripe.com/support | https://stripe.com/emergency |
| Sentry | support@sentry.io | https://sentry.io/support | N/A |

---

**Document Version**: 1.0
**Last Updated**: October 2024
**Next Review**: January 2025
**Owner**: Development Team