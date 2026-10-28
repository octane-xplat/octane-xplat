/** @jsxImportSource @octane-xplat/jsx */
import { expect, it, vi } from 'vitest'
import {
	createObjectContainer,
	createObjectDriver,
	createUniversalRoot,
	flushUniversalSync,
} from 'octane/universal/native'

import { ScrollableArea } from './ScrollableArea.tsrx'
import type { ScrollableAreaHandle } from './props'

vi.mock('./escape-props', () => ({
	applyEscapeProps() {},
	nativeAccessibilityRole() {},
	nativeAccessibilityState() {},
}))

vi.mock('./refresh', () => ({ createPullToRefresh() {} }))
vi.mock('./ActivityIndicator.tsrx', () => ({ ActivityIndicator: () => null }))

it('exposes the native scroll viewport through its imperative handle', () => {
	const ref = { current: null as ScrollableAreaHandle | null }
	const container = createObjectContainer('nativescript')
	const driver = createObjectDriver('nativescript')
	const getPublicInstance = driver.getPublicInstance.bind(driver)
	driver.getPublicInstance = (container, id) => {
		const host: any = getPublicInstance(container, id)
		if (host.type === 'scrollview') {
			host.scrollTo = vi.fn()
		}

		return host
	}

	const root = createUniversalRoot(container, driver)
	try {
		flushUniversalSync(() => root.render(ScrollableArea as any, { ref, height: 200 }))
		expect((ref.current?.native as any)?.type).toBe('scrollview')
		expect(ref.current?.native).toBe(container.children[0])
		ref.current!.scrollToOffset({ block: 120 })
		expect((ref.current!.native as any).scrollTo).toHaveBeenCalledWith({
			top: 120,
			behavior: 'instant',
		})
	} finally {
		root.unmount()
	}

	expect(ref.current).toBeNull()
})
