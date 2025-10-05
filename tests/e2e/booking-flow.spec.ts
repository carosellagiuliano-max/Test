import { test, expect, Page } from '@playwright/test'

test.describe('Appointment Booking Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the booking page
    await page.goto('/book')

    // Wait for the page to load
    await page.waitForLoadState('networkidle')
  })

  test('should complete full booking flow successfully', async ({ page }) => {
    // Step 1: Select service
    await page.click('[data-testid="service-card-haircut"]')
    await expect(page.locator('[data-testid="selected-service"]')).toContainText('Haircut & Wash')

    // Step 2: Select date
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 7) // Book 1 week ahead

    await page.click('[data-testid="date-picker"]')
    await page.click(`[data-date="${futureDate.toISOString().split('T')[0]}"]`)

    // Step 3: Select time slot
    await page.waitForSelector('[data-testid="time-slot"]')
    await page.click('[data-testid="time-slot"]:first-child')

    // Step 4: Select staff member
    await page.click('[data-testid="staff-member"]:first-child')

    // Step 5: Fill customer information
    await page.fill('[data-testid="customer-first-name"]', 'John')
    await page.fill('[data-testid="customer-last-name"]', 'Doe')
    await page.fill('[data-testid="customer-email"]', 'john.doe@example.com')
    await page.fill('[data-testid="customer-phone"]', '+41791234567')

    // Step 6: Review booking details
    await page.click('[data-testid="continue-to-review"]')

    // Verify booking summary
    await expect(page.locator('[data-testid="booking-summary-service"]')).toContainText('Haircut & Wash')
    await expect(page.locator('[data-testid="booking-summary-price"]')).toContainText('CHF 85.00')
    await expect(page.locator('[data-testid="booking-summary-vat"]')).toContainText('CHF 6.55')
    await expect(page.locator('[data-testid="booking-summary-total"]')).toContainText('CHF 91.55')

    // Step 7: Confirm booking
    await page.click('[data-testid="confirm-booking"]')

    // Step 8: Verify confirmation
    await expect(page.locator('[data-testid="booking-confirmation"]')).toBeVisible()
    await expect(page.locator('[data-testid="confirmation-code"]')).toBeVisible()

    // Verify confirmation details
    const confirmationCode = await page.textContent('[data-testid="confirmation-code"]')
    expect(confirmationCode).toMatch(/^[A-Z0-9]{8}$/) // 8-character alphanumeric code

    // Verify booking appears in customer portal
    await page.click('[data-testid="view-my-bookings"]')
    await expect(page.locator('[data-testid="appointment-list"]')).toContainText('John Doe')
  })

  test('should handle payment flow with Stripe', async ({ page }) => {
    // Complete booking steps 1-6 (same as above)
    await completeBookingSteps(page)

    // Choose Stripe payment
    await page.click('[data-testid="payment-method-stripe"]')
    await page.click('[data-testid="confirm-booking"]')

    // Verify redirect to Stripe checkout
    await page.waitForURL(/.*stripe\.com.*/)

    // Fill Stripe test card details
    await page.frameLocator('iframe[name*="stripe"]').locator('[data-testid="card-number-input"]').fill('4242424242424242')
    await page.frameLocator('iframe[name*="stripe"]').locator('[data-testid="card-expiry-input"]').fill('1234')
    await page.frameLocator('iframe[name*="stripe"]').locator('[data-testid="card-cvc-input"]').fill('123')

    // Complete payment
    await page.frameLocator('iframe[name*="stripe"]').locator('[data-testid="submit-payment"]').click()

    // Verify return to success page
    await page.waitForURL(/.*\/booking\/success.*/)
    await expect(page.locator('[data-testid="payment-success"]')).toBeVisible()
    await expect(page.locator('[data-testid="booking-status"]')).toContainText('Confirmed & Paid')
  })

  test('should handle payment flow with SumUp', async ({ page }) => {
    // Complete booking steps 1-6 (same as above)
    await completeBookingSteps(page)

    // Choose SumUp payment
    await page.click('[data-testid="payment-method-sumup"]')
    await page.click('[data-testid="confirm-booking"]')

    // Verify SumUp payment interface
    await expect(page.locator('[data-testid="sumup-payment-form"]')).toBeVisible()

    // Fill SumUp test card details
    await page.fill('[data-testid="sumup-card-number"]', '4111111111111111')
    await page.fill('[data-testid="sumup-card-expiry"]', '12/34')
    await page.fill('[data-testid="sumup-card-cvv"]', '123')
    await page.fill('[data-testid="sumup-cardholder-name"]', 'John Doe')

    // Complete payment
    await page.click('[data-testid="sumup-pay-button"]')

    // Verify payment success
    await expect(page.locator('[data-testid="payment-success"]')).toBeVisible()
    await expect(page.locator('[data-testid="booking-status"]')).toContainText('Confirmed & Paid')
  })

  test('should validate form fields correctly', async ({ page }) => {
    // Try to proceed without selecting service
    await page.click('[data-testid="continue-to-date"]')
    await expect(page.locator('[data-testid="service-error"]')).toContainText('Please select a service')

    // Select service and try to proceed without date
    await page.click('[data-testid="service-card-haircut"]')
    await page.click('[data-testid="continue-to-time"]')
    await expect(page.locator('[data-testid="date-error"]')).toContainText('Please select a date')

    // Test invalid email format
    await completeBookingToCustomerInfo(page)
    await page.fill('[data-testid="customer-email"]', 'invalid-email')
    await page.click('[data-testid="continue-to-review"]')
    await expect(page.locator('[data-testid="email-error"]')).toContainText('Please enter a valid email')

    // Test invalid Swiss phone number
    await page.fill('[data-testid="customer-email"]', 'valid@example.com')
    await page.fill('[data-testid="customer-phone"]', '1234567890')
    await page.click('[data-testid="continue-to-review"]')
    await expect(page.locator('[data-testid="phone-error"]')).toContainText('Please enter a valid Swiss phone number')
  })

  test('should handle booking conflicts gracefully', async ({ page }) => {
    // Complete first booking
    await completeBookingSteps(page)
    await page.click('[data-testid="confirm-booking"]')

    // Try to book the same time slot again
    await page.goto('/book')
    await completeBookingSteps(page) // Same date/time
    await page.click('[data-testid="confirm-booking"]')

    // Verify conflict error
    await expect(page.locator('[data-testid="booking-error"]')).toContainText('This time slot is no longer available')

    // Verify alternative times are suggested
    await expect(page.locator('[data-testid="alternative-times"]')).toBeVisible()
    await expect(page.locator('[data-testid="alternative-time-slot"]')).toHaveCount.toBeGreaterThan(0)
  })

  test('should handle network errors gracefully', async ({ page }) => {
    // Intercept and fail the booking API call
    await page.route('**/functions/v1/book-appointment', route => {
      route.abort('failed')
    })

    await completeBookingSteps(page)
    await page.click('[data-testid="confirm-booking"]')

    // Verify error handling
    await expect(page.locator('[data-testid="booking-error"]')).toContainText('Unable to complete booking')
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible()

    // Test retry functionality
    await page.unroute('**/functions/v1/book-appointment')
    await page.click('[data-testid="retry-button"]')

    // Verify successful retry
    await expect(page.locator('[data-testid="booking-confirmation"]')).toBeVisible()
  })

  test('should respect business hours and closed days', async ({ page }) => {
    // Try to select a Sunday (closed day)
    const nextSunday = getNextSunday()
    await page.click('[data-testid="service-card-haircut"]')
    await page.click('[data-testid="date-picker"]')
    await page.click(`[data-date="${nextSunday.toISOString().split('T')[0]}"]`)

    // Verify no time slots are available
    await expect(page.locator('[data-testid="no-slots-message"]')).toContainText('The salon is closed on this day')

    // Select a valid weekday but try late evening
    const nextMonday = getNextMonday()
    await page.click(`[data-date="${nextMonday.toISOString().split('T')[0]}"]`)

    // Verify only business hours slots are available
    const timeSlots = page.locator('[data-testid="time-slot"]')
    const firstSlot = await timeSlots.first().textContent()
    const lastSlot = await timeSlots.last().textContent()

    expect(firstSlot).toBe('09:00')
    expect(lastSlot).not.toBe('18:00') // Should end before 18:00
  })

  test('should handle mobile responsive design', async ({ page, isMobile }) => {
    if (!isMobile) {
      await page.setViewportSize({ width: 375, height: 667 }) // iPhone SE size
    }

    // Test mobile navigation
    await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible()
    await page.click('[data-testid="mobile-menu-button"]')
    await expect(page.locator('[data-testid="mobile-navigation"]')).toBeVisible()

    // Test mobile booking flow
    await page.click('[data-testid="mobile-book-button"]')
    await expect(page.locator('[data-testid="mobile-booking-stepper"]')).toBeVisible()

    // Verify service cards are displayed properly on mobile
    const serviceCards = page.locator('[data-testid="service-card"]')
    await expect(serviceCards.first()).toBeVisible()

    // Test swipe navigation on mobile
    const serviceName = await serviceCards.first().textContent()
    await serviceCards.first().click()
    await expect(page.locator('[data-testid="selected-service"]')).toContainText(serviceName)
  })
})

