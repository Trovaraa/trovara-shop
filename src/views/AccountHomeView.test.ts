import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { shopApi, ShopApiError } from '@/lib/shop'
import AccountHomeView from './AccountHomeView.vue'

vi.mock('@/lib/shop', () => {
  class ShopApiError extends Error {
    status = 0
    needsVerification = false
    needsSignIn = false

    constructor(message: string, _status?: number, _needsVerification?: boolean, _needsSignIn?: boolean, readonly code?: string) {
      super(message)
    }
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
      placeOrder: vi.fn().mockResolvedValue({ reference: 'TEST-ORDER' }),
      me: vi.fn().mockResolvedValue({ account: {}, channels: [] }),
      linkCode: vi.fn().mockResolvedValue({
        code: 'ABC123',
        expiresAt: '2099-01-01T12:00:00.000Z',
      }),
      basket: vi.fn().mockResolvedValue({
        basket: { items: [], familyBasketActive: false, updatedAt: null },
      }),
      saveBasket: vi.fn().mockResolvedValue({
        basket: { items: [], familyBasketActive: false, updatedAt: null },
      }),
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

describe('Shop landing', () => {
  it('lets a guest view the standard basket before adding it and sign in inside Shop', async () => {
    vi.mocked(shopApi.session).mockResolvedValueOnce({ csrfToken: 'test-csrf', account: null })
    const wrapper = mount(AccountHomeView, { attachTo: document.body })
    await flushPromises()

    const findButton = (label: string) => wrapper.findAll('button').find((button) => button.text() === label)!
    await findButton('My orders').trigger('click')
    await findButton('View the Family Basket').trigger('click')
    await flushPromises()

    expect(wrapper.get('#family-basket').text()).toBe('Trovara Family Basket')
    expect(document.activeElement).toBe(wrapper.get('#family-basket').element)
    expect(wrapper.text()).toContain('0 items')

    await findButton('Sign in').trigger('click')
    await flushPromises()
    expect(wrapper.get('#shop-account-heading').text()).toBe('Sign in to Trovara Shop')
    expect(document.activeElement).toBe(wrapper.get('#shop-account-heading').element)
    wrapper.unmount()
  })

  it('offers product forecasts and waitlists when the public shop has no saleable products', async () => {
    vi.mocked(shopApi.session).mockResolvedValueOnce({ csrfToken: 'test-csrf', account: null })
    vi.mocked(shopApi.catalog).mockResolvedValueOnce({ farm: { name: 'Trovara Farm' }, deliverySlots: [], products: [] })
    const wrapper = mount(AccountHomeView)
    await flushPromises()

    expect(wrapper.text()).toContain('No products are on sale right now')
    expect(wrapper.text()).not.toContain('View the Family Basket')
    expect(wrapper.get('section a').text()).toBe('View products & waitlists')
    wrapper.unmount()
  })

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
    expect(wrapper.text()).toContain(
      'Saved to your account so your linked WhatsApp or Telegram bot can see it.',
    )
  })

  it('restores an unfinished account basket from Trovara OS', async () => {
    vi.mocked(shopApi.basket).mockResolvedValueOnce({
      basket: {
        items: [{ productId: 'plantain-1', quantity: 3 }],
        familyBasketActive: false,
        updatedAt: '2026-08-21T12:00:00.000Z',
      },
    })

    const wrapper = mount(AccountHomeView)
    await flushPromises()

    expect(wrapper.text()).toContain('3 items')
    expect(wrapper.text()).toContain('3 × kg')
    expect(wrapper.text()).toContain(
      'Saved to your account so your linked WhatsApp or Telegram bot can see it.',
    )

    wrapper.unmount()
  })

  it('links the shop account through Telegram or the live WhatsApp bot', async () => {
    const wrapper = mount(AccountHomeView)
    await flushPromises()

    const connectTab = wrapper
      .findAll('button')
      .find((button) => button.text().includes('Connect chat'))
    expect(connectTab).toBeDefined()
    await connectTab!.trigger('click')

    expect(wrapper.text()).toContain('Connect Telegram or WhatsApp')
    expect(wrapper.text()).not.toContain('WhatsApp later')

    const createCodeButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('Create a secure link code'))
    expect(createCodeButton).toBeDefined()
    await createCodeButton!.trigger('click')
    await flushPromises()

    const whatsappLink = wrapper
      .findAll('a')
      .find((link) => link.text().includes('Open WhatsApp'))
    expect(whatsappLink?.attributes('href')).toBe(
      'https://wa.me/2348031350724?text=link%20ABC123',
    )

    wrapper.unmount()
  })
})

