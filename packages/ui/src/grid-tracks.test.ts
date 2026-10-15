import { describe, expect, it, vi } from 'vitest'
import {
	gridTrackListToCss,
	gridTrackListToSpec,
	parseGridTrackList,
} from './grid-tracks'

import { bindNativeGridPlacement } from './native-grid-placement'

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

	it('emits host specs padded with auto tracks and CSS templates', () => {
		expect(gridTrackListToSpec('*,*', 'columns', 4)).toBe('1*,1*,auto,auto')
		expect(gridTrackListToSpec(undefined, 'rows')).toBeUndefined()
		expect(gridTrackListToCss('auto,120,2*', 'rows')).toBe('auto 120px 2fr')
		expect(gridTrackListToCss(undefined, 'columns')).toBeUndefined()
	})
})

describe('native host reconciliation', () => {
	function hostStub() {
		return {
			rows: undefined as string | undefined,
			columns: undefined as string | undefined,
			eachChildView: (fn: (view: any) => boolean) => {
				void fn
				return true
			},
			addChild() {},
			insertChild() {},
			removeChild() {},
		}
	}

	it('normalizes track lists before writing host rows/columns', () => {
		const host = hostStub()
		const unbind = bindNativeGridPlacement(host, '0.5* 40px, auto', ['2*', 96])
		expect(host.rows).toBe('0.5*,40,auto')
		expect(host.columns).toBe('2*,96')
		unbind()
	})

	it('writes auto tracks for out-of-grammar tokens', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
		try {
			const host = hostStub()
			const unbind = bindNativeGridPlacement(host, 'minmax(0,1fr)', '*,*')
			expect(host.rows).toBe('auto,auto')
			expect(host.columns).toBe('1*,1*')
			unbind()
		} finally {
			warn.mockRestore()
		}
	})
})
