// @vitest-environment node
// eslint-disable-next-line xplat/no-ns-deep-import -- Unit-test the isolated event helper without loading NativeScript UI or a second app bundle.
import { subscribeNativeEvent } from '@nativescript/core/ui/gestures/pointer-events.windows.js'
import { createShortcuts as macShortcuts } from '../src/index.macos'
import { createShortcuts as winShortcuts } from '../src/index.windows'

afterEach(() => vi.unstubAllGlobals())

it('uses the shared AppKit key lease, scopes, native cancellation and cleanup', () => {
	let handlers: any
	const off = vi.fn()
	vi.stubGlobal('__xplatAppKit', {
		keyboardEventsSupported: true,
		observeViewKeys: (_view: object, next: any) => {
			handlers = next
			return off
		},
	})
	const root = { window: {} },
		editor = { superview: root, window: root.window, isEditable: true }
	const shortcuts = macShortcuts({ target: root })
	const call = vi.fn()
	shortcuts.bind({
		combo: 'Mod+k',
		editablePolicy: 'allow-if-meta',
		preventDefault: true,
		handler: call,
	})
	const preventDefault = vi.fn()
	handlers.onKeyDown({
		target: editor,
		key: 'k',
		code: 'KeyK',
		metaKey: true,
		altKey: false,
		ctrlKey: false,
		shiftKey: false,
		repeat: false,
		isComposing: true,
		defaultPrevented: false,
		preventDefault,
		stopPropagation() {},
	})
	expect(call).not.toHaveBeenCalled()
	handlers.onKeyDown({
		target: editor,
		key: 'k',
		code: 'KeyK',
		metaKey: true,
		altKey: false,
		ctrlKey: false,
		shiftKey: false,
		repeat: false,
		isComposing: false,
		defaultPrevented: false,
		preventDefault,
		stopPropagation() {},
	})
	expect(call).toHaveBeenCalledTimes(1)
	expect(preventDefault).toHaveBeenCalledOnce()
	const plain = vi.fn()
	shortcuts.bind('x', plain)
	handlers.onKeyDown({
		target: { superview: root, window: root.window, currentEditor: () => null },
		key: 'x',
		code: 'KeyX',
		repeat: false,
		isComposing: false,
		ctrlKey: false,
		metaKey: false,
		altKey: false,
		shiftKey: false,
		defaultPrevented: false,
		preventDefault,
		stopPropagation() {},
	})
	expect(plain).toHaveBeenCalledOnce()
	shortcuts.dispose()
	shortcuts.dispose()
	expect(off).toHaveBeenCalledOnce()
	handlers.onKeyDown({ target: editor })
	expect(call).toHaveBeenCalledTimes(1)
})

function winHost() {
	const events = new Map<object, any>()
	const buffers = new Map<number, any>()
	let nextAddress = 1
	const state = new Uint8Array(256)
	const translated = { text: 'k', count: 1 }
	const root = {
		XamlRoot: {},
		AddHandler: vi.fn((event, handler) => events.set(event, handler)),
		RemoveHandler: vi.fn((event) => events.delete(event)),
	}
	class TextBox {
		parent = root
	}
	const editor = new TextBox()
	const child = { parent: editor, GetType: () => ({ FullName: 'Microsoft.UI.Xaml.Controls.Grid' }) }
	function Delegate(this: any, callback: (...args: any[]) => void) {
		this.invoke = callback
	}
	const ui = {
		Controls: { TextBox },
		UIElement: { PreviewKeyDownEvent: {}, PreviewKeyUpEvent: {}, LostFocusEvent: {} },
		FrameworkElement: { UnloadedEvent: {} },
		Input: { KeyEventHandler: Delegate },
		RoutedEventHandler: Delegate,
		Media: { VisualTreeHelper: { GetParent: (node: any) => node.parent } },
	}
	const call = vi.fn((_dll, name, _result, ...args) => {
		if (name === 'GetKeyboardState') {
			buffers.get(args[0].value).set(state)
			return true
		}
		if (name === 'GetKeyboardLayout') {
			return 1
		}
		if (name === 'ToUnicodeEx') {
			expect(args[5].value).toBe(4)
			const output = buffers.get(args[3].value)
			for (let i = 0; i < translated.text.length; i++) {
				output[i] = translated.text.charCodeAt(i)
			}
			return translated.count
		}
		throw new Error(name)
	})
	vi.stubGlobal('__xplatWindowsEvents', { subscribe: subscribeNativeEvent })
	vi.stubGlobal('Microsoft', { UI: { Xaml: ui } })
	vi.stubGlobal('NSWinRT', {
		win32: { call },
		interop: {
			pointerFromBuffer: (buffer: any) => buffer,
			pointerKey: (buffer: any) => {
				buffers.set(nextAddress, buffer)
				return String(nextAddress++)
			},
		},
	})
	const key = (vk: number, scan: number, options = {}) => {
		const args = {
			Key: vk,
			OriginalKey: vk,
			KeyStatus: { ScanCode: scan, WasKeyDown: false },
			OriginalSource: child,
			Handled: false,
			...options,
		}
		events.get(ui.UIElement.PreviewKeyDownEvent).invoke(root, args)
		return args
	}
	return { root, child, state, translated, call, key, events, ui }
}

