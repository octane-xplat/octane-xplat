/** @jsxImportSource @nativescript-community/octane */
import { mergeStyle } from './style-merge'
import { TextSlot } from './text-slot'
import type { BadgeProps } from './props'
import { cx } from '@octane-xplat/lib'
import { applyEscapeProps } from './escape-props'

/** Badge — inline label chip. Pure composition; `vx-badge` supplies only the
 *  inline-flex row so apps own all visual styling. */
export function Badge(props: BadgeProps) @{
	<masonview
		ref={(v: any) => applyEscapeProps(v, props)}
		id={props.id}
		className={cx('vx-badge', props.className)}
		style={mergeStyle({ display: 'flex', flexDirection: 'row' }, props.style)}
	>
		<TextSlot className="vx-badge-text">{props.children}</TextSlot>
	</masonview>
}
