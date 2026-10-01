import type { StatusDotProps } from './props';
import { applyEscapeProps } from './escape-props';
import { Tooltip } from './Tooltip.web.tsrx';
import { isRenderable } from './is-renderable';

/** StatusDot — an 8px colored status signal. Non-focusable `role="img"` with
 *  `aria-label` so the status reaches screen readers without hover. `icon`
 *  paints in the variant's on-color inside an aria-hidden span; `isPulsing`
 *  animates (reduced-motion users get the still dot). */
export function StatusDot(props: StatusDotProps) @{
	const dot = (
		<span
			ref={(e: any) => applyEscapeProps(e, props)}
			id={props.id}
			role="img"
			aria-label={props.label}
			className={[
				'vx-statusdot',
				`vx-statusdot--${props.variant}`,
				props.isPulsing && 'vx-statusdot--pulse',
				props.className,
			]}
			style={props.style}
		>
			{isRenderable(props.icon) ? <span className="vx-statusdot-icon" aria-hidden="true">{props.icon}</span> : null}
		</span>
	);

	return props.tooltip != null
		? <Tooltip trigger={dot} content={props.tooltip} />
		: dot;
}
