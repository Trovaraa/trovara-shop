import { afterEach, describe, expect, it } from 'vitest'
import { applyShopIndexing, shopRobots } from './indexing'

afterEach(() => { document.head.innerHTML = '' })

describe('Shop indexing boundary', () => {
  it('allows only the public homepage and its aliases', () => {
    for (const path of ['/', '/shop', '/shop/']) {
      expect(shopRobots(path)).toBe('index, follow')
      expect(shopRobots(path, true)).toBe('noindex, nofollow')
      expect(shopRobots(path, false, true)).toBe('noindex, nofollow')
    }
  })
  it('excludes account actions, APIs and unknown routes', () => {
    for (const path of ['/verify-email', '/reset-password', '/credits/claim',
      '/shop/verify-email', '/shop/reset-password', '/shop/credits/claim',
      '/shop/session', '/account', '/missing']) {
      expect(shopRobots(path)).toBe('noindex, nofollow')
    }
  })
  it('updates metadata without leaking token URLs into a canonical', () => {
    document.head.innerHTML = '<meta name="robots" content="index, follow"><link rel="canonical" href="https://shop.trovara.farm/">'
    applyShopIndexing('/reset-password', true)
    expect(document.querySelector<HTMLMetaElement>('meta[name="robots"]')?.content).toBe('noindex, nofollow')
    expect(document.querySelector('link[rel="canonical"]')?.hasAttribute('href')).toBe(false)
    applyShopIndexing('/')
    expect(document.querySelector<HTMLMetaElement>('meta[name="robots"]')?.content).toBe('index, follow')
    expect(document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href).toBe('https://shop.trovara.farm/')
    applyShopIndexing('/', false, true)
    expect(document.querySelector<HTMLMetaElement>('meta[name="robots"]')?.content).toBe('noindex, nofollow')
  })
})
