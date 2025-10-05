# Testing Guide - Coiffeur Platform

## Overview

This document outlines the comprehensive testing strategy for the Coiffeur Platform, including unit tests, integration tests, end-to-end tests, and performance testing.

## Testing Philosophy

Our testing approach follows the testing pyramid:
- **Unit Tests (70%)**: Fast, isolated tests for business logic
- **Integration Tests (20%)**: Tests for component interactions
- **E2E Tests (10%)**: Full user journey validation

## Test Types

### Unit Tests

**Purpose**: Test individual functions and components in isolation
**Framework**: Vitest + Testing Library
**Location**: `tests/unit/`

**What to Test**:
- Business logic (booking calculations, pricing, VAT)
- Utility functions (date handling, validation)
- React components (rendering, user interactions)
- Edge function logic

**Example Test Structure**:
```typescript
describe('BookingLogic', () => {
  describe('calculateTotalPrice', () => {
    it('should calculate price with Swiss VAT correctly', () => {
      const servicePrice = 10000 // 100.00 CHF in cents
      const totalPrice = BookingLogic.calculateTotalPrice(servicePrice)
      expect(totalPrice).toBe(10770) // 107.70 CHF
    })
  })
})
```

### Integration Tests

**Purpose**: Test interactions between components and external services
**Framework**: Vitest + MSW (Mock Service Worker)
**Location**: `tests/integration/`

**What to Test**:
- API endpoint functionality
- Database operations
- Third-party service integrations (Stripe, SumUp)
- Edge function deployments

**Example Test Structure**:
```typescript
describe('Edge Functions Integration', () => {
  it('should create appointment successfully', async () => {
    const { data, error } = await supabase.functions.invoke('book-appointment', {
      body: appointmentData
    })

    expect(error).toBeNull()
    expect(data).toHaveProperty('appointment_id')
  })
})
```

### End-to-End Tests

**Purpose**: Test complete user journeys
**Framework**: Playwright
**Location**: `tests/e2e/`

**What to Test**:
- Complete booking flow
- Payment processing
- User authentication
- Mobile responsiveness
- Cross-browser compatibility

**Example Test Structure**:
```typescript
test('should complete booking flow successfully', async ({ page }) => {
  await page.goto('/book')
  await page.click('[data-testid="service-card-haircut"]')
  // ... complete flow
  await expect(page.locator('[data-testid="booking-confirmation"]')).toBeVisible()
})
```

### Performance Tests

**Purpose**: Validate system performance under load
**Framework**: k6
**Location**: `tests/load/`

**What to Test**:
- Concurrent booking requests
- Payment processing under load
- Database performance
- API response times

## Running Tests

### Local Development

```bash
# Install dependencies
pnpm install

# Run all tests
pnpm test:all

# Run specific test types
pnpm test              # Unit tests only
pnpm test:integration  # Integration tests
pnpm test:e2e         # End-to-end tests
pnpm test:load        # Load tests

# Watch mode for development
pnpm test:watch

# Generate coverage report
pnpm test:coverage

# Run tests with UI
pnpm test:ui
pnpm test:e2e:ui
```

### CI/CD Pipeline

Tests run automatically on:
- Every pull request
- Pushes to main/develop branches
- Before deployment

**Pipeline Stages**:
1. Unit & Integration Tests (parallel)
2. Build Verification
3. E2E Tests
4. Performance Tests (main branch only)

### Test Environment Setup

**Local Environment**:
```bash
# Start local Supabase
pnpm db:start

# Run migrations
pnpm db:reset

# Start development server
pnpm dev
```

**CI Environment**:
- Dockerized Supabase instance
- Dedicated test database
- Mock payment providers
- Isolated test data

## Test Data Management

### Test Data Strategy

**Approach**: Fresh test data for each test suite
**Benefits**: Isolated tests, no data pollution, predictable outcomes

### Mock Data

**Location**: `test/test-utils.tsx`

**Available Mocks**:
```typescript
// Create test entities
const appointment = createMockAppointment({
  date: new Date('2024-01-15'),
  service_id: 'test-service-1'
})

const service = createMockService({
  name: 'Test Haircut',
  price: 8500
})

const customer = createMockCustomer({
  email: 'test@example.com'
})
```

