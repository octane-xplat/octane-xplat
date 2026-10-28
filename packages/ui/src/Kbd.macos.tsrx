/** @jsxImportSource @octane-xplat/macos-renderer */
import { mergeStyle } from './style-merge'
import type { KbdProps } from './props'
import { cx } from '@octane-xplat/lib'
import { applyEscapeProps } from './escape-props'

/** Kbd — keyboard key glyph. */
export function Kbd(props: KbdProps) @{
	<masonview
		ref={(v: any) => applyEscapeProps(v, props)}
		id={props.id}
		className={cx('vx-kbd', props.className)}
		style={mergeStyle({ display: 'flex' }, props.style)}
	>
		{props.children}
	</masonview>
}
