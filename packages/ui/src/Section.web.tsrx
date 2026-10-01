import type { SectionProps } from './props';
import { applyEscapeProps } from './escape-props';
import { applyWebProps } from './platformProps.web';
import { spacingPx } from './stack-layout';

/** Section — a banded container. The outer element escapes an ancestor's
 *  `--vx-container-padding-*` (bleed); the inner element re-asserts the
 *  padding so content stays aligned, and the `vx-section-inner` class
 *  zeroes those vars so nested Sections don't compound the escape. Both
 *  read the vars a `Layout` container publishes — with none declared the
 *  structure is inert, so the outer/inner split is forward-compatible
 *  rather than dead code. */
export function Section(props: SectionProps) @{
	const variant = props.variant ?? 'section';
	const dividers = new Set(props.dividers ?? []);
	const padding = spacingPx(props.padding) ?? 16;
	const pInlineStart = spacingPx(props.paddingInlineStart ?? props.paddingInline) ?? padding;
	const pInlineEnd = spacingPx(props.paddingInlineEnd ?? props.paddingInline) ?? padding;
	const pBlockStart = spacingPx(props.paddingBlockStart ?? props.paddingBlock) ?? padding;
	const pBlockEnd = spacingPx(props.paddingBlockEnd ?? props.paddingBlock) ?? padding;

	<div
		id={props.id}
		ref={(e: any) => { if (e) { applyEscapeProps(e, props); applyWebProps(e, props.web); props.bind?.(e); } }}
		className={['vx-section', `vx-section--${variant}`, props.className]}
		style={{
			marginInlineStart: 'calc(-1 * var(--vx-container-padding-inline-start, 0px))',
			marginInlineEnd: 'calc(-1 * var(--vx-container-padding-inline-end, 0px))',
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
		<div
			className={[
				'vx-section-inner',
				dividers.has('top') ? 'vx-section--divider-top' : undefined,
				dividers.has('bottom') ? 'vx-section--divider-bottom' : undefined,
				dividers.has('start') ? 'vx-section--divider-start' : undefined,
				dividers.has('end') ? 'vx-section--divider-end' : undefined,
			]}
			style={{
				paddingInlineStart: pInlineStart,
				paddingInlineEnd: pInlineEnd,
				paddingBlockStart: pBlockStart,
				paddingBlockEnd: pBlockEnd,
				...(props.width != null ? { width: props.width } : {}),
				...(props.height != null ? { height: props.height } : {}),
				...(props.maxWidth != null ? { maxWidth: props.maxWidth } : {}),
				...(props.minHeight != null ? { minHeight: props.minHeight } : {}),
			}}
		>
			{props.children}
		</div>
	</div>
}