### Database Seeding

**Integration Tests**:
```typescript
beforeAll(async () => {
  await setupTestData()
})

afterAll(async () => {
  await cleanupTestData()
})
```

**E2E Tests**:
- Use dedicated test database
- Seed with realistic data
- Clean up after test completion

## Swiss Business Logic Testing

### VAT Calculations

```typescript
describe('Swiss VAT Calculations', () => {
  it('should calculate 7.7% VAT correctly', () => {
    const netAmount = 10000 // 100.00 CHF
    const vatAmount = calculateVAT(netAmount)
    expect(vatAmount).toBe(770) // 7.70 CHF
  })

  it('should round VAT to nearest cent', () => {
    const netAmount = 3333 // 33.33 CHF
    const vatAmount = calculateVAT(netAmount)
    expect(vatAmount).toBe(257) // 2.57 CHF
  })
})
```

### Phone Number Validation

```typescript
describe('Swiss Phone Validation', () => {
  it('should validate Swiss phone formats', () => {
    expect(isValidSwissPhone('+41791234567')).toBe(true)
    expect(isValidSwissPhone('0041791234567')).toBe(true)
    expect(isValidSwissPhone('0791234567')).toBe(true)
  })

  it('should reject invalid formats', () => {
    expect(isValidSwissPhone('+49791234567')).toBe(false) // German
    expect(isValidSwissPhone('791234567')).toBe(false)    // Missing prefix
  })
})
```

### Business Hours Testing

```typescript
describe('Business Hours', () => {
  it('should respect salon opening hours', () => {
    const monday = new Date('2024-01-15')
    expect(isValidBookingTime('10:00', monday)).toBe(true)
    expect(isValidBookingTime('08:00', monday)).toBe(false)
    expect(isValidBookingTime('18:00', monday)).toBe(false)
  })

  it('should handle Saturday shorter hours', () => {
    const saturday = new Date('2024-01-13')
    expect(isValidBookingTime('14:00', saturday)).toBe(true)
    expect(isValidBookingTime('16:00', saturday)).toBe(false)
  })

  it('should reject Sundays', () => {
    const sunday = new Date('2024-01-14')
    expect(isValidBookingTime('10:00', sunday)).toBe(false)
  })
})
```

## Payment Testing

### Stripe Testing

**Test Cards**:
```typescript
const TEST_CARDS = {
  SUCCESS: '4242424242424242',
  DECLINE: '4000000000000002',
  INSUFFICIENT_FUNDS: '4000000000009995',
  EXPIRED: '4000000000000069',
  CVC_FAIL: '4000000000000127',
  FRAUD: '4100000000000019'
}
```

**Test Scenarios**:
```typescript
describe('Stripe Payment Flow', () => {
  it('should handle successful payment', async ({ page }) => {
    await fillPaymentForm(page, TEST_CARDS.SUCCESS)
    await expect(page.locator('[data-testid="payment-success"]')).toBeVisible()
  })

  it('should handle declined payment', async ({ page }) => {
    await fillPaymentForm(page, TEST_CARDS.DECLINE)
    await expect(page.locator('[data-testid="payment-error"]')).toContainText('declined')
  })
})
```

### SumUp Testing

**Mock Responses**:
```typescript
// Mock successful SumUp payment
server.use(
  http.post('*/api/sumup/payments', () => {
    return HttpResponse.json({
      transaction_id: 'sumup_test_123',
      status: 'PAID',
      amount: 8500
    })
  })
)
```

## Accessibility Testing

### Automated Testing

```typescript
// In each E2E test
test('should be accessible', async ({ page }) => {
  await page.goto('/book')

  // Run axe-core accessibility checks
  const accessibilityResults = await injectAxe(page)
  expect(accessibilityResults.violations).toHaveLength(0)
})
```

### Manual Testing Checklist

- [ ] Keyboard navigation works
- [ ] Screen reader compatibility
- [ ] Color contrast meets WCAG AA
- [ ] Focus indicators visible
- [ ] Alt text for images
- [ ] Form labels properly associated

