import { test, expect, Page } from '@playwright/test'

test.describe('Payment Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Complete booking up to payment step
    await completeBookingToPayment(page)
  })

  test.describe('Stripe Payment Flow', () => {
    test('should complete Stripe payment successfully', async ({ page }) => {
      await page.click('[data-testid="payment-method-stripe"]')
      await page.click('[data-testid="proceed-to-payment"]')

      // Wait for Stripe checkout to load
      await page.waitForURL(/.*checkout\.stripe\.com.*/)

      // Fill in test card details
      await page.fill('[data-testid="card-number"]', '4242424242424242')
      await page.fill('[data-testid="card-expiry"]', '1234')
      await page.fill('[data-testid="card-cvc"]', '123')
      await page.fill('[data-testid="billing-name"]', 'John Doe')
      await page.fill('[data-testid="billing-email"]', 'john.doe@example.com')

      // Submit payment
      await page.click('[data-testid="submit-payment"]')

      // Verify return to success page
      await page.waitForURL(/.*\/booking\/success.*/)
      await expect(page.locator('[data-testid="payment-success-message"]')).toBeVisible()
      await expect(page.locator('[data-testid="booking-reference"]')).toBeVisible()

      // Verify appointment is confirmed and paid
      const status = await page.textContent('[data-testid="appointment-status"]')
      expect(status).toContain('Confirmed & Paid')
    })

    test('should handle Stripe payment decline', async ({ page }) => {
      await page.click('[data-testid="payment-method-stripe"]')
      await page.click('[data-testid="proceed-to-payment"]')

      // Use declined card number
      await page.fill('[data-testid="card-number"]', '4000000000000002')
      await page.fill('[data-testid="card-expiry"]', '1234')
      await page.fill('[data-testid="card-cvc"]', '123')
      await page.fill('[data-testid="billing-name"]', 'John Doe')
      await page.fill('[data-testid="billing-email"]', 'john.doe@example.com')

      await page.click('[data-testid="submit-payment"]')

      // Verify error handling
      await expect(page.locator('[data-testid="payment-error"]')).toContainText('Your card was declined')

      // Verify user can try again
      await expect(page.locator('[data-testid="try-again-button"]')).toBeVisible()
    })

    test('should handle insufficient funds', async ({ page }) => {
      await page.click('[data-testid="payment-method-stripe"]')
      await page.click('[data-testid="proceed-to-payment"]')

      // Use insufficient funds card
      await page.fill('[data-testid="card-number"]', '4000000000009995')
      await page.fill('[data-testid="card-expiry"]', '1234')
      await page.fill('[data-testid="card-cvc"]', '123')
      await page.fill('[data-testid="billing-name"]', 'John Doe')
      await page.fill('[data-testid="billing-email"]', 'john.doe@example.com')

      await page.click('[data-testid="submit-payment"]')

      await expect(page.locator('[data-testid="payment-error"]')).toContainText('insufficient funds')
    })

    test('should validate Stripe form fields', async ({ page }) => {
      await page.click('[data-testid="payment-method-stripe"]')
      await page.click('[data-testid="proceed-to-payment"]')

      // Try to submit without filling required fields
      await page.click('[data-testid="submit-payment"]')

      await expect(page.locator('[data-testid="card-number-error"]')).toBeVisible()
      await expect(page.locator('[data-testid="card-expiry-error"]')).toBeVisible()
      await expect(page.locator('[data-testid="card-cvc-error"]')).toBeVisible()
    })

    test('should handle 3D Secure authentication', async ({ page }) => {
      await page.click('[data-testid="payment-method-stripe"]')
      await page.click('[data-testid="proceed-to-payment"]')

      // Use 3D Secure test card
      await page.fill('[data-testid="card-number"]', '4000000000003220')
      await page.fill('[data-testid="card-expiry"]', '1234')
      await page.fill('[data-testid="card-cvc"]', '123')
      await page.fill('[data-testid="billing-name"]', 'John Doe')
      await page.fill('[data-testid="billing-email"]', 'john.doe@example.com')

      await page.click('[data-testid="submit-payment"]')

      // Handle 3D Secure challenge
      await page.waitForSelector('[data-testid="3ds-challenge"]')
      await page.click('[data-testid="complete-3ds"]')

      // Verify successful payment after 3DS
      await page.waitForURL(/.*\/booking\/success.*/)
      await expect(page.locator('[data-testid="payment-success-message"]')).toBeVisible()
    })
  })

  test.describe('SumUp Payment Flow', () => {
    test('should complete SumUp payment successfully', async ({ page }) => {
      await page.click('[data-testid="payment-method-sumup"]')
      await page.click('[data-testid="proceed-to-payment"]')

      // Verify SumUp payment form is displayed
      await expect(page.locator('[data-testid="sumup-payment-form"]')).toBeVisible()

      // Fill in test card details
      await page.fill('[data-testid="sumup-card-number"]', '4111111111111111')
      await page.fill('[data-testid="sumup-expiry-month"]', '12')
      await page.fill('[data-testid="sumup-expiry-year"]', '2034')
      await page.fill('[data-testid="sumup-cvv"]', '123')
      await page.fill('[data-testid="sumup-cardholder-name"]', 'John Doe')

      // Submit payment
      await page.click('[data-testid="sumup-pay-button"]')

      // Verify payment processing
      await expect(page.locator('[data-testid="payment-processing"]')).toBeVisible()

      // Verify success
      await expect(page.locator('[data-testid="sumup-payment-success"]')).toBeVisible()
      await expect(page.locator('[data-testid="appointment-status"]')).toContainText('Confirmed & Paid')
    })

    test('should handle SumUp payment failure', async ({ page }) => {
      await page.click('[data-testid="payment-method-sumup"]')
      await page.click('[data-testid="proceed-to-payment"]')

      // Use test card that triggers failure
      await page.fill('[data-testid="sumup-card-number"]', '4000000000000002')
      await page.fill('[data-testid="sumup-expiry-month"]', '12')
      await page.fill('[data-testid="sumup-expiry-year"]', '2034')
      await page.fill('[data-testid="sumup-cvv"]', '123')
      await page.fill('[data-testid="sumup-cardholder-name"]', 'John Doe')

      await page.click('[data-testid="sumup-pay-button"]')

      // Verify error handling
      await expect(page.locator('[data-testid="sumup-payment-error"]')).toContainText('Payment failed')
      await expect(page.locator('[data-testid="retry-payment-button"]')).toBeVisible()
    })

    test('should validate SumUp form fields', async ({ page }) => {
      await page.click('[data-testid="payment-method-sumup"]')
      await page.click('[data-testid="proceed-to-payment"]')

      // Test invalid card number
      await page.fill('[data-testid="sumup-card-number"]', '1234')
      await page.click('[data-testid="sumup-pay-button"]')
      await expect(page.locator('[data-testid="sumup-card-number-error"]')).toContainText('Invalid card number')

      // Test invalid expiry date
      await page.fill('[data-testid="sumup-card-number"]', '4111111111111111')
      await page.fill('[data-testid="sumup-expiry-month"]', '13')
      await page.click('[data-testid="sumup-pay-button"]')
      await expect(page.locator('[data-testid="sumup-expiry-error"]')).toContainText('Invalid expiry date')

      // Test invalid CVV
      await page.fill('[data-testid="sumup-expiry-month"]', '12')
      await page.fill('[data-testid="sumup-cvv"]', '12')
      await page.click('[data-testid="sumup-pay-button"]')
      await expect(page.locator('[data-testid="sumup-cvv-error"]')).toContainText('Invalid CVV')
    })
  })

  test.describe('Payment Method Selection', () => {
    test('should display both payment options', async ({ page }) => {
      await expect(page.locator('[data-testid="payment-method-stripe"]')).toBeVisible()
      await expect(page.locator('[data-testid="payment-method-sumup"]')).toBeVisible()
    })

    test('should show correct payment method details', async ({ page }) => {
      // Check Stripe details
      await expect(page.locator('[data-testid="stripe-description"]')).toContainText('Credit/Debit Card')
      await expect(page.locator('[data-testid="stripe-fees"]')).toContainText('Processing fee: 2.9% + CHF 0.30')

      // Check SumUp details
      await expect(page.locator('[data-testid="sumup-description"]')).toContainText('Card Payment')
      await expect(page.locator('[data-testid="sumup-fees"]')).toContainText('Processing fee: 1.95%')
    })

    test('should require payment method selection', async ({ page }) => {
      await page.click('[data-testid="proceed-to-payment"]')
      await expect(page.locator('[data-testid="payment-method-error"]')).toContainText('Please select a payment method')
    })

    test('should calculate total with payment fees', async ({ page }) => {
      const basePrice = await page.textContent('[data-testid="base-price"]')

      // Select Stripe and verify fee calculation
      await page.click('[data-testid="payment-method-stripe"]')
      const stripeTotal = await page.textContent('[data-testid="total-with-fees"]')
      expect(stripeTotal).not.toBe(basePrice)

      // Switch to SumUp and verify different fee calculation
      await page.click('[data-testid="payment-method-sumup"]')
      const sumupTotal = await page.textContent('[data-testid="total-with-fees"]')
      expect(sumupTotal).not.toBe(stripeTotal)
    })
  })

  test.describe('Swiss Payment Compliance', () => {
    test('should display prices in Swiss Francs', async ({ page }) => {
      const prices = await page.locator('[data-testid*="price"]').allTextContents()
      prices.forEach(price => {
        expect(price).toMatch(/CHF\s?\d+\.\d{2}/)
      })
    })

    test('should show VAT breakdown correctly', async ({ page }) => {
      const vatRate = await page.textContent('[data-testid="vat-rate"]')
      expect(vatRate).toBe('7.7%')

      const vatAmount = await page.textContent('[data-testid="vat-amount"]')
      expect(vatAmount).toMatch(/CHF\s?\d+\.\d{2}/)
    })

    test('should provide Swiss payment receipt', async ({ page }) => {
      await page.click('[data-testid="payment-method-stripe"]')
      await page.click('[data-testid="proceed-to-payment"]')

      // Complete payment flow (abbreviated)
      await page.fill('[data-testid="card-number"]', '4242424242424242')
      await page.fill('[data-testid="card-expiry"]', '1234')
      await page.fill('[data-testid="card-cvc"]', '123')
      await page.fill('[data-testid="billing-name"]', 'John Doe')
      await page.click('[data-testid="submit-payment"]')

      await page.waitForURL(/.*\/booking\/success.*/)

      // Verify receipt contains required Swiss elements
      await page.click('[data-testid="download-receipt"]')

      // Verify receipt download
      const download = await page.waitForEvent('download')
      expect(download.suggestedFilename()).toMatch(/receipt_.*\.pdf/)

      // The receipt should contain (would need PDF parsing in real test):
      // - Business name and address
      // - Swiss VAT number
      // - Date and transaction ID
      // - Itemized services
      // - VAT breakdown
      // - Total amount in CHF
    })

    test('should handle currency conversion for foreign cards', async ({ page }) => {
      await page.click('[data-testid="payment-method-stripe"]')
      await page.click('[data-testid="proceed-to-payment"]')

      // Use foreign card (EUR)
      await page.fill('[data-testid="card-number"]', '4000000000000003') // EUR card
      await page.fill('[data-testid="card-expiry"]', '1234')
      await page.fill('[data-testid="card-cvc"]', '123')
      await page.fill('[data-testid="billing-name"]', 'Jean Dupont')
      await page.fill('[data-testid="billing-country"]', 'FR')

      await page.click('[data-testid="submit-payment"]')

      // Should still show CHF amounts but mention conversion
      await expect(page.locator('[data-testid="currency-conversion-notice"]')).toBeVisible()
    })
  })

  test.describe('Error Handling and Recovery', () => {
    test('should handle network timeout gracefully', async ({ page }) => {
      await page.click('[data-testid="payment-method-stripe"]')

      // Simulate slow network
      await page.route('**/create-payment-intent', route => {
        setTimeout(() => route.continue(), 10000) // 10 second delay
      })

      await page.click('[data-testid="proceed-to-payment"]')

      // Should show loading state
      await expect(page.locator('[data-testid="payment-loading"]')).toBeVisible()

      // Should eventually timeout and show error
      await expect(page.locator('[data-testid="payment-timeout-error"]')).toBeVisible()
      await expect(page.locator('[data-testid="retry-payment-button"]')).toBeVisible()
    })

    test('should preserve appointment when payment fails', async ({ page }) => {
      const confirmationCode = await page.textContent('[data-testid="appointment-confirmation-code"]')

      await page.click('[data-testid="payment-method-stripe"]')
      await page.click('[data-testid="proceed-to-payment"]')

      // Trigger payment failure
      await page.fill('[data-testid="card-number"]', '4000000000000002')
      await page.fill('[data-testid="card-expiry"]', '1234')
      await page.fill('[data-testid="card-cvc"]', '123')
      await page.click('[data-testid="submit-payment"]')

      // Verify appointment is still reserved
      await expect(page.locator('[data-testid="appointment-reserved-notice"]')).toBeVisible()

      // Should be able to try payment again
      await page.click('[data-testid="try-payment-again"]')
      await expect(page.locator('[data-testid="payment-method-stripe"]')).toBeVisible()

      // Confirmation code should remain the same
      const newConfirmationCode = await page.textContent('[data-testid="appointment-confirmation-code"]')
      expect(newConfirmationCode).toBe(confirmationCode)
    })
  })
})

// Helper function
async function completeBookingToPayment(page: Page) {
  await page.goto('/book')

  // Select service
  await page.click('[data-testid="service-card-haircut"]')

  // Select date (1 week from now)
  const futureDate = new Date()
  futureDate.setDate(futureDate.getDate() + 7)
  await page.click('[data-testid="date-picker"]')
  await page.click(`[data-date="${futureDate.toISOString().split('T')[0]}"]`)

  // Select time
  await page.waitForSelector('[data-testid="time-slot"]')
  await page.click('[data-testid="time-slot"]:first-child')

  // Select staff
  await page.click('[data-testid="staff-member"]:first-child')

  // Fill customer info
  await page.fill('[data-testid="customer-first-name"]', 'John')
  await page.fill('[data-testid="customer-last-name"]', 'Doe')
  await page.fill('[data-testid="customer-email"]', 'john.doe@example.com')
  await page.fill('[data-testid="customer-phone"]', '+41791234567')

  // Continue to payment
  await page.click('[data-testid="continue-to-review"]')
  await page.click('[data-testid="continue-to-payment"]')
}