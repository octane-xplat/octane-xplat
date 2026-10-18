import { describe, expect, it, vi } from 'vitest'
import { gridTrackListToCss, parseGridTrackList } from './grid-tracks'

describe('grid track grammar', () => {
	it('parses the bounded grammar from string and array forms', () => {
		expect(parseGridTrackList('auto,120,2*', 'rows')).toEqual(['auto', '120', '2*'])
		expect(parseGridTrackList('auto * 1.5*', 'columns')).toEqual(['auto', '1*', '1.5*'])
		expect(parseGridTrackList(['auto', 120, '2*'], 'rows')).toEqual(['auto', '120', '2*'])
	})

	it('normalizes px and fr spellings onto dip lengths and star weights', () => {
		expect(parseGridTrackList('48px 2fr', 'rows')).toEqual(['48', '2*'])
		expect(parseGridTrackList('*', 'columns')).toEqual(['1*'])
	})

	it('degrades out-of-grammar tokens to auto with a warn-once diagnostic', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
		try {
			expect(parseGridTrackList('min-content,50%,-4,0*,[names]', 'columns')).toEqual([
				'auto',
				'auto',
				'auto',
				'0',
				'auto',
			])

			const calls = warn.mock.calls.length
			parseGridTrackList('min-content', 'columns')
			expect(warn.mock.calls.length).toBe(calls)
			expect(warn.mock.calls[0][0]).toContain('[Grid]')
			expect(warn.mock.calls[0][0]).toContain('columns')
			expect(warn.mock.calls[0][0]).toContain('min-content')
		} finally {
			warn.mockRestore()
		}
	})

	it('emits CSS grid templates', () => {
		expect(gridTrackListToCss('auto,120,2*', 'rows')).toBe('auto 120px 2fr')
		expect(gridTrackListToCss(undefined, 'columns')).toBeUndefined()
	})
})