describe('delivery windows and Family Basket checkout', () => {
  async function scheduledCatalog() {
    const catalog = await shopApi.catalog()
    const slot = catalog.deliverySlots[0]
    return {
      ...catalog,
      deliveryTimeZone: 'Africa/Lagos' as const,
      deliverySlots: [
        { ...slot, id: 'later', nextDeliveryDate: '2099-05-23', nextOrderCutoffAt: '2099-05-22T08:00:00Z' },
        { ...slot, id: 'closed', nextDeliveryDate: '2020-05-23', nextOrderCutoffAt: '2020-05-22T08:00:00Z' },
        {
          ...slot,
          id: 'soonest',
          label: 'Saturday early',
          startTime: '07:00:00',
          endTime: '08:30:00',
          nextDeliveryDate: '2099-05-16',
          nextOrderCutoffAt: '2099-05-15T06:00:00Z',
        },
        { ...slot, id: 'also-available', nextDeliveryDate: '2099-05-16', nextOrderCutoffAt: '2099-05-15T08:00:00Z' },
      ],
    }
  }

  const button = (wrapper: ReturnType<typeof mount>, label: string) =>
    wrapper.findAll('button').find((candidate) => candidate.text() === label)!

  async function submitCheckout(wrapper: ReturnType<typeof mount>) {
    await wrapper.get('textarea').setValue('Test delivery address')
    wrapper.get('textarea').element.form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    await flushPromises()
  }

  it('shows the earliest scheduled window to guests and omits closed dates', async () => {
    vi.mocked(shopApi.catalog).mockResolvedValueOnce(await scheduledCatalog())
    vi.mocked(shopApi.session).mockResolvedValueOnce({ csrfToken: 'test-csrf', account: null })
    const wrapper = mount(AccountHomeView)
    await flushPromises()

    expect(wrapper.get('section').text()).toContain('Next scheduled delivery')
    expect(wrapper.get('section').text()).toMatch(/16 May 2099.*07:00–08:30 WAT/)
    expect(wrapper.get('details').text()).toMatch(/23 May 2099.*09:00–12:00 WAT/)
    expect(wrapper.get('section').text()).not.toContain('2020')
    expect(wrapper.text()).not.toContain('Complete your order')
    wrapper.unmount()
  })

  it('uses the same scheduled default at checkout and submits the Family Basket intent', async () => {
    vi.mocked(shopApi.catalog).mockResolvedValueOnce(await scheduledCatalog())
    const wrapper = mount(AccountHomeView)
    await flushPromises()

    await button(wrapper, 'Build my Family Basket').trigger('click')
    await button(wrapper, 'Continue to checkout').trigger('click')
    expect(wrapper.get<HTMLInputElement>('input[type="date"]').element.value).toBe('2099-05-16')
    const window = wrapper.get('select').element
    expect(window.value).toBe('soonest')
    expect([...window.options].map((option) => option.value)).not.toContain('closed')
    await submitCheckout(wrapper)

    expect(shopApi.placeOrder).toHaveBeenCalledWith(expect.objectContaining({
      familyBasketActive: true,
      deliverySlotId: 'soonest',
      deliveryDate: '2099-05-16',
      items: [{ productId: 'plantain-1', quantity: 2 }, { productId: 'tomato-1', quantity: 1 }],
    }))
    wrapper.unmount()
  })

  it('keeps legacy checkout usable without advertising a guessed delivery date', async () => {
    const wrapper = mount(AccountHomeView)
    await flushPromises()
    expect(wrapper.text()).not.toContain('Next scheduled delivery')
    await button(wrapper, 'Build my Family Basket').trigger('click')
    await button(wrapper, 'Continue to checkout').trigger('click')
    expect(wrapper.get('select').element.value).toBe('slot-1')
    expect(wrapper.get<HTMLInputElement>('input[type="date"]').element.value).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    wrapper.unmount()
  })

  it('requires review of a saved Family Basket before accepting new standard quantities', async () => {
    vi.mocked(shopApi.basket).mockResolvedValueOnce({
      basket: {
        items: [{ productId: 'plantain-1', quantity: 1 }],
        familyBasketActive: true,
        updatedAt: '2026-08-21T12:00:00.000Z',
      },
    })
    const wrapper = mount(AccountHomeView)
    await flushPromises()

    expect(wrapper.text()).toContain('1 items')
    expect(button(wrapper, 'Continue to checkout').element.disabled).toBe(true)
    await button(wrapper, 'Update Family Basket').trigger('click')
    expect(wrapper.text()).toContain('3 items')
    expect(button(wrapper, 'Continue to checkout').element.disabled).toBe(false)
    wrapper.unmount()
  })

  it('shows a server rejection in checkout and restores the cart for explicit review', async () => {
    const catalog = await scheduledCatalog()
    vi.mocked(shopApi.catalog)
      .mockResolvedValueOnce(catalog)
      .mockResolvedValueOnce({
        ...catalog,
        products: catalog.products.map((product) =>
          product.id === 'tomato-1' ? { ...product, familyBasketQuantity: 2 } : product,
        ),
      })
    vi.mocked(shopApi.placeOrder).mockRejectedValueOnce(new ShopApiError(
      'Family Basket contents changed.', 409, false, false, 'family_basket_changed',
    ))
    const wrapper = mount(AccountHomeView)
    await flushPromises()
    await button(wrapper, 'Build my Family Basket').trigger('click')
    await button(wrapper, 'Continue to checkout').trigger('click')
    await submitCheckout(wrapper)

    expect(wrapper.get('[role="alert"]').text()).toBe('Family Basket contents changed.')
    await button(wrapper, 'Check availability').trigger('click')
    await flushPromises()

    expect(wrapper.text()).not.toContain('Complete your order')
    expect(wrapper.text()).toContain('3 items')
    expect(button(wrapper, 'Continue to checkout').element.disabled).toBe(true)
    await button(wrapper, 'Update Family Basket').trigger('click')
    expect(wrapper.text()).toContain('4 items')
    wrapper.unmount()
  })

  it('keeps standalone products on sale when a standard basket item is unavailable', async () => {
    const catalog = await scheduledCatalog()
    vi.mocked(shopApi.catalog).mockResolvedValueOnce({
      ...catalog,
      familyBasketAvailable: false,
      products: catalog.products.slice(0, 1),
    })
    const wrapper = mount(AccountHomeView)
    await flushPromises()

    expect(wrapper.find('#family-basket').exists()).toBe(false)
    expect(wrapper.text()).toContain('Browse available products')
    await button(wrapper, 'Add to basket').trigger('click')
    await button(wrapper, 'Continue to checkout').trigger('click')
    await submitCheckout(wrapper)
    expect(shopApi.placeOrder).toHaveBeenLastCalledWith(expect.objectContaining({
      familyBasketActive: false,
      items: [{ productId: 'plantain-1', quantity: 1 }],
    }))
    wrapper.unmount()
  })
})
