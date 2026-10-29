/** @jsxImportSource @octane-xplat/jsx/dom */
import type { KbdProps } from '../../props'
import { applyEscapeProps } from '../overlays/escape-props'

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform ?? '')
const aliases: Record<string, string> = {
	mod: isMac ? '⌘' : 'Ctrl',
	cmd: '⌘',
	command: '⌘',
	ctrl: 'Ctrl',
	control: 'Ctrl',
	shift: isMac ? '⇧' : 'Shift',
	alt: isMac ? '⌥' : 'Alt',
	option: '⌥',
	up: '↑',
	down: '↓',
	left: '←',
	right: '→',
	enter: isMac ? '↩' : 'Enter',
	return: isMac ? '↩' : 'Enter',
	escape: 'Esc',
	esc: 'Esc',
	space: 'Space',
	backspace: '⌫',
	delete: 'Del',
	tab: 'Tab',
}

function keyCaps(keys: string): string[] {
	return keys.split('+').map((k) => {
		const key = k.trim().toLowerCase()
		return aliases[key] ?? k.trim().toUpperCase()
	})
}

/** Kbd — keyboard key glyph. `keys="mod+shift+p"` renders one cap per
 *  chord segment; `children` render verbatim when `keys` is unset
 *  (Astryx `Kbd`). */
export function Kbd(props: KbdProps) @{
	@if (props.keys != null) {
		<span
			ref={(e: any) => applyEscapeProps(e, props)}
			id={props.id}
			className={['vx-kbd-group', props.className]}
			style={props.style}
		>
			{keyCaps(props.keys).map((cap, i) => (
				<kbd key={i} className="vx-kbd">
					{cap}
				</kbd>
			))}
		</span>
	} @else {
		<kbd
			ref={(e: any) => applyEscapeProps(e, props)}
			id={props.id}
			className={['vx-kbd', props.className]}
			style={props.style}
		>
			{props.children}
		</kbd>
	}
}
