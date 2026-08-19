import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import AccountHomeView from './AccountHomeView.vue'

vi.mock('@/lib/shop', () => {
  class ShopApiError extends Error {
    status = 0
    needsVerification = false
    needsSignIn = false
  }

  return {
    ShopApiError,
    formatShopPrice: () => 'Price on request',
    isAllowedPaystackCheckoutUrl: () => false,
    shopApi: {
      session: vi.fn().mockResolvedValue({
        csrfToken: 'test-csrf',
        account: {
          id: 'account-1',
          email: 'legacy@example.com',
          name: 'Legacy customer',
          phone: null,
        },
      }),
      catalog: vi.fn().mockResolvedValue({
        farm: { name: 'Trovara Farm' },
        deliverySlots: [
          {
            id: 'slot-1',
            label: 'Saturday morning',
            dayOfWeek: 6,
            startTime: '09:00',
            endTime: '12:00',
            cutoffHours: 24,
          },
        ],
        products: [
          {
            id: 'plantain-1',
            sku: 'PLT-001',
            name: 'Plantain',
            unit: 'kg',
            priceKobo: 250_000,
            currency: 'NGN',
            description: 'Fresh from Trovara Farm.',
            category: 'Fresh from Trovara',
            provenance: 'trovara_grown',
            familyBasketQuantity: 2,
          },
          {
            id: 'tomato-1',
            sku: 'TOM-001',
            name: 'Tomatoes',
            unit: 'kg',
            priceKobo: 180_000,
            currency: 'NGN',
            description: 'Supplied by a trusted farmer.',
            category: 'Trovara Sourced',
            provenance: 'trovara_sourced',
            familyBasketQuantity: 1,
          },
        ],
      }),
      orders: vi.fn().mockResolvedValue({ orders: [] }),
      me: vi.fn().mockResolvedValue({ account: {}, channels: [] }),
      credits: vi.fn().mockResolvedValue({
        credits: {
          balance: 0,
          referralCode: 'TRVTEST',
          referralUrl: 'https://trovara.farm/survey?ref=TRVTEST',
          referralCount: 1,
          referralPendingCount: 1,
          referralActivatedCount: 0,
          welcomeCredits: 2_000,
          welcomeCreditAwarded: false,
          referralCredits: 1_000,
          referralRefundWindowDays: 2,
          transactions: [],
        },
      }),
    },
  }
})

describe('AccountHomeView credit status', () => {
  it('makes a legacy account zero balance and missing welcome award explicit', async () => {
    const wrapper = mount(AccountHomeView)
    await flushPromises()

    const creditsTab = wrapper
      .findAll('button')
      .find((button) => button.text().includes('Trovara Credits'))
    expect(creditsTab).toBeDefined()
    await creditsTab!.trigger('click')

    expect(wrapper.text()).toContain('Trovara Credits available now')
    expect(wrapper.text()).toContain('Welcome credits not awarded')
    expect(wrapper.text()).toContain(
      'This account has not received the 2,000 welcome-credit award.',
    )
    expect(wrapper.text()).toContain('Not awarded')
    expect(wrapper.find('.credit-balance-on-dark').exists()).toBe(true)
    expect(wrapper.text()).toContain('1,000 Trovara Credits pending')
    expect(wrapper.text()).toContain('Trovara Credits · 1 referral')
  })

  it('builds a configurable Family Basket and labels sourced food clearly', async () => {
    const wrapper = mount(AccountHomeView)
    await flushPromises()

    expect(wrapper.text()).toContain('Family Basket')
    expect(wrapper.text()).toContain('Trovara grown · Traceable')
    expect(wrapper.text()).toContain('Trovara Sourced')

    const buildButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('Build my Family Basket'))
    expect(buildButton).toBeDefined()
    await buildButton!.trigger('click')

    expect(wrapper.text()).toContain('2 kg included in your Family Basket and cannot be removed.')
    expect(wrapper.text()).toContain('1 kg included in your Family Basket and cannot be removed.')
    expect(wrapper.text()).toContain('Standard Family Basket item')
  })
})
