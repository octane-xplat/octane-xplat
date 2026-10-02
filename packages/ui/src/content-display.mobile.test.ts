import { describe, expect, it } from 'vitest'
import { parseOutlineFromMarkdown } from './outline-utils'
import { tokenize } from './code-tokenizer'
import { formatInstant } from './time-format'
import { timerPresentation } from './timer-format'
import { sanitizeUrl } from './safe-url'

describe('portable content display helpers', () => {
	it('builds stable, deduplicated outline items and ignores fenced code', () => {
		expect(
			parseOutlineFromMarkdown(
				['# Setup', '## Install', '## Setup', '```md', '# Not a heading', '```'].join('\n'),
			),
		).toEqual([
			{ id: 'setup', label: 'Setup', level: 1 },
			{ id: 'install', label: 'Install', level: 2 },
			{ id: 'setup-1', label: 'Setup', level: 2 },
		])
	})

	it('returns per-line syntax tokens with source offsets', () => {
		const lines = tokenize('const answer = 42', 'typescript')
		expect(lines).toHaveLength(1)
		expect(lines[0]).toContainEqual({ type: 'keyword', start: 0, end: 5 })
		expect(lines[0]).toContainEqual({ type: 'number', start: 15, end: 17 })
	})

	it('uses one duration for the visible timer and machine-readable value', () => {
		expect(timerPresentation(65_000, 'clock')).toEqual({ dateTime: 'PT65S', text: '1:05' })
		expect(timerPresentation(65_000, 'elapsed')).toEqual({ dateTime: 'PT65S', text: '1m 05s' })
	})

	it('formats explicit timestamp zones without depending on the host zone', () => {
		expect(
			formatInstant(new Date('2025-03-21T14:51:53Z'), 'system_date_time', 'en-US', {
				timeZone: 'UTC',
			}),
		).toBe('2025-03-21 14:51:53')
	})

	it('normalizes safe citation URLs and rejects executable schemes', () => {
		expect(sanitizeUrl(' https://example.com/guide\n')).toBe('https://example.com/guide')
		expect(sanitizeUrl('javascript:alert(1)')).toBeNull()
	})
})
