import { useMemo, useRef } from 'octane';
import { refList } from './ref-list'
import type { RowProps } from "./props";
import { applyEscapeProps } from "./escape-props";
import { layoutChildProps } from './layout-child.web';
import { usePan } from './pan.web.tsrx';
export function Row(props: RowProps) @{
	const el = useRef<HTMLElement | null>(null);
	usePan(el, props.onPan);

	const forwardedRef = useMemo(() => refList((e: any) => { el.current = e; if (e) { applyEscapeProps(e, props);  } }, props.ref), [props.ref, props.ios, props.android, props.web]);

	<div
		id={props.id}
		ref={forwardedRef}
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
