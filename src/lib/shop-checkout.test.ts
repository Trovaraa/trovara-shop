import { describe, expect, it } from 'vitest'
import { isAllowedPaystackCheckoutUrl } from './shop'

describe('Paystack checkout destination', () => {
  it('accepts only the documented HTTPS checkout origin', () => {
    expect(isAllowedPaystackCheckoutUrl('https://checkout.paystack.com/abc')).toBe(true)
    expect(isAllowedPaystackCheckoutUrl('https://checkout.paystack.com:443/abc')).toBe(true)
  })
  it.each([
    'https://other.paystack.com/abc', 'https://paystack.com/abc',
    'https://checkout.paystack.com.evil.example/abc', 'https://checkout.paystack.com@evil.example/abc',
    'https://user:password@checkout.paystack.com/abc', 'https://checkout.paystack.com:8443/abc',
    'http://checkout.paystack.com/abc', 'javascript:alert(1)', '//checkout.paystack.com/abc', '',
  ])('rejects untrusted or ambiguous destination %s', value => {
    expect(isAllowedPaystackCheckoutUrl(value)).toBe(false)
  })
})
