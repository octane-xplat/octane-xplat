/** @jsxImportSource @octane-xplat/jsx/dom */
import type { SeparatorProps } from './props'
import { applyEscapeProps } from './escape-props'

/** Separator — hairline rule (exported as `Divider`). `orientation` picks
 *  the axis; `variant` the stroke weight; `label` centers text between two
 *  rule segments; `isFullBleed` escapes the parent's inline padding. */
export function Separator(props: SeparatorProps) @{
	const vertical = props.orientation === 'vertical'
	const classes = [
		'vx-separator',
		vertical ? 'vx-separator--v' : 'vx-separator--h',
		props.variant === 'strong' && 'vx-separator--strong',
		props.isFullBleed && 'vx-separator--bleed',
		props.className,
	]

	@if (props.label != null) {
		<div
			ref={(e: any) => applyEscapeProps(e, props)}
			id={props.id}
			role="separator"
			aria-orientation={vertical ? 'vertical' : 'horizontal'}
			className={[...classes, 'vx-separator--labeled']}
			style={props.style}
		>
			<span className="vx-separator-rule" />
			<span className="vx-separator-label">{props.label}</span>
			<span className="vx-separator-rule" />
		</div>
	} @else {
		<div
			ref={(e: any) => applyEscapeProps(e, props)}
			id={props.id}
			role="separator"
			aria-orientation={vertical ? 'vertical' : 'horizontal'}
			className={classes}
			style={props.style}
		/>
	}
}
