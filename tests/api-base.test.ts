import { describe, it, expect, afterEach, vi } from 'vitest'

const ORIGINAL_ENV = { ...process.env }

/** api-base reads process.env at call time, so each case re-imports it fresh. */
async function load() {
  vi.resetModules()
  return import('../lib/api-base')
}

afterEach(() => {
  process.env = { ...ORIGINAL_ENV }
})

describe('apiUrl', () => {
  it('uses NEXT_PUBLIC_API_URL when it is set', async () => {
    process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com/api'
    const { apiUrl } = await load()
    expect(apiUrl()).toBe('https://api.example.com/api')
  })

  it('strips a trailing slash so paths do not double up', async () => {
    process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com/api/'
    const { apiPath } = await load()
    expect(apiPath('/v1/meetings')).toBe('https://api.example.com/api/v1/meetings')
  })

  it('falls back to the local backend in development', async () => {
    delete process.env.NEXT_PUBLIC_API_URL
    process.env.NODE_ENV = 'development'
    const { apiUrl } = await load()
    // Not localhost:3000 — that is the Next app itself, which 404s every call.
    expect(apiUrl()).toBe('http://localhost:8000/api')
  })

  it('throws a clear error in production when the variable is unset', async () => {
    delete process.env.NEXT_PUBLIC_API_URL
    process.env.NODE_ENV = 'production'
    const { apiUrl } = await load()
    expect(() => apiUrl()).toThrowError(/NEXT_PUBLIC_API_URL is not set/)
  })

  it('treats a blank variable as unset rather than using an empty base', async () => {
    process.env.NEXT_PUBLIC_API_URL = '   '
    process.env.NODE_ENV = 'production'
    const { apiUrl } = await load()
    expect(() => apiUrl()).toThrowError(/NEXT_PUBLIC_API_URL is not set/)
  })
})
