import type { IndicatorProps } from './props';
import { applyEscapeProps } from './escape-props';
import { applyWebProps } from './platformProps.web';

/** RadioIndicator — decorative circle (20/24px); a filled dot appears when
 *  checked. `aria-hidden`; `children` replaces the dot. */
export function RadioIndicator(props: IndicatorProps<'singleSelection'>) @{
	const size = props.size ?? 'md';
	const content = props.children != null
		? props.children
		: props.state === 'checked'
			? <span className={['vx-radio-dot', 'vx-ind-radio-dot', `vx-ind-radio-dot--${size}`]} />
			: null;

	<span
		id={props.id}
		ref={(e: any) => { if (e) { applyEscapeProps(e, props); applyWebProps(e, props.web); props.bind?.(e); } }}
		className={[
			'vx-radio', 'vx-ind-radio', `vx-ind-radio--${size}`,
			props.state === 'checked' ? 'vx-ind-radio--checked' : undefined,
			props.isDisabled ? 'vx-ind-radio--disabled' : undefined,
			props.className,
		]}
		style={props.style}
		aria-hidden="true"
	>
		{content}
	</span>
}
