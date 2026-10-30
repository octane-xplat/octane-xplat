import type { NativeKeyboardEvent } from '@octane-xplat/jsx/intrinsics'
import type { NSView } from '@octane-xplat/platform/macos'

interface State<T> {
	open: boolean
	blocked: boolean
	query: string
	entriesOnFocus: boolean
	items: readonly T[]
	active: number
}

const read = (view: object | null | undefined, key: string) => {
	const value = view && Reflect.get(view, key)
	return typeof value === 'function' ? value.call(view) : value
}

/** Input-owned AppKit combobox keys. Highlighting never moves first responder.
 * Native Tab/modified editing and IME retain their defaults. */
export function createAppKitTypeaheadKeys<T>(options: {
	input(): NSView | null
	state(): State<T>
	notify(event: NativeKeyboardEvent<NSView>): void
	open(): void
	close(): void
	highlight(index: number): void
	select(item: T): void
}) {
	let handling = false
	return (event: NativeKeyboardEvent<NSView>) => {
		if (handling) {
			return
		}
		const input = options.input(),
			window = input?.window
		const owns = () => {
			if (
				!input ||
				!window ||
				options.input() !== input ||
				input.window !== window ||
				event.target !== input ||
				event.currentTarget !== input ||
				read(input, 'hidden') ||
				read(input, 'hiddenOrHasHiddenAncestor')
			) {
				return false
			}
			const responder = window.firstResponder
			return (
				responder === input || (responder != null && responder === read(input, 'currentEditor'))
			)
		}
		if (!owns()) {
			return
		}
		handling = true
		try {
			options.notify(event) // Consumer cancellation precedes built-in navigation.
			if (
				!owns() ||
				event.defaultPrevented ||
				event.isComposing ||
				event.altKey ||
				event.ctrlKey ||
				event.metaKey ||
				read(window?.firstResponder, 'hasMarkedText') ||
				read(read(input, 'currentEditor'), 'hasMarkedText')
			) {
				return
			}

			const state = options.state()
			if (state.blocked || (event.shiftKey && event.key !== 'Tab')) {
				return
			}

			const consume = () => {
				event.preventDefault()
				event.stopPropagation()
			}

			if (!state.open) {
				if (event.key === 'ArrowDown' && (state.entriesOnFocus || state.query.length > 0)) {
					consume()
					options.open()
				}

				return
			}

			const active = state.active >= 0 && state.active < state.items.length ? state.active : -1
			switch (event.key) {
				case 'ArrowDown':
					consume()
					if (state.items.length) {
						options.highlight(active < state.items.length - 1 ? active + 1 : 0)
					}

					break
				case 'ArrowUp':
					consume()
					if (state.items.length) {
						options.highlight(active > 0 ? active - 1 : state.items.length - 1)
					}

					break
				case 'Home':
					consume()
					if (state.items.length) {
						options.highlight(0)
					}

					break
				case 'End':
					consume()
					if (state.items.length) {
						options.highlight(state.items.length - 1)
					}

					break
				case 'Enter':
					consume()
					if (active >= 0) {
						options.select(state.items[active])
					}

					break
				case 'Escape':
					consume()
					options.close()
					break
				case 'Tab':
					options.close()
					break // Native traversal/FocusScope owns Tab and Shift+Tab.
			}
		} finally {
			handling = false
		}
	}
}
