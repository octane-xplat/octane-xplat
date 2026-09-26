import type { TextProps } from "./props";
import { applyEscapeProps } from "./escape-props";
import { layoutChildProps } from './layout-child.web';
export function Text(props: TextProps) @{
	const textStyle = {
		...props.style,
		...(props.numberOfLines ? { display: '-webkit-box', WebkitLineClamp: props.numberOfLines, WebkitBoxOrient: 'vertical', overflow: 'hidden' } : {}),
		// Clamped text must be allowed to shrink — the shared shrink:0 default
		// would let it overflow its row instead of truncating.
		...(props.ellipsize || props.numberOfLines ? { flexShrink: 1 } : {}),
		...(props.ellipsize ? { textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' } : {}),
	};

	<span
		id={props.id}
		ref={(el: any) => applyEscapeProps(el, props)}
		className={props.className}
		{...layoutChildProps(props, textStyle)}
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
	</span>
}
