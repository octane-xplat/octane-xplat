/** @jsxImportSource @nativescript-community/octane */
import type { RowProps } from "./props";
import { cx } from "./cx";
import { applyEscapeProps, nativeAccessibilityRole, nativeAccessibilityState } from "./escape-props";
import { layoutChildProps } from './layout-child.native';
import { usePan } from './pan.native.tsrx';
export function Row(props: RowProps) @{
	<flexboxlayout
		id={props.id}
		ref={(v: any) => { if (v) { applyEscapeProps(v, props); props.bind?.(v); } }}
		flexDirection="row"
		className={cx(props.className)}
		style={props.style}
		{...layoutChildProps(props)}
		accessible={props.accessible}
		accessibilityLabel={props.accessibilityLabel}
		accessibilityRole={nativeAccessibilityRole(props.accessibilityRole) as any}
		accessibilityHint={props.accessibilityHint}
		accessibilityValue={props.accessibilityValue}
		accessibilityState={nativeAccessibilityState(props.accessibilityState) as any}
		accessibilityLiveRegion={props.accessibilityLiveRegion as any}
		onPan={usePan(props.onPan)}
		onSwipe={props.onSwipe}
	>
		{props.children}
	</flexboxlayout>
}
