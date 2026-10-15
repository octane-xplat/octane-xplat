import { expect, it } from 'vitest'
import { normalizeBadgeLabel } from '../src/normalizeBadgeLabel'

it('trims surrounding whitespace from a badge label', () => {
	expect(normalizeBadgeLabel('  Ready  ')).toBe('Ready')
})
