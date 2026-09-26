import type { StackProps } from './props';
import { applyEscapeProps } from './escape-props';

export function Stack(props: StackProps) @{
	<div
		id={props.id}
		className={['vx-stack', props.className]}
		style={props.style}
		ref={(el: any) => applyEscapeProps(el, props)}
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
		{props.children}
	</div>
}
