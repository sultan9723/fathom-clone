import { describe, expect, it } from 'vitest'
import { PHASE_DEVELOPMENT_SERVER, PHASE_PRODUCTION_BUILD, PHASE_PRODUCTION_SERVER } from 'next/constants'
import config from '../next.config.mjs'

describe('Next.js build output isolation', () => {
  it('keeps development workers outside the production build directory', () => {
    expect(config(PHASE_DEVELOPMENT_SERVER).distDir).toBe('.next-dev')
    expect(config(PHASE_DEVELOPMENT_SERVER).distDir).not.toBe(config(PHASE_PRODUCTION_BUILD).distDir)
  })

  it('serves production from the same directory used by the production build', () => {
    expect(config(PHASE_PRODUCTION_BUILD).distDir).toBe('.next')
    expect(config(PHASE_PRODUCTION_SERVER).distDir).toBe(config(PHASE_PRODUCTION_BUILD).distDir)
  })
})
