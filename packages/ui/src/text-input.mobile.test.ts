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

vi.mock('./escape-props', () => ({ applyEscapeProps: () => {} }))
vi.mock('./Icon.tsrx', async () => {
	const { defineUniversalComponent } = await import('octane/universal/native')
	return { Icon: defineUniversalComponent('nativescript', () => null) }
})

import { TextInput } from './TextInput.tsrx'
import { TextArea } from './TextArea.tsrx'
import { SearchInput } from './SearchInput.tsrx'

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
			const bind = (handle: any) => {
				inputHandle = handle
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

			root.render(Component as any, { value: 'hello', onChange: change, bind, icon: false })
			await vi.waitFor(() => expect(text).toBe('hello'))
			expect(change).not.toHaveBeenCalled()
			expect(selection).toEqual([2, 4])
			root.render(Component as any, { value: 'x', onChange: change, bind, icon: false })
			await vi.waitFor(() => expect(text).toBe('x'))
			expect(change).not.toHaveBeenCalled()
			expect(selection).toEqual([1, 1])
			// A native edit still reaches the callback exactly once.
			text = 'xy'
			flushUniversalSync(() =>
				container.dispatchEvent(node, 'textchange', { object: node, value: text }),
			)
			expect(change).toHaveBeenCalledExactlyOnceWith('xy')
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
