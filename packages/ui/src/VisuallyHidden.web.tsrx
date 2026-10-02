import { useMemo } from 'octane'
import { refList } from './ref-list'
import type { VisuallyHiddenProps } from './props';
import { applyEscapeProps } from './escape-props';
import { applyWebProps } from './platformProps.web';

/** VisuallyHidden — content stays in the a11y tree / DOM flow but renders
 *  at a clipped 1px box. No style/className: restyling a hidden node is a
 *  bug waiting to ship. `as` picks the tag ('span' inline default; 'div'
 *  for live regions / block announcements). */
export function VisuallyHidden(props: VisuallyHiddenProps) @{
	const Tag: any = props.as ?? 'span';

	const forwardedRef = useMemo(() => refList((e: any) => { if (e) { applyEscapeProps(e, props); applyWebProps(e, props.web); } }, props.ref), [props.ref, props.ios, props.android, props.web]);

	<Tag
		id={props.id}
		ref={forwardedRef}
		className="vx-visually-hidden"
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
