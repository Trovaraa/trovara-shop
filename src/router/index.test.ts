import { describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { routes } from './index'

async function routerAt(path: string) {
  const router = createRouter({ history: createMemoryHistory(), routes })
  await router.push(path)
  await router.isReady()
  return router
}

describe('Accounts SPA routes', () => {
  it('resolves clean account paths', async () => {
    expect((await routerAt('/')).currentRoute.value.name).toBe('home')
    expect((await routerAt('/verify-email')).currentRoute.value.name).toBe('verify-email')
    expect((await routerAt('/reset-password')).currentRoute.value.name).toBe('reset-password')
  })

  it('aliases /shop paths onto the clean routes and keeps query tokens', async () => {
    const home = await routerAt('/shop')
    expect(home.currentRoute.value.path).toBe('/')
    expect(home.currentRoute.value.name).toBe('home')

    const verify = await routerAt('/shop/verify-email?token=abc')
    expect(verify.currentRoute.value.path).toBe('/verify-email')
    expect(verify.currentRoute.value.name).toBe('verify-email')
    expect(verify.currentRoute.value.query.token).toBe('abc')

    const reset = await routerAt('/shop/reset-password?token=xyz')
    expect(reset.currentRoute.value.path).toBe('/reset-password')
    expect(reset.currentRoute.value.name).toBe('reset-password')
    expect(reset.currentRoute.value.query.token).toBe('xyz')
  })
})
