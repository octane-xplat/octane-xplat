import type { TextProps } from "./props";
import { applyEscapeProps } from "./escape-props";
import { layoutChildProps } from './layout-child.web';
export function Text(props: TextProps) @{
	const textStyle = {
		...props.style,
		...(props.numberOfLines ? { display: '-webkit-box', WebkitLineClamp: props.numberOfLines, WebkitBoxOrient: 'vertical', overflow: 'hidden' } : {}),
		...(props.selectable === false ? { userSelect: 'none' } : props.selectable ? { userSelect: 'text' } : {}),
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
		aria-busy={props.accessibilityState?.busy}
		aria-expanded={props.accessibilityState?.expanded}
		aria-live={props.accessibilityLiveRegion === 'none' ? 'off' : props.accessibilityLiveRegion}
	>
		{props.children}
	</span>
}
