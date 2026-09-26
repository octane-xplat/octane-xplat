import type { KbdProps } from "./props";
import { applyEscapeProps } from "./escape-props";

/** Kbd — keyboard key glyph. */
export function Kbd(props: KbdProps) @{
	<kbd ref={(e: any) => applyEscapeProps(e, props)} id={props.id} className={['vx-kbd', props.className]} style={props.style}>
		{props.children}
	</kbd>
}
