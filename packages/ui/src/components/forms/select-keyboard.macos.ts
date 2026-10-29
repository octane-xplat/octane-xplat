import type { SelectOption } from '../../props'
import type { KeyboardEvent } from '../../internal/keyboard/use-keyboard.types'

interface Options {
	open(): boolean
	blocked(): boolean
	pending(): boolean
	multiple(): boolean
	searchable(): boolean
	hasClear(): boolean
	hasSelectAll(): boolean
	enabled(): SelectOption[]
	selected(): string[]
	focused(): string | undefined
	editing(): boolean
	focus(value: string): boolean
	requestOpen(edge: 'first' | 'last', value?: string): void
	close(target: 'anchor' | 'next' | 'previous'): void
	query(value: string): void
	focusSearch(): void
	pick(option: SelectOption): void
	clear(): void
	selectAll(): void
}

/** SelectView.web key policy adapted to native focus ownership; no host objects escape. */
export function createAppKitSelectKeyboard(options: Options, now = Date.now) {
	let text = '', at = 0
	const reset = () => { text = ''; at = 0 }
	return {
		reset,
		keyDown(event: KeyboardEvent) {
			if (event.defaultPrevented || event.isComposing || options.blocked() || event.altKey) return
			const editing = options.editing(), open = options.open()
			if (event.ctrlKey || event.metaKey) {
				if (open && !editing && options.multiple() && options.hasSelectAll() && event.key.toLowerCase() === 'a') {
					event.preventDefault()
					if (!options.pending()) options.selectAll()
				}
				return
			}
			const enabled = options.enabled(), focused = options.focused()
			const active = enabled.find((option) => option.value === focused) ??
				enabled.find((option) => options.selected().includes(option.value)) ?? enabled[0]
			const index = active ? enabled.indexOf(active) : -1
			const move = (edge: 'first' | 'last', value?: string) => {
				if (!open) { options.requestOpen(edge, value); event.preventDefault(); return }
				if (value !== undefined && options.focus(value)) event.preventDefault()
			}
			switch (event.key) {
				case 'ArrowDown':
					move('first', open ? enabled[Math.min(enabled.length - 1, focused ? index + 1 : Math.max(index, 0))]?.value : undefined); return
				case 'ArrowUp':
					move('last', open ? enabled[Math.max(0, focused ? index - 1 : enabled.length - 1)]?.value : undefined); return
				case 'Home':
				case 'End':
					if (editing || !open) return
					move(event.key === 'Home' ? 'first' : 'last', enabled[event.key === 'Home' ? 0 : enabled.length - 1]?.value); return
				case 'PageUp':
				case 'PageDown':
					if (open) move(event.key === 'PageUp' ? 'first' : 'last', enabled[event.key === 'PageUp' ? 0 : enabled.length - 1]?.value)
					return
				case 'Enter':
				case ' ':
					if (event.key === ' ' && editing) return
					event.preventDefault()
					if (!open) options.requestOpen('first')
					else if (active && !options.pending()) options.pick(active)
					return
				case 'Escape':
					if (open) { event.preventDefault(); event.stopPropagation(); reset(); options.close('anchor') }
					return
				case 'Tab':
					if (open) { event.preventDefault(); reset(); options.close(event.shiftKey ? 'previous' : 'next') }
					return
				case 'Backspace':
				case 'Delete':
					if (!editing && !open && options.hasClear() && !options.pending()) { event.preventDefault(); options.clear() }
					return
			}
			if (editing || event.key.length !== 1) return
			event.preventDefault()
			if (options.searchable()) {
				options.query(event.key)
				if (!open) options.requestOpen('first')
				else options.focusSearch()
				return
			}
			const stamp = now(), previous = stamp - at < 500 ? text : ''
			text = previous + event.key.toLowerCase(); at = stamp
			const repeated = [...text].every((char) => char === text[0])
			const prefix = repeated ? text[0] : text, start = repeated ? index + 1 : 0
			const ordered = [...enabled.slice(start), ...enabled.slice(0, start)]
			const match = ordered.find((option) => (option.label ?? option.value).toLowerCase().startsWith(prefix))
			if (!match) return
			if (!open && !options.multiple()) { if (!options.pending()) options.pick(match) }
			else if (!open) options.requestOpen('first', match.value)
			else options.focus(match.value)
		},
	}
}
