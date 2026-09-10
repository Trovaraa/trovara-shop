import { readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

export function validateSecurityHeaders(raw) {
  const headers = new Map()
  for (const line of raw.split(/\r?\n/)) {
    const index = line.indexOf(':')
    if (index < 1) continue
    const name = line.slice(0, index).toLowerCase()
    headers.set(name, [...(headers.get(name) ?? []), line.slice(index + 1).trim()])
  }
  for (const name of [
    'content-security-policy', 'permissions-policy', 'strict-transport-security',
    'x-content-type-options', 'referrer-policy',
  ]) {
    if (!headers.get(name)?.some(Boolean)) throw new Error(`Missing required ${name} header`)
  }

  // Browsers enforce every CSP, including comma-joined duplicate headers.
  for (const policy of headers.get('content-security-policy').flatMap(value => value.split(','))) {
    const directives = new Map()
    for (const part of policy.split(';')) {
      const [name, ...sources] = part.trim().split(/\s+/)
      if (!name) continue
      if (directives.has(name)) throw new Error(`Duplicate CSP directive: ${name}`)
      if (sources.some(source => source === 'self' || source === 'none')) {
        throw new Error(`Unquoted CSP keyword in ${name}; use 'self' or 'none'`)
      }
      directives.set(name, sources)
    }
    for (const name of ['default-src', 'script-src', 'style-src', 'connect-src']) {
      const sources = directives.get(name)
      if (sources?.length !== 1 || sources[0] !== "'self'") {
        throw new Error(`Expected ${name} 'self' so the shop can load its own assets and API`)
      }
    }
    for (const name of ['object-src', 'frame-ancestors']) {
      const sources = directives.get(name)
      if (sources?.length !== 1 || sources[0] !== "'none'") {
        throw new Error(`Expected ${name} 'none'`)
      }
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    validateSecurityHeaders(readFileSync(0, 'utf8'))
  } catch (error) {
    console.error(`ERROR: ${error.message}`)
    process.exitCode = 1
  }
}
