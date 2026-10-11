/** @jsxImportSource @octane-xplat/macos-renderer */
import type { KbdProps } from "./props";
import { cx } from "@octane-xplat/lib";
import { applyEscapeProps } from "./escape-props";

/** Kbd — keyboard key glyph. */
export function Kbd(props: KbdProps) @{
	<flexboxlayout ref={(v: any) => applyEscapeProps(v, props)} id={props.id} className={cx('vx-kbd', props.className)} style={props.style}>
		{props.children}
	</flexboxlayout>
}
