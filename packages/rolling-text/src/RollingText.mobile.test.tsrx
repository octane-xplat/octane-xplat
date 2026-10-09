/** @jsxImportSource @nativescript-community/octane */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createObjectContainer, createObjectDriver, createUniversalRoot, flushUniversalSync } from 'octane/universal/native'

// Native modules are stubbed — the object driver needs no real NS runtime.
vi.mock('@nativescript/core', () => ({
	isIOS: false,
	isAndroid: true,
	Application: { on: () => {}, off: () => {}, ios: undefined, android: {} },
	Device: { sdkVersion: 30 },
	Utils: { android: { getApplicationContext: () => ({}) } },
}))
vi.mock('@nativescript/core/animation-frame', () => ({
	requestAnimationFrame: (cb: () => void) => setTimeout(cb, 16) as any,
	cancelAnimationFrame: (id: any) => clearTimeout(id),
}))

import { RollingText } from './RollingText.tsrx'

function mount(props: any) {
	const container = createObjectContainer('nativescript')
	const root = createUniversalRoot(container, createObjectDriver('nativescript'))
	root.render(RollingText as any, props)
	return { container, root }
}

function row(container: any) {
	return container.children[0]
}

function cellTexts(container: any) {
	return (row(container)?.children ?? []).map((cell: any) => cell.children[0]?.props?.text)
}

describe('RollingText (native leaf, object driver)', () => {
	beforeEach(() => {
		vi.useFakeTimers()
	})

	afterEach(() => {
		vi.useRealTimers()
	})

	it('mounts settled cells and carries the whole value as the row label', () => {
		const { container, root } = mount({ value: '9 seconds' })
		const host = row(container)
		expect(host.props.accessibilityLabel).toBe('9 seconds')
		expect(host.props.accessibilityRole).toBe('text')
		expect(cellTexts(container).join('')).toBe('9 seconds')
		root.unmount()
	})

	it('rolls changed units and keeps survivors', async () => {
		const { container, root } = mount({ value: '9 seconds' })
		const before = [...row(container).children]
		flushUniversalSync(() => root.render(RollingText as any, { value: '10 seconds' }))
		// Ghost '9' stays in place while '1','0' enter ahead of the survivors.
		expect(cellTexts(container).join('')).toBe('910 seconds')
		expect(row(container).children[3]).toBe(before[1])
		expect(row(container).children[1].opacity).toBe(0)
		vi.advanceTimersByTime(1000)
		flushUniversalSync(() => {})
		expect(cellTexts(container).join('')).toBe('10 seconds')
		root.unmount()
	})

	it('updates the semantic label immediately under a queued update', () => {
		const { container, root } = mount({ value: 'a', updatePolicy: 'latest' })
		flushUniversalSync(() => root.render(RollingText as any, { value: 'b', updatePolicy: 'latest' }))
		flushUniversalSync(() => root.render(RollingText as any, { value: 'c', updatePolicy: 'latest' }))
		expect(row(container).props.accessibilityLabel).toBe('c')
		vi.advanceTimersByTime(500)
		flushUniversalSync(() => {})
		vi.advanceTimersByTime(500)
		flushUniversalSync(() => {})
		expect(cellTexts(container).join('')).toBe('c')
		root.unmount()
	})

	it('reducedMotion="always" commits instantly', () => {
		const { container, root } = mount({ value: 'a', reducedMotion: 'always' })
		flushUniversalSync(() =>
			root.render(RollingText as any, { value: 'b', reducedMotion: 'always' }),
		)
		expect(cellTexts(container).join('')).toBe('b')
		root.unmount()
	})

	it('unmount clears pending timers and tweens', () => {
		const { container, root } = mount({ value: 'a' })
		flushUniversalSync(() => root.render(RollingText as any, { value: 'b' }))
		root.unmount()
		expect(container.children.length).toBe(0)
		vi.advanceTimersByTime(2000)
		expect(container.children.length).toBe(0)
	})
})
