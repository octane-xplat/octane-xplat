import { describe, expect, it } from 'vitest'
import { octaneServerStrategy } from './strategy.js'
import { typescriptServerStrategy } from '@nativescript/vite/framework'

describe('octaneServerStrategy', () => {
  it('is the TypeScript device pipeline under the octane flavor', () => {
    expect(octaneServerStrategy.flavor).toBe('octane')
    expect(octaneServerStrategy.matchesFile?.('/workspace/Screen.tsrx')).toBe(true)
    expect(octaneServerStrategy.matchesFile?.('/workspace/Screen.spec.ts')).toBe(false)
    expect(octaneServerStrategy.matchesFile?.('/workspace/node_modules/library/index.ts')).toBe(
      false,
    )
    expect(octaneServerStrategy.processFile).toBe(typescriptServerStrategy.processFile)
    expect(octaneServerStrategy.buildRegistry).toBe(typescriptServerStrategy.buildRegistry)
  })

  it('defers the delta broadcast until its own cache purge + re-transform has run', () => {
    expect(octaneServerStrategy.deferDeltaBroadcast).toBe(true)
    expect(octaneServerStrategy.handleHotUpdate).not.toBe(typescriptServerStrategy.handleHotUpdate)
  })
})
