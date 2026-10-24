// nginx mirrors this policy in X-Robots-Tag before JavaScript runs.
export function shopRobots(path: string, hasQuery = false, authenticated = false): string {
  return !hasQuery && !authenticated && ['/', '/shop', '/shop/'].includes(path)
    ? 'index, follow'
    : 'noindex, nofollow'
}

export function applyShopIndexing(path: string, hasQuery = false, authenticated = false) {
  const robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]')
  if (robots) robots.content = shopRobots(path, hasQuery, authenticated)
  const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!canonical) return
  if (shopRobots(path, hasQuery, authenticated) === 'index, follow') {
    canonical.href = 'https://shop.trovara.farm/'
  } else {
    canonical.removeAttribute('href')
  }
}
