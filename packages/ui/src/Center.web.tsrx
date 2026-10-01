import type { CenterProps } from './props';
import { applyEscapeProps } from './escape-props';
import { applyWebProps } from './platformProps.web';
import { spacingPx } from './stack-layout';

/** Center — a row-direction flex that centers children on the main axis
 *  (`axis="horizontal"` → justify-content), the cross axis (`"vertical"`
 *  → align-items), or `both`. `isInline` renders `inline-flex`. */
export function Center(props: CenterProps) @{
	const axis = props.axis ?? 'both';
	const pad = (v: number | undefined) => (v === undefined ? undefined : v);
	const pInlineStart = pad(spacingPx(props.paddingInlineStart ?? props.paddingInline ?? props.padding));
	const pInlineEnd = pad(spacingPx(props.paddingInlineEnd ?? props.paddingInline ?? props.padding));
	const pBlockStart = pad(spacingPx(props.paddingBlockStart ?? props.paddingBlock ?? props.padding));
	const pBlockEnd = pad(spacingPx(props.paddingBlockEnd ?? props.paddingBlock ?? props.padding));

	<div
		id={props.id}
		ref={(e: any) => { if (e) { applyEscapeProps(e, props); applyWebProps(e, props.web); props.bind?.(e); } }}
		className={['vx-center', props.isInline ? 'vx-center--inline' : undefined, props.className]}
		style={{
			display: props.isInline ? 'inline-flex' : 'flex',
			flexDirection: 'row',
			justifyContent: axis !== 'vertical' ? 'center' : undefined,
			alignItems: axis !== 'horizontal' ? 'center' : undefined,
			...(pInlineStart !== undefined ? { paddingInlineStart: pInlineStart } : {}),
			...(pInlineEnd !== undefined ? { paddingInlineEnd: pInlineEnd } : {}),
			...(pBlockStart !== undefined ? { paddingBlockStart: pBlockStart } : {}),
			...(pBlockEnd !== undefined ? { paddingBlockEnd: pBlockEnd } : {}),
			...(props.width != null ? { width: props.width } : {}),
			...(props.height != null ? { height: props.height } : {}),
			...(props.maxWidth != null ? { maxWidth: props.maxWidth } : {}),
			...(props.minHeight != null ? { minHeight: props.minHeight } : {}),
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
	</div>
}
