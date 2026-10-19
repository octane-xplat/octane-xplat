/** @jsxImportSource @nativescript-community/octane */
import { describe, expect, it, vi } from 'vitest'
import {
	createObjectContainer,
	createObjectDriver,
	createUniversalRoot,
	flushUniversalSync,
} from 'octane/universal/native'

vi.mock('@nativescript/core', () => ({ GridLayout: class {}, isIOS: false, isAndroid: true }))
vi.mock('@nativescript-community/ui-pager', () => ({ Pager: class {} }))
vi.mock('@nativescript-community/octane', async (original) => ({
	...(await original<any>()),
	NATIVESCRIPT_RENDERER_ID: 'nativescript',
	registerElement() {},
	createNativeScriptRoot: vi.fn(),
}))

import { Pager } from './Pager.tsrx'

const props = { items: ['a', 'b', 'c'], renderItem: () => null }
function mount() {
	const container = createObjectContainer('nativescript')
	const driver = createObjectDriver('nativescript')
	const root = createUniversalRoot(container, driver)
	return {
		container,
		root,
		render: (extra: any = {}) =>
			flushUniversalSync(() => root.render(Pager, { ...props, ...extra })),
	}
}

describe('native pager', () => {
	it('mutes delayed programmatic echoes and reports subsequent user pages once', async () => {
		const { root, container, render } = mount()
		const onPageChange = vi.fn()
		try {
			render({ page: 0, onPageChange })
			render({ page: 2, onPageChange })
			await vi.waitFor(() => expect((container.children[0] as any).selectedIndex).toBe(2))
			const host = container.children[0]
			container.dispatchEvent(host, 'selectedIndexChange', { value: 2 })
			expect(onPageChange).not.toHaveBeenCalled()
			container.dispatchEvent(host, 'selectedIndexChange', { value: 1 })
			container.dispatchEvent(host, 'selectedIndexChange', { value: 1 })
			expect(onPageChange).toHaveBeenCalledExactlyOnceWith(1)
		} finally {
			root.unmount()
		}
	})

	it.each([
		['row', 2],
		['accessible', false],
		['accessibilityLabel', 'Pages'],
		['accessibilityRole', 'heading'],
		['accessibilityHint', 'Swipe'],
		['accessibilityValue', 'Page two'],
		['accessibilityState', { disabled: true }],
		['accessibilityLiveRegion', 'polite'],
	])('forwards and refreshes %s without another prop changing', (key, value) => {
		const { root, container, render } = mount()
		try {
			render()
			render({ [key]: value })
			// `row` is layout sugar — it lands as `gridRow` in the style bag, not
			// as an element prop.
			const childProps = container.children[0].props
			const got = key === 'row' ? childProps.style?.gridRow : childProps[key]
			const expected =
				key === 'row'
					? '3 / span 1'
					: key === 'accessibilityRole'
						? 'header'
						: key === 'accessibilityState'
							? 'disabled'
							: value

			expect(got).toEqual(expected)
			render()
			const afterProps = container.children[0].props
			expect(key === 'row' ? afterProps.style?.gridRow : afterProps[key]).toBeUndefined()
		} finally {
			root.unmount()
		}
	})
})
