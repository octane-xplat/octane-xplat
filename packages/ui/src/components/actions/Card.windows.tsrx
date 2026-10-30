/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle, styleRecord } from '../../internal/layout/style-merge'
import type { View } from '@nativescript/core'
import { TextSlot } from '../forms/text-slot'
import type { CardProps } from '../../props'
import { cx } from '@octane-xplat/lib'
import { applyEscapeProps } from '../overlays/escape-props'

/** Card — native slots and explicit padding edges override the theme inset.
 * Windows shorthand setters otherwise lose to class-derived edge values. */
export function Card(props: CardProps): unknown @{
	<masonview
		ref={(v: View | null) => applyEscapeProps(v, props)}
		id={props.id}
		className={cx(
			'vx-card',
			props.variant && `vx-card--${props.variant}`,
			props.elevation && `vx-card--elev-${props.elevation}`,
			props.className,
		)}
		style={mergeStyle(
			{ display: 'flex' },
			{
				...styleRecord(props.style),
				...(props.padding == null
					? {}
					: {
							paddingTop: props.padding * 4,
							paddingRight: props.padding * 4,
							paddingBottom: props.padding * 4,
							paddingLeft: props.padding * 4,
						}),
				width: props.width,
				height: props.height,
				maxWidth: props.maxWidth,
			},
		)}
	>
		{props.header != null ? (
			<masonview className="vx-card-header" style={{ display: 'flex' }}>
				<TextSlot>{props.header}</TextSlot>
			</masonview>
		) : null}
		<masonview className="vx-card-body" style={{ display: 'flex' }}>
			<TextSlot>{props.children}</TextSlot>
		</masonview>
		{props.footer != null ? (
			<masonview className="vx-card-footer" style={{ display: 'flex' }}>
				<TextSlot>{props.footer}</TextSlot>
			</masonview>
		) : null}
	</masonview>
}
