/** @jsxImportSource @nativescript-community/octane */
import { mergeStyle } from './style-merge'
import { useMemo } from 'octane'
import { refList } from './ref-list'
import type { RowProps } from "./props";
import { cx } from "@octane-xplat/lib";
import { applyEscapeProps, nativeAccessibilityRole, nativeAccessibilityState } from "./escape-props";
import { layoutChildProps } from './layout-child';
import { usePan } from './pan';
export function Row(props: RowProps) @{
	const forwardedRef = useMemo(() => refList((v: any) => { if (v) { applyEscapeProps(v, props); } }, props.ref), [props.ref, props.ios, props.android, props.web]);

	<masonview id={props.id} testID={props.testID ?? ''} ref={forwardedRef} flexDirection="row" className={cx(props.className)} style={mergeStyle({display: "flex"}, props.style as any)} {...layoutChildProps(props)} accessible={props.accessible} accessibilityLabel={props.accessibilityLabel} accessibilityRole={nativeAccessibilityRole(props.accessibilityRole) as any} accessibilityHint={props.accessibilityHint} accessibilityValue={props.accessibilityValue} accessibilityState={nativeAccessibilityState(props.accessibilityState) as any} accessibilityLiveRegion={props.accessibilityLiveRegion as any} onPan={usePan(props.onPan)} onSwipe={props.onSwipe}>
		{props.children}
	</masonview>
}
