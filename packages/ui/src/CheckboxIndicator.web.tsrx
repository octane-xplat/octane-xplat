import type { IndicatorProps } from './props';
import { applyEscapeProps } from './escape-props';
import { applyWebProps } from './platformProps.web';

/** CheckboxIndicator — decorative box: check glyph when checked, inset bar
 *  when indeterminate, 20px (sm) / 24px (md). `aria-hidden` — the owning
 *  checkbox keeps the semantics. `children` replaces the state mark. */
export function CheckboxIndicator(props: IndicatorProps<'multiSelection'>) @{
	const size = props.size ?? 'md';
	const mark = props.state === 'indeterminate'
		? <span className={['vx-ind-dash', `vx-ind-dash--${size}`]} />
		: props.state === 'checked'
			? <span className={['vx-checkbox-check', `vx-ind-check--${size}`]}>{'✓'}</span>
			: null;
	const content = props.children != null ? props.children : mark;

	<span
		id={props.id}
		ref={(e: any) => { if (e) { applyEscapeProps(e, props); applyWebProps(e, props.web); props.bind?.(e); } }}
		className={[
			'vx-checkbox', 'vx-ind-checkbox', `vx-ind-checkbox--${size}`,
			props.state !== 'unchecked' ? `vx-ind-checkbox--${props.state}` : undefined,
			props.isDisabled ? 'vx-ind-checkbox--disabled' : undefined,
			props.className,
		]}
		style={props.style}
		aria-hidden="true"
	>
		{content}
	</span>
}
