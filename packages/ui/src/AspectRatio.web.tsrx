import type { AspectRatioProps } from './props';
import { applyEscapeProps } from './escape-props';
import { applyWebProps } from './platformProps.web';

/** AspectRatio — `width:100%` box sized by CSS `aspect-ratio` (inline so
 *  consumers can override; the `vx-aspectratio-fit-*` classes drive how the
 *  fill wrapper + media children cover/contain/center inside it). */
export function AspectRatio(props: AspectRatioProps) @{
	const fit = props.fit ?? 'cover';
	const ellipse = props.shape === 'ellipse';

	<div
		id={props.id}
		ref={(e: any) => { if (e) { applyEscapeProps(e, props); applyWebProps(e, props.web); props.bind?.(e); } }}
		className={[
			'vx-aspectratio',
			`vx-aspectratio-fit-${fit}`,
			ellipse ? 'vx-aspectratio--ellipse' : undefined,
			props.className,
		]}
		style={{ aspectRatio: props.ratio, ...props.style }}
		data-vx-aspectratio-fit={fit}
		role={props.accessibilityRole}
		aria-label={props.accessibilityLabel}
		aria-hidden={props.accessible === false ? true : undefined}
		aria-description={props.accessibilityHint}
		aria-valuetext={props.accessibilityValue}
		aria-disabled={props.accessibilityState?.disabled}
		aria-selected={props.accessibilityState?.selected}
		aria-checked={props.accessibilityState?.checked}
		aria-live={props.accessibilityLiveRegion === 'none' ? 'off' : props.accessibilityLiveRegion}
	>
		<div className="vx-aspectratio-content">{props.children}</div>
	</div>
}
