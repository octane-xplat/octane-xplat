import { useRef } from 'octane';
import type { RowProps } from "./props";
import { applyEscapeProps } from "./escape-props";
import { layoutChildProps } from './layout-child.web';
import { usePan } from './pan.web.tsrx';
export function Row(props: RowProps) @{
	const el = useRef<HTMLElement | null>(null);
	usePan(el, props.onPan);

	<div
		id={props.id}
		ref={(e: any) => { el.current = e; if (e) { applyEscapeProps(e, props); props.bind?.(e); } }}
		className={['vx-row', props.className]}
		{...layoutChildProps(props, props.style)}
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
