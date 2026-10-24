import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { validateSecurityHeaders } from './security-headers.mjs'

const policy = "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; object-src 'none'; frame-ancestors 'none'"
const headers = `HTTP/2 200\r\nContent-Security-Policy: ${policy}\r\nPermissions-Policy: camera=()\r\nStrict-Transport-Security: max-age=31536000\r\nX-Content-Type-Options: nosniff\r\nReferrer-Policy: same-origin\r\n`

test('accepts correctly quoted policy with case-insensitive HTTP headers', () => {
  assert.doesNotThrow(() => validateSecurityHeaders(headers))
})
test('rejects the production regression where shell quoting stripped CSP quotes', () => {
  assert.throws(() => validateSecurityHeaders(headers.replaceAll("'", '')), /Unquoted CSP keyword/)
})
test('rejects a second policy that blocks scripts even when the first is correct', () => {
  assert.throws(() => validateSecurityHeaders(headers + `Content-Security-Policy: ${policy.replace("script-src 'self'", "script-src 'none'")}\r\n`), /Expected script-src/)
})
test('rejects missing CSP', () => {
  assert.throws(() => validateSecurityHeaders(headers.replace(`Content-Security-Policy: ${policy}\r\n`, '')), /Missing required content-security-policy/)
})
test('rejects policies allowing arbitrary external scripts', () => {
  assert.throws(() => validateSecurityHeaders(headers.replace("script-src 'self'", "script-src *")), /Expected script-src/)
})

test('nginx indexes only public landing URLs and preserves noindex before JS', () => {
  const config = readFileSync(new URL('../docs/nginx-shop.trovara.farm.conf.example', import.meta.url), 'utf8')
  const map = config.match(/map \$request_uri \$trovara_shop_robots \{([\s\S]*?)\}/)?.[1]
  assert.ok(map)
  assert.match(map, /default "noindex, nofollow";/)
  assert.deepEqual([...map.matchAll(/"([^"]+)" "index, follow";/g)].map((match) => match[1]), ['/', '/shop', '/shop/'])
  assert.equal((config.match(/add_header X-Robots-Tag \$trovara_shop_robots always;/g) ?? []).length, 3)
  const sitemap = readFileSync(new URL('../public/sitemap.xml', import.meta.url), 'utf8')
  assert.deepEqual([...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]), ['https://shop.trovara.farm/'])
})
