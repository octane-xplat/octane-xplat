import { describe, expect, it } from 'vitest'
import { getOutlineFromViewCapabilities, useOutlineFromView } from './outline-view.macos.tsrx'

describe('useOutlineFromView (macOS)', () => {
	it('reports discovery as unsupported while the AppKit bridge loses heading semantics', () => {
		expect(getOutlineFromViewCapabilities()).toEqual({ isSupported: false, mode: 'unsupported' })
		expect(useOutlineFromView({ current: { accessibilityRole: 'header' } })).toEqual([])
	})
})
