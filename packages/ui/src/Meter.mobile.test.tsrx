/** @jsxImportSource @nativescript-community/octane */
import { describe, expect, it, vi } from 'vitest'
import { createObjectContainer, createObjectDriver, createUniversalRoot } from 'octane/universal/native'

vi.mock('@nativescript/core', () => ({ isIOS: false, isAndroid: true, ScrollView: class ScrollView {}, Application: {} }))
// Meter registers <svgview> as an import side effect; the object driver does
// not need the vendored element, so stub the router module out.
vi.mock('./svg', () => ({}))

import { Meter } from './Meter.tsrx'

describe('native meter accessibility', () => {
	it('reports the meter fallback role with a human-readable value', () => {
		const container = createObjectContainer('nativescript')
		const root = createUniversalRoot(container, createObjectDriver('nativescript'))
		root.render(Meter as any, {
			value: 6,
			minValue: 0,
			maxValue: 10,
			accessibilityLabel: 'Storage used',
			valueLabel: '6 GB of 10 GB used',
		})

		const host = container.children[0]
		expect(host.props.accessibilityRole).toBe('progressBar')
		expect(host.props.accessibilityLabel).toBe('Storage used')
		expect(host.props.accessibilityValue).toBe('6 GB of 10 GB used')
		root.unmount()
	})

	it('describes the clamped range value by default', () => {
		const container = createObjectContainer('nativescript')
		const root = createUniversalRoot(container, createObjectDriver('nativescript'))
		root.render(Meter as any, { value: 500, minValue: 100, maxValue: 400 })
		const host = container.children[0]
		expect(host.props.accessibilityValue).toBe('400 of 400')
		root.unmount()
	})
})
