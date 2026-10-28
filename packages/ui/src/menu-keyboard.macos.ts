import type { KeyboardEvent } from './use-keyboard.types'

interface Row { key: string; label: string; submenu: boolean }
interface Options {
	rows(): Row[]
	focused(): string | undefined
	focus(key: string): boolean
	press(key: string): void
	openSubmenu(key: string): void
	closeLevel?: () => void
	closeMenu(): void
	direction(): 'ltr' | 'rtl'
}

/** Menu intent only: native row ordering/focus and layer closure stay with owners. */
export function createAppKitMenuKeyboard(options: Options, now = Date.now) {
	let text = '', at = 0
	const reset = () => { text = ''; at = 0 }
	return {
		reset,
		keyDown(event: KeyboardEvent) {
			if (event.defaultPrevented || event.isComposing || event.altKey || event.ctrlKey || event.metaKey) return
			if (event.key === 'Tab') { reset(); options.closeMenu(); return } // Preserve native Tab movement.
			if (event.key === 'Escape') return // The existing layer owns Escape and accepted-close restoration.
			const rows = options.rows(), focused = options.focused(), index = rows.findIndex((row) => row.key === focused)
			const stop = () => { event.preventDefault(); event.stopPropagation() }
			const move = (next: number) => { if (rows[next] && options.focus(rows[next].key)) stop() }
			switch (event.key) {
				case 'ArrowDown': move(index < 0 ? 0 : (index + 1) % rows.length); return
				case 'ArrowUp': move(index <= 0 ? rows.length - 1 : index - 1); return
				case 'Home': move(0); return
				case 'End': move(rows.length - 1); return
				case 'Enter':
				case ' ':
					if (index >= 0) { stop(); options.press(rows[index].key) }
					return
			}
			const forward = options.direction() === 'rtl' ? 'ArrowLeft' : 'ArrowRight'
			const backward = options.direction() === 'rtl' ? 'ArrowRight' : 'ArrowLeft'
			if (event.key === forward && index >= 0 && rows[index].submenu) { stop(); options.openSubmenu(rows[index].key); return }
			if (event.key === backward && options.closeLevel) { stop(); reset(); options.closeLevel(); return }
			if (event.key.length !== 1) return
			const stamp = now(), previous = stamp - at < 500 ? text : ''
			text = previous + event.key.toLowerCase(); at = stamp
			const repeated = [...text].every((char) => char === text[0]), prefix = repeated ? text[0] : text
			const start = repeated ? index + 1 : 0, ordered = [...rows.slice(start), ...rows.slice(0, start)]
			const match = ordered.find((row) => row.label.trim().toLowerCase().startsWith(prefix))
			if (match && options.focus(match.key)) stop()
		},
	}
}
