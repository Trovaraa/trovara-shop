import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const root = new URL('../', import.meta.url)
const lock = JSON.parse(readFileSync(new URL('package-lock.json', root), 'utf8'))
const entries = Object.entries(lock.packages)
const versions = name => entries.filter(([path]) => path.endsWith('/node_modules/' + name) || path === 'node_modules/' + name).map(([, pkg]) => pkg.version)
const atLeast = (version, minimum) => {
  assert.match(version, /^\d+\.\d+\.\d+$/, 'security floor requires a stable release')
  const a = version.split('.').map(Number), b = minimum.split('.').map(Number)
  return a[0] > b[0] || (a[0] === b[0] && (a[1] > b[1] || (a[1] === b[1] && a[2] >= b[2])))
}

test('Node2Shell runtime floor is pinned for builds and CI', () => {
  assert.equal(readFileSync(new URL('.nvmrc', root), 'utf8').trim(), '24.22.1')
  assert.equal(JSON.parse(readFileSync(new URL('package.json', root), 'utf8')).engines.node, '>=24.22.1 <25')
  assert.equal(lock.packages[''].engines.node, '>=24.22.1 <25')
  assert.equal(process.versions.node.split('.')[0], '24')
  assert.ok(atLeast(process.versions.node, '24.22.1'), 'Use patched Node from .nvmrc')
})

test('Vite and Vitest mocker include October security fixes in every installed copy', () => {
  assert.ok(versions('vite').length > 0)
  for (const version of versions('vite')) assert.ok(atLeast(version, '6.4.5'), version)
  for (const name of ['vitest', '@vitest/mocker']) {
    for (const version of versions(name)) assert.ok(atLeast(version, '4.1.12'), name + ' ' + version)
  }
})

test('Tailwind v4 removes the unpatched braces dependency chain', () => {
  for (const name of ['braces', 'micromatch', 'fast-glob']) assert.deepEqual(versions(name), [], name)
  assert.ok(versions('tailwindcss').length > 0)
  for (const version of versions('tailwindcss')) assert.ok(atLeast(version, '4.3.3'))
  assert.ok(versions('@tailwindcss/postcss').length > 0)
})

test('all nested brace-expansion resolutions include the DoS fixes', () => {
  assert.ok(versions('brace-expansion').length > 0)
  for (const version of versions('brace-expansion')) {
    const major = Number(version.split('.')[0])
    const minimum = major === 1 ? '1.1.21' : major === 2 ? '2.1.7' : major === 3 ? '3.0.1' : '5.0.12'
    assert.ok(atLeast(version, minimum), version)
  }
})

test('URI and IP parsers cannot regress to the vulnerable override versions', () => {
  for (const version of versions('fast-uri')) assert.ok(atLeast(version, '3.1.9'), version)
  for (const version of versions('ip-address')) assert.ok(atLeast(version, '10.7.2'), version)
})

test('Happy DOM includes the complete ESM alias injection fix', () => {
  assert.ok(versions('happy-dom').length > 0)
  for (const version of versions('happy-dom')) assert.ok(atLeast(version, '21.0.4'), version)
})