it('uses WinUI typed routed leases and Win32 logical keys without mutating dead-key state', () => {
	const f = winHost()
	f.state[17] = 128
	const shortcuts = winShortcuts({ target: f.root })
	const call = vi.fn()
	shortcuts.bind({
		combo: 'Mod+k',
		editablePolicy: 'allow-if-meta',
		preventDefault: true,
		handler: call,
	})
	const plain = vi.fn()
	shortcuts.bind('k', plain)
	f.state[17] = 0
	f.key(75, 37)
	expect(plain).not.toHaveBeenCalled()
	f.state[17] = 128
	expect(f.key(75, 37).Handled).toBe(true)
	expect(call).toHaveBeenCalledOnce()
	const translated = f.call.mock.calls.find((args) => args[1] === 'ToUnicodeEx')!
	expect(translated[8].value).toBe(4)
	f.translated.count = -1
	expect(f.key(75, 37).Handled).toBe(false)
	expect(call).toHaveBeenCalledOnce()
	f.translated.count = 1
	f.key(229, 37)
	expect(call).toHaveBeenCalledOnce()
	shortcuts.dispose()
	shortcuts.dispose()
	expect(f.root.RemoveHandler).toHaveBeenCalledTimes(4)
	expect(f.events.size).toBe(0)
})

it('shares the WinUI event-property fallback between independent owners', () => {
	const f = winHost()
	f.root.AddHandler.mockImplementation(() => {
		throw new Error('HRESULT 0x80004002')
	})
	for (const [name, event] of [
		['PreviewKeyDown', f.ui.UIElement.PreviewKeyDownEvent],
		['PreviewKeyUp', f.ui.UIElement.PreviewKeyUpEvent],
		['LostFocus', f.ui.UIElement.LostFocusEvent],
		['Unloaded', f.ui.FrameworkElement.UnloadedEvent],
	] as const) {
		Object.defineProperty(f.root, name, {
			set(handler) {
				if (handler) {
					f.events.set(event, handler)
				} else {
					f.events.delete(event)
				}
			},
		})
	}
	const first = winShortcuts({ target: f.root })
	const second = winShortcuts({ target: f.root })
	const called = vi.fn()
	second.bind({ combo: 'k', editablePolicy: 'allow-in-editable', handler: called })
	first.dispose()
	f.key(75, 37)
	expect(called).toHaveBeenCalledOnce()
	second.dispose()
	expect(f.events.size).toBe(0)
})

it('rolls back partially attached native listeners and attempts all cleanup', () => {
	const f = winHost()
	f.root.AddHandler.mockImplementationOnce((event, handler) => f.events.set(event, handler))
	f.root.AddHandler.mockImplementationOnce(() => {
		throw new Error('attach failure')
	})
	Object.defineProperty(f.root, 'PreviewKeyUp', {
		set() {
			throw new Error('attach failure')
		},
	})
	expect(() => winShortcuts({ target: f.root })).toThrow('attach failure')
	expect(f.root.RemoveHandler).toHaveBeenCalledTimes(2)
	expect(f.events.size).toBe(0)
})

it('fails explicitly before attaching in unavailable desktop hosts', () => {
	expect(() => macShortcuts({ target: {} })).toThrow('AppKit')
	expect(() => winShortcuts({ target: {} })).toThrow('WinUI')
})
