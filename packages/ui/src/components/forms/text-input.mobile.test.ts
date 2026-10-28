import { describe, expect, it, vi } from 'vitest'
import {
	createObjectContainer,
	createObjectDriver,
	createUniversalRoot,
	flushUniversalSync,
} from 'octane/universal/native'

vi.mock('@nativescript/core', () => ({
	isIOS: false,
	isAndroid: true,
	Utils: { layout: { toDeviceIndependentPixels: (value: number) => value } },
}))

vi.mock('../overlays/escape-props', () => ({
	applyEscapeProps: () => {},
	nativeAccessibilityState: (state: any) => (state?.disabled ? 'disabled' : undefined),
}))

vi.mock('../media/Icon.tsrx', async () => {
	const { defineUniversalComponent } = await import('octane/universal/native')
	return { Icon: defineUniversalComponent('nativescript', () => null) }
})

import { TextInput } from './TextInput.tsrx'
import { TextArea } from './TextArea.tsrx'
import { SearchInput } from './SearchInput.tsrx'
import { fitTextArea } from './text-area-fit'

// NativeScript Property raises a synchronous textChange on script writes.
// Model that event here, through the real compiled leaves and event dispatch.
// This is regression coverage, not keyboard/IME/device evidence.
describe('native controlled input writes', () => {
	for (const [name, Component] of [
		['TextInput', TextInput],
		['TextArea', TextArea],
		['SearchInput', SearchInput],
	] as const) {
		it(`${name} does not report controlled writes as user edits`, async () => {
			const container = createObjectContainer('nativescript')
			const root = createUniversalRoot(container, createObjectDriver('nativescript'))
			const change = vi.fn()
			let node: any
			let inputHandle: any
			let text = ''
			let selection = [2, 4]
			const ref = (handle: any) => {
				inputHandle = handle
				if (!handle) {
					return
				}

				node = handle.native
				node.style = {}
				node.android = {
					getSelectionStart: () => selection[0],
					getSelectionEnd: () => selection[1],
					setSelection: (start: number, end: number) => {
						selection = [start, end]
					},
				}

				Object.defineProperty(node, 'text', {
					configurable: true,
					get: () => text,
					set: (value) => {
						text = value
						container.dispatchEvent(node, 'textchange', { object: node, value })
					},
				})
			}

			root.render(Component, { value: 'hello', onChange: change, ref, icon: false })
			await vi.waitFor(() => expect(text).toBe('hello'))
			expect(change).not.toHaveBeenCalled()
			expect(selection).toEqual([2, 4])
			root.render(Component, { value: 'x', onChange: change, ref, icon: false })
			await vi.waitFor(() => expect(text).toBe('x'))
			expect(change).not.toHaveBeenCalled()
			expect(selection).toEqual([1, 1])
			// A native edit still reaches the callback exactly once.
			text = 'xy'
			flushUniversalSync(() =>
				container.dispatchEvent(node, 'textchange', { object: node, value: text }),
			)

			expect(change).toHaveBeenCalledExactlyOnceWith('xy')
			await vi.waitFor(() => expect(text).toBe('x'))
			text = 'xy'
			flushUniversalSync(() =>
				container.dispatchEvent(node, 'textchange', { object: node, value: text }),
			)
			expect(change).toHaveBeenCalledTimes(2)
			await vi.waitFor(() => expect(text).toBe('x'))
			const dismiss = vi.fn()
			const clearFocus = vi.fn()
			node.android.clearFocus = clearFocus
			node.dismissSoftInput = dismiss // NativeScript returns void and has no blur method.
			expect(() => inputHandle.blur()).not.toThrow()
			expect(dismiss).toHaveBeenCalledTimes(1)
			expect(clearFocus).toHaveBeenCalledTimes(1)
			root.unmount()
		})
	}
})

describe('native TextArea row sizing', () => {
	it('refits after native load and removes the loaded listener on cleanup', () => {
		let loaded: (() => void) | undefined
		const view = {
			ios: { font: { lineHeight: 10 } },
			style: {} as any,
			on: vi.fn((_event: string, callback: () => void) => {
				loaded = callback
			}),
			off: vi.fn((_event: string, callback: () => void) => {
				if (loaded === callback) loaded = undefined
			}),
		}
		const dispose = fitTextArea(view, { rows: 2 })
		view.ios.font.lineHeight = 20
		loaded!()
		expect(view.style.minHeight).toBe(40)
		dispose()
		expect(loaded).toBeUndefined()
		expect(view.off).toHaveBeenCalledExactlyOnceWith('loaded', expect.any(Function))
	})

	it('releases fixed and bounded limits as sizing modes change', () => {
		const view = { ios: { font: { lineHeight: 20 } }, style: {} as any }
		fitTextArea(view, {})
		expect(view.style).toMatchObject({ minHeight: 60, maxHeight: 60 })
		fitTextArea(view, { autoGrow: true, rows: 2, maxRows: 4 })
		expect(view.style).toMatchObject({ minHeight: 40, maxHeight: 80 })
		fitTextArea(view, { autoGrow: true, rows: 2 })
		expect(view.style.minHeight).toBe(40)
		expect(view.style.maxHeight).toBeUndefined()
		fitTextArea(view, { style: { height: 30 } })
		expect(view.style.minHeight).toBeUndefined()
		expect(view.style.maxHeight).toBeUndefined()
	})
	it('preserves authored constraints and recomputes native font metrics', () => {
		const view = { ios: { font: { lineHeight: 20 } }, style: {} as any }
		fitTextArea(view, { rows: 2, style: { minHeight: '25%', maxHeight: 200 } })
		expect(view.style.minHeight).toBe('25%')
		expect(view.style.maxHeight).toBe(200)
		fitTextArea(view, { style: { height: 30, minHeight: 15, maxHeight: 50 } })
		expect(view.style).toMatchObject({ minHeight: 15, maxHeight: 50 })
		view.ios.font.lineHeight = 30
		fitTextArea(view, { rows: 2 })
		expect(view.style).toMatchObject({ minHeight: 60, maxHeight: 60 })
	})
})
