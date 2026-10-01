/** @jsxImportSource @nativescript-community/octane */
import type { SectionProps } from './props';
import { cx } from './cx';
import { applyEscapeProps, nativeAccessibilityRole, nativeAccessibilityState } from './escape-props';
import { spacingPx } from './stack-layout';

/** Section — banded container with surface/transparent/muted background.
 *  The web leaf's container-padding escape has no native analog (no CSS
 *  var propagation into layout), so this leaf is a single wrapper. */
export function Section(props: SectionProps) @{
	const variant = props.variant ?? 'section';
	const dividers = new Set(props.dividers ?? []);
	const padding = spacingPx(props.padding) ?? 16;
	const pInlineStart = spacingPx(props.paddingInlineStart ?? props.paddingInline) ?? padding;
	const pInlineEnd = spacingPx(props.paddingInlineEnd ?? props.paddingInline) ?? padding;
	const pBlockStart = spacingPx(props.paddingBlockStart ?? props.paddingBlock) ?? padding;
	const pBlockEnd = spacingPx(props.paddingBlockEnd ?? props.paddingBlock) ?? padding;

	<flexboxlayout
		id={props.id}
		ref={(v: any) => { if (v) { applyEscapeProps(v, props); props.bind?.(v); } }}
		className={cx(
			'vx-section',
			`vx-section--${variant}`,
			dividers.has('top') && 'vx-section--divider-top',
			dividers.has('bottom') && 'vx-section--divider-bottom',
			dividers.has('start') && 'vx-section--divider-start',
			dividers.has('end') && 'vx-section--divider-end',
			props.className,
		)}
		style={{
			paddingLeft: pInlineStart,
			paddingRight: pInlineEnd,
			paddingTop: pBlockStart,
			paddingBottom: pBlockEnd,
			...(props.width != null ? { width: props.width } : {}),
			...(props.height != null ? { height: props.height } : {}),
			...(props.maxWidth != null ? { maxWidth: props.maxWidth } : {}),
			...(props.minHeight != null ? { minHeight: props.minHeight } : {}),
			...props.style,
		}}
		accessible={props.accessible}
		accessibilityLabel={props.accessibilityLabel}
		accessibilityRole={nativeAccessibilityRole(props.accessibilityRole) as any}
		accessibilityHint={props.accessibilityHint}
		accessibilityValue={props.accessibilityValue}
		accessibilityState={nativeAccessibilityState(props.accessibilityState) as any}
		accessibilityLiveRegion={props.accessibilityLiveRegion as any}
	>
		{props.children}
	</flexboxlayout>
}
