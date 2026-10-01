import type { IndicatorProps } from './props';
import { applyEscapeProps } from './escape-props';
import { applyWebProps } from './platformProps.web';

/** CheckIndicator — standalone selection mark. Nothing when unchecked and
 *  childless; a check glyph when checked; `children` replace the glyph
 *  inside a stable slot. `aria-hidden`. */
export function CheckIndicator(props: IndicatorProps<'singleSelection'>) @{
	const size = props.size ?? 'md';

	@if (props.children != null) {
		<span
			id={props.id}
			ref={(e: any) => { if (e) { applyEscapeProps(e, props); applyWebProps(e, props.web); props.bind?.(e); } }}
			className={['vx-ind-check-slot', `vx-ind-check-slot--${size}`, props.className]}
			style={props.style}
			aria-hidden="true"
		>
			{props.children}
		</span>
	} @else if (props.state === 'checked') {
		<span
			id={props.id}
			ref={(e: any) => { if (e) { applyEscapeProps(e, props); applyWebProps(e, props.web); props.bind?.(e); } }}
			className={['vx-ind-check', `vx-ind-check--${size}`, props.isDisabled ? 'vx-ind-check--disabled' : undefined, props.className]}
			style={props.style}
			aria-hidden="true"
		>
			{'✓'}
		</span>
	} @else {
		null
	}
}
