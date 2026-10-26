/** @jsxImportSource @nativescript-community/octane */
import type { KbdProps } from "./props";
import { cx } from '@octane-xplat/lib'

const aliases: Record<string, string> = {
	mod: '⌘', cmd: '⌘', command: '⌘', ctrl: 'Ctrl', control: 'Ctrl',
	shift: '⇧', alt: '⌥', option: '⌥',
	up: '↑', down: '↓', left: '←', right: '→',
	enter: '↩', return: '↩', escape: 'Esc', esc: 'Esc', space: 'Space', backspace: '⌫', delete: 'Del', tab: 'Tab',
};

/** Kbd — key glyph; `keys="mod+k"` renders one cap per chord segment. */
export function Kbd(props: KbdProps) @{
	const caps = props.keys != null ? props.keys.split('+').map((k: string) => aliases[k.trim().toLowerCase()] ?? k.trim().toUpperCase()) : null;
	<masonview id={props.id} className={cx('vx-kbd-group', props.className)} style={props.style}>
		{caps ? caps.map((cap: string, i: number) => <label key={i} className="vx-kbd" text={cap} />) : <label className="vx-kbd" text={typeof props.children === 'string' ? props.children : ''} />}
	</masonview>
}
