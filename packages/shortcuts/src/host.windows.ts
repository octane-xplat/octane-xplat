import type { ShortcutEvent } from './engine/types/public.js'
import { cleanupAll, delay, pathDepth, pathFrom, unwrap, type ShortcutHost } from './host-types.js'
import { windowsCode } from './physical-codes.js'

const projection = () => globalThis as any
const named: Record<number, string> = {
	8: 'Backspace',
	9: 'Tab',
	13: 'Enter',
	16: 'Shift',
	17: 'Ctrl',
	18: 'Alt',
	19: 'Pause',
	20: 'CapsLock',
	27: 'Escape',
	32: ' ',
	33: 'PageUp',
	34: 'PageDown',
	35: 'End',
	36: 'Home',
	37: 'ArrowLeft',
	38: 'ArrowUp',
	39: 'ArrowRight',
	40: 'ArrowDown',
	44: 'PrintScreen',
	45: 'Insert',
	46: 'Delete',
	91: 'Meta',
	92: 'Meta',
	93: 'ContextMenu',
	144: 'NumLock',
	145: 'ScrollLock',
}

// Flag 4 makes ToUnicodeEx observational: it must not change the editor's dead-key state.
function keyboard(api: any) {
	const win32 = api.win32
	const state = new Uint8Array(256)
	const output = new Uint16Array(16)
	const pointer = (buffer: ArrayBufferView) => {
		const address = Number(api.interop.pointerKey(api.interop.pointerFromBuffer(buffer)))
		if (!Number.isSafeInteger(address) || address <= 0) {
			throw new Error('Invalid Win32 keyboard buffer')
		}
		return { type: 'pointer', value: address }
	}
	const statePointer = pointer(state),
		outputPointer = pointer(output)
	const uint = (value: number) => ({ type: 'u32', value })
	const call = (name: string, result: string, ...args: object[]) =>
		win32.call('user32.dll', name, result, ...args)
	return (args: any) => {
		if (!call('GetKeyboardState', 'bool', statePointer)) {
			throw new Error('GetKeyboardState failed')
		}
		const altKey = Boolean(state[18] & 128),
			ctrlKey = Boolean(state[17] & 128)
		const metaKey = Boolean((state[91] | state[92]) & 128),
			shiftKey = Boolean(state[16] & 128)
		const vk = Number(args.Key),
			scan = Number(args.KeyStatus?.ScanCode ?? 0)
		let key = named[vk] ?? (vk >= 112 && vk <= 135 ? `F${vk - 111}` : '')
		let composing = vk === 229 || Number(args.OriginalKey) === 229
		if (!key && !composing) {
			// Ctrl transforms letters into control characters. Translate the text-layout
			// key without it, while retaining Ctrl+Alt (AltGr) and Shift layout behavior.
			if (ctrlKey && !altKey) {
				state[17] = state[162] = state[163] = 0
			}
			const layout = call('GetKeyboardLayout', 'pointer', uint(0))
			const count = Number(
				call(
					'ToUnicodeEx',
					'i32',
					uint(vk),
					uint(scan),
					statePointer,
					outputPointer,
					{ type: 'i32', value: output.length },
					uint(4),
					{ type: 'pointer', value: layout },
				),
			)
			composing = count < 0
			key =
				count < 0
					? 'Dead'
					: count > 0
						? String.fromCharCode(...output.subarray(0, Math.min(count, output.length)))
						: 'Unidentified'
		}
		return {
			key: key || 'Unidentified',
			code: windowsCode(scan, Boolean(args.KeyStatus?.IsExtendedKey)),
			altKey,
			ctrlKey,
			metaKey,
			shiftKey,
			isComposing: composing,
		}
	}
}

export const host: ShortcutHost = {
	delay,
	platform: () => 'windows',
	boundaryDepth: pathDepth,
	isEditableTarget(target) {
		const parent = projection().Microsoft?.UI?.Xaml?.Media?.VisualTreeHelper
		return pathFrom(target, (node) => parent?.GetParent(node)).some((node) => {
			const name = (node as any)?.GetType?.()?.FullName ?? ''
			return /\.(TextBox|RichEditBox|PasswordBox|ComboBox)$/.test(name)
		})
	},
	subscribe(target, callbacks) {
		const element = unwrap(target)
		const { Microsoft, NSWinRT } = projection()
		const ui = Microsoft?.UI?.Xaml
		if (
			!element?.XamlRoot ||
			typeof element.AddHandler !== 'function' ||
			!ui?.UIElement?.PreviewKeyDownEvent ||
			!ui.UIElement.PreviewKeyUpEvent ||
			!ui.Input?.KeyEventHandler ||
			!ui.RoutedEventHandler ||
			!NSWinRT?.win32?.call ||
			!NSWinRT.interop?.pointerFromBuffer
		) {
			throw new Error(
				'Shortcuts require an attached WinUI element and the NativeScript Win32 keyboard projection',
			)
		}
		const read = keyboard(NSWinRT)
		const releases: (() => void)[] = []
		let active = true
		const receive = (type: string, args: any) => {
			if (!active || args.Handled) {
				return
			}
			const focus = args.OriginalSource ?? element
			const path = pathFrom(focus, (node) => ui.Media.VisualTreeHelper.GetParent(node))
			let prevented = false
			const event: ShortcutEvent = {
				type,
				...read(args),
				target: focus,
				repeat: type === 'keydown' && Boolean(args.KeyStatus?.WasKeyDown),
				get defaultPrevented() {
					return prevented
				},
				preventDefault: () => {
					prevented = true
					args.Handled = true
				},
				stopPropagation: () => {
					args.Handled = true
				},
				composedPath: () => [...path],
			}
			if (type === 'keydown') {
				callbacks.capture?.(event)
			}
			callbacks.key(event)
		}
		try {
			for (const [type, routed] of [
				['keydown', ui.UIElement.PreviewKeyDownEvent],
				['keyup', ui.UIElement.PreviewKeyUpEvent],
			]) {
				const handler = new ui.Input.KeyEventHandler((_sender: unknown, args: any) =>
					receive(type, args),
				)
				element.AddHandler(routed, handler, true)
				releases.push(() => element.RemoveHandler(routed, handler))
			}
			for (const routed of [ui.UIElement.LostFocusEvent, ui.FrameworkElement.UnloadedEvent]) {
				if (!routed) {
					continue
				}
				const handler = new ui.RoutedEventHandler(() => {
					if (active) {
						callbacks.reset()
					}
				})
				element.AddHandler(routed, handler, true)
				releases.push(() => element.RemoveHandler(routed, handler))
			}
		} catch (error) {
			active = false
			cleanupAll(releases)
			throw error
		}
		return () => {
			if (active) {
				active = false
				cleanupAll(releases)
			}
		}
	},
}