## Performance Testing

### Load Testing Scenarios

**Normal Load**:
- 10 concurrent users
- 5-minute duration
- Mixed booking/browsing activities

**Spike Testing**:
- Rapid increase to 50 users
- 1-minute duration
- Booking-focused activities

**Stress Testing**:
- Gradual increase to 100 users
- 10-minute duration
- All platform features

### Performance Thresholds

```javascript
export const options = {
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% under 2s
    http_req_failed: ['rate<0.05'],    // Error rate < 5%
    booking_errors: ['rate<0.02'],     // Booking errors < 2%
    payment_errors: ['rate<0.01'],     // Payment errors < 1%
  }
}
```

### Core Web Vitals

**Targets**:
- First Contentful Paint: < 1.5s
- Largest Contentful Paint: < 2.5s
- Cumulative Layout Shift: < 0.1
- First Input Delay: < 100ms

**Monitoring**:
```typescript
// Lighthouse CI configuration
module.exports = {
  ci: {
    collect: {
      numberOfRuns: 3,
      url: ['http://localhost:3000', 'http://localhost:3000/book']
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }]
      }
    }
  }
}
```

## Test Coverage

### Coverage Targets

- **Overall**: 80% minimum
- **Critical Business Logic**: 95% minimum
- **Edge Functions**: 90% minimum
- **Frontend Components**: 75% minimum

### Coverage Reports

```bash
# Generate coverage report
pnpm test:coverage

# View coverage in browser
open coverage/index.html

# CI coverage upload
codecov -t $CODECOV_TOKEN
```

### Coverage Exclusions

- Third-party libraries
- Configuration files
- Development utilities
- Generated code
- Test files themselves

## Debugging Tests

### Local Debugging

```bash
# Debug specific test
pnpm test:debug tests/unit/booking-logic.test.ts

# Run single test file
pnpm test booking-logic

# Watch mode with verbose output
pnpm test:watch --reporter=verbose

# UI mode for visual debugging
pnpm test:ui
```

### E2E Debugging

```bash
# Run in headed mode
pnpm test:e2e --headed

# Debug mode (pauses on failure)
pnpm test:e2e --debug

# Generate trace files
pnpm test:e2e --trace on

# View trace
npx playwright show-trace trace.zip
```

### CI Debugging

**Artifacts Available**:
- Test screenshots on failure
- Video recordings of E2E tests
- Coverage reports
- Performance test results
- Trace files

**Access Artifacts**:
1. Go to GitHub Actions run
2. Scroll to "Artifacts" section
3. Download relevant artifacts

## Test Maintenance

### Regular Tasks

**Weekly**:
- Review test flakiness reports
- Update test data as needed
- Check coverage trends

**Monthly**:
- Review and update test scenarios
- Performance baseline updates
- Accessibility standard updates

**Quarterly**:
- Test strategy review
- Tool and framework updates
- Performance target adjustments

### Test Hygiene

**Guidelines**:
- Tests should be deterministic
- No dependencies between tests
- Clear test descriptions
- Appropriate test data cleanup
- Mock external dependencies

**Anti-patterns to Avoid**:
- Testing implementation details
- Overly complex test setup
- Shared mutable state
- Testing multiple concepts in one test
- Ignoring test failures

## Continuous Improvement

### Metrics to Track

- Test execution time trends
- Flaky test identification
- Coverage progression
- Bug escape rate
- Test maintenance effort

### Feedback Loops

- Developer feedback on test utility
- QA team insights on coverage gaps
- Customer issue correlation with test gaps
- Performance trends vs. test results

### Tool Evaluation

**Current Stack**:
- Vitest (fast, modern testing)
- Playwright (reliable E2E testing)
- k6 (performance testing)
- MSW (API mocking)

**Evaluation Criteria**:
- Developer experience
- Execution speed
- Reliability
- Maintenance overhead
- Community support

---

**Document Version**: 1.0
**Last Updated**: October 2024
**Next Review**: January 2025
**Owner**: QA Team