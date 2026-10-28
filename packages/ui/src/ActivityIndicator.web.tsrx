/** @jsxImportSource @octane-xplat/jsx/dom */
import type { ActivityIndicatorProps } from './props'
import { applyWebProps } from './platformProps.web'

const sizePx: Record<string, number> = { xsm: 12, sm: 16, md: 20, lg: 24, xl: 32 }

/** ActivityIndicator — exported as `Spinner` (Astryx). `size` picks the
 *  diameter, `shade="onMedia"` raises the track contrast for imagery,
 *  `label` renders text/node beside the ring. */
export function ActivityIndicator(props: ActivityIndicatorProps) @{
	if (props.busy === false) {
		return null
	}

	const size = typeof props.size === 'number' ? props.size : sizePx[props.size ?? 'md']
	const labeled = props.label != null
	const ring = (
		<div
			id={props.id}
			className={[
				'vx-spinner',
				props.shade === 'onMedia' && 'vx-spinner--onmedia',
				!labeled && props.className,
			]}
			style={
				labeled
					? { width: size, height: size }
					: { width: size, height: size, ...((props.style as object) ?? {}) }
			}
			role="progressbar"
			ref={(el: any) => applyWebProps(el, props.web)}
		/>
	)

	@if (labeled) {
		<div
			id={props.id}
			className={['vx-spinner-row', props.className]}
			style={{ gap: 8, ...((props.style as object) ?? {}) }}
		>
			{ring}
			<span className="vx-spinner-label">{props.label}</span>
		</div>
	} @else {
		<>
			{ring}
		</>
	}
}
