/** @jsxImportSource @nativescript-community/octane */
import { mergeStyle, styleRecord } from './style-merge'
import { useMemo } from 'octane'
import { refList } from './ref-list'
import type { CenterProps } from './props';
import { cx } from '@octane-xplat/lib';
import { applyEscapeProps, nativeAccessibilityRole, nativeAccessibilityState } from './escape-props';
import { spacingPx } from './stack-layout';

/** Center — a row-direction flex that centers children on the main axis
 *  (`axis="horizontal"`), the cross axis (`"vertical"`), or `both`.
 *  `isInline` is web-only (native containers are always block-level). */
export function Center(props: CenterProps) @{
	const axis = props.axis ?? 'both';

	const forwardedRef = useMemo(() => refList((v: any) => { if (v) { applyEscapeProps(v, props); } }, props.ref), [props.ref, props.ios, props.android, props.web]);

	<masonview id={props.id} ref={forwardedRef} className={cx('vx-center', props.className)} style={mergeStyle({ justifyContent: (axis === 'vertical' ? 'flex-start' : undefined), alignItems: (axis === 'horizontal' ? 'stretch' : undefined)}, mergeStyle({display: "flex"}, {
			...(spacingPx(props.paddingInlineStart ?? props.paddingInline ?? props.padding) !== undefined ? { paddingLeft: spacingPx(props.paddingInlineStart ?? props.paddingInline ?? props.padding) } : {}),
			...(spacingPx(props.paddingInlineEnd ?? props.paddingInline ?? props.padding) !== undefined ? { paddingRight: spacingPx(props.paddingInlineEnd ?? props.paddingInline ?? props.padding) } : {}),
			...(spacingPx(props.paddingBlockStart ?? props.paddingBlock ?? props.padding) !== undefined ? { paddingTop: spacingPx(props.paddingBlockStart ?? props.paddingBlock ?? props.padding) } : {}),
			...(spacingPx(props.paddingBlockEnd ?? props.paddingBlock ?? props.padding) !== undefined ? { paddingBottom: spacingPx(props.paddingBlockEnd ?? props.paddingBlock ?? props.padding) } : {}),
			...(props.width != null ? { width: props.width } : {}),
			...(props.height != null ? { height: props.height } : {}),
			...(props.maxWidth != null ? { maxWidth: props.maxWidth } : {}),
			...(props.minHeight != null ? { minHeight: props.minHeight } : {}),
			...styleRecord(props.style) }))} accessible={props.accessible} accessibilityLabel={props.accessibilityLabel} accessibilityRole={nativeAccessibilityRole(props.accessibilityRole)} accessibilityHint={props.accessibilityHint} accessibilityValue={props.accessibilityValue} accessibilityState={nativeAccessibilityState(props.accessibilityState)} accessibilityLiveRegion={props.accessibilityLiveRegion}>
		{props.children}
	</masonview>
}
