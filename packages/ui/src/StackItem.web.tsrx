import type { StackItemProps } from './props';
import { applyEscapeProps } from './escape-props';
import { applyWebProps } from './platformProps.web';
import { useMemo, useRef } from 'octane';
import { refList } from './ref-list'
import { stackItemStyle } from './stack-layout';
import { usePan } from './pan.web.tsrx';

/** StackItem — per-child size (`fill` grows into remaining space) and
 *  cross-axis alignment inside a `Stack`. Carries the flex `min-*: 0`
 *  reset so `size="fill" isScrollable` is a complete scroll region. */
export function StackItem(props: StackItemProps) @{
	const Tag: any = props.as ?? 'div';
	const el = useRef<HTMLElement | null>(null);
	usePan(el, props.onPan);

	const forwardedRef = useMemo(() => refList((e: any) => { el.current = e; if (e) { applyEscapeProps(e, props); applyWebProps(e, props.web);  } }, props.ref), [props.ref, props.ios, props.android, props.web]);

	<Tag
		id={props.id}
		ref={forwardedRef}
		className={['vx-stackitem', props.isScrollable ? 'vx-stackitem--scroll' : undefined, props.className]}
		style={{
			minWidth: 0,
			minHeight: 0,
			...stackItemStyle(props),
			...props.style,
		}}
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
	</Tag>
}
