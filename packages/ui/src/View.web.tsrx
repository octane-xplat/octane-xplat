import { useMemo, useRef } from 'octane';
import type { ViewProps } from './props';
import { applyEscapeProps } from './escape-props';
import { layoutChildProps } from './layout-child.web';
import { usePan } from './pan.web.tsrx';

/** Neutral flex-column container — the RN-shaped default block.
 *  onPan is pointer plumbing: pointerdown/move/up on the element.
 *  pointermove isn't in octane's delegated-event set, so the leaf attaches
 *  raw listeners through its internal ref. Payloads normalize
 *  to the shared shape {x,y,dx,dy,vx,vy,state,target}. */
export function View(props: ViewProps) @{
	const el = useRef<HTMLElement | null>(null);
	usePan(el, props.onPan);

	const forwardedRef = useMemo(() => [(e: any) => { el.current = e; if (e) { applyEscapeProps(e, props);  } }, props.ref], [props.ref, props.ios, props.android, props.web]);

	<div
		id={props.id}
		ref={forwardedRef}
		className={['vx-view', props.className]}
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
