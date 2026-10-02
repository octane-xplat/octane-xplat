import { useMemo, useRef } from 'octane';
import { refList } from './ref-list'
import type { StackProps } from './props';
import { applyEscapeProps } from './escape-props';
import { applyWebProps } from './platformProps.web';
import { resolveStackLayout, stackWebStyle } from './stack-layout';
import { usePan } from './pan.web.tsrx';

/** Astryx flow Stack — flex container in `direction`, `hAlign`/`vAlign`
 *  mapped to main/cross axes, spacing-step gap/padding. Children that need
 *  to overlap belong in `Absolute` instead. */
export function Stack(props: StackProps) @{
	const layout = resolveStackLayout(props);
	const Tag: any = props.as ?? 'div';
	const el = useRef<HTMLElement | null>(null);
	usePan(el, props.onPan);

	const forwardedRef = useMemo(() => refList((e: any) => { el.current = e; if (e) { applyEscapeProps(e, props); applyWebProps(e, props.web);  } }, props.ref), [props.ref, props.ios, props.android, props.web]);

	<Tag
		id={props.id}
		ref={forwardedRef}
		className={['vx-stack', props.isScrollable ? 'vx-stack--scroll' : undefined, props.className]}
		style={{
			flexDirection: layout.flexDirection,
			justifyContent: layout.justifyContent,
			alignItems: layout.alignItems,
			...stackWebStyle(layout, props),
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
