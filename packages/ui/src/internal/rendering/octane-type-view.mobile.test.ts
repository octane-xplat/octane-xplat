import { describe, expect, it } from 'vitest'
import { compileToVolarMappings } from 'octane/compiler'

describe('Octane type views after type-only exports', () => {
  const helpers = `
    function first() { const value = 1; return value }
    function second() { const value = 2; return value }
  `

  it.each([
    "import type { Item } from './items'; export type { Item };",
    "export type * from './items';",
  ])('keeps later declarations in their own scopes after %s', (exports) => {
    const result = compileToVolarMappings(exports + helpers, 'fixture.tsrx', { loose: true })

    expect(result.errors).toEqual([])
  })

  it('still reports repeated declarations in the same scope', () => {
    const result = compileToVolarMappings(
      `export type * from './items';
       function example() { const value = 1; const value = 2; return value }`,
      'fixture.tsrx',
      { loose: true },
    )

    expect(result.errors.some((error) => error.code === 'TS2451')).toBe(true)
  })
})