// Helper functions
async function completeBookingSteps(page: Page) {
  await page.click('[data-testid="service-card-haircut"]')

  const futureDate = new Date()
  futureDate.setDate(futureDate.getDate() + 7)

  await page.click('[data-testid="date-picker"]')
  await page.click(`[data-date="${futureDate.toISOString().split('T')[0]}"]`)

  await page.waitForSelector('[data-testid="time-slot"]')
  await page.click('[data-testid="time-slot"]:first-child')

  await page.click('[data-testid="staff-member"]:first-child')

  await page.fill('[data-testid="customer-first-name"]', 'John')
  await page.fill('[data-testid="customer-last-name"]', 'Doe')
  await page.fill('[data-testid="customer-email"]', 'john.doe@example.com')
  await page.fill('[data-testid="customer-phone"]', '+41791234567')

  await page.click('[data-testid="continue-to-review"]')
}

async function completeBookingToCustomerInfo(page: Page) {
  await page.click('[data-testid="service-card-haircut"]')

  const futureDate = new Date()
  futureDate.setDate(futureDate.getDate() + 7)

  await page.click('[data-testid="date-picker"]')
  await page.click(`[data-date="${futureDate.toISOString().split('T')[0]}"]`)

  await page.waitForSelector('[data-testid="time-slot"]')
  await page.click('[data-testid="time-slot"]:first-child')

  await page.click('[data-testid="staff-member"]:first-child')
}

function getNextSunday(): Date {
  const date = new Date()
  const day = date.getDay()
  const diff = (7 - day) % 7 || 7 // Days until next Sunday
  date.setDate(date.getDate() + diff)
  return date
}

function getNextMonday(): Date {
  const date = new Date()
  const day = date.getDay()
  const diff = (1 + 7 - day) % 7 || 7 // Days until next Monday
  date.setDate(date.getDate() + diff)
  return date
}