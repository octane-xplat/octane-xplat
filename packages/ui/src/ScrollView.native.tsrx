/** @jsxImportSource @nativescript-community/octane */
import type { ScrollViewProps } from "./props";
import { cx } from "./cx";
import { applyEscapeProps, nativeAccessibilityRole, nativeAccessibilityState } from "./escape-props";
import { layoutChildProps } from './layout-child.native';
/** Scroll container — NS <scrollview>. NS ScrollView hosts exactly one
 *  child view, so children are wrapped in a column flexboxlayout — the
 *  same content-container indirection RN's ScrollView does internally.
 *  `horizontal` maps to NS's orientation prop. */
export function ScrollView(props: ScrollViewProps) @{
	<scrollview
		ref={(v: any) => applyEscapeProps(v, props)}
		id={props.id}
		{...layoutChildProps(props)}
		className={cx(props.className)}
		style={props.style}
		orientation={props.horizontal ? 'horizontal' : 'vertical'}
		accessible={props.accessible}
		accessibilityLabel={props.accessibilityLabel}
		accessibilityRole={nativeAccessibilityRole(props.accessibilityRole) as any}
		accessibilityHint={props.accessibilityHint}
		accessibilityValue={props.accessibilityValue}
		accessibilityState={nativeAccessibilityState(props.accessibilityState) as any}
		accessibilityLiveRegion={props.accessibilityLiveRegion as any}
	>
		<flexboxlayout flexDirection={props.horizontal ? 'row' : 'column'}>
			{props.children}
		</flexboxlayout>
	</scrollview>
}
