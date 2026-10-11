/** @jsxImportSource @nativescript-community/octane */
import { TextSlot } from './text-slot';
import type { KbdProps } from "./props";
import { cx } from "@octane-xplat/lib";
import { applyEscapeProps } from "./escape-props";

/** Kbd — keyboard key glyph. */
export function Kbd(props: KbdProps) @{
	<flexboxlayout ref={(v: any) => applyEscapeProps(v, props)} id={props.id} className={cx('vx-kbd', props.className)} style={props.style}>
		<TextSlot className="vx-kbd-text">{props.children}</TextSlot>
	</flexboxlayout>
}
