/** @jsxImportSource @octane-xplat/macos-renderer */
import { mergeStyle, styleRecord } from './style-merge'
import type { CardProps } from './props'
import { cx } from '@octane-xplat/lib'
import { applyEscapeProps } from './escape-props'

/** Card — container with optional header/footer slots. */
export function Card(props: CardProps) @{
	<masonview
		ref={(v: any) => applyEscapeProps(v, props)}
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
				padding: props.padding == null ? undefined : props.padding * 4,
				width: props.width,
				height: props.height,
				maxWidth: props.maxWidth,
			},
		)}
	>
		{props.header != null ? (
			<masonview className="vx-card-header" style={{ display: 'flex' }}>
				{props.header}
			</masonview>
		) : null}
		<masonview className="vx-card-body" style={{ display: 'flex' }}>
			{props.children}
		</masonview>
		{props.footer != null ? (
			<masonview className="vx-card-footer" style={{ display: 'flex' }}>
				{props.footer}
			</masonview>
		) : null}
	</masonview>
}
