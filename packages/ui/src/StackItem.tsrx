/** @jsxImportSource @nativescript-community/octane */
import type { StackItemProps } from './props';
import { cx } from './cx';
import { applyEscapeProps, nativeAccessibilityRole, nativeAccessibilityState } from './escape-props';
import { stackItemStyle } from './stack-layout';
import { usePan } from './pan.tsrx';

/** StackItem — per-child size (`fill` grows into remaining space) and
 *  cross-axis alignment inside a `Stack`. `isScrollable` hosts the content
 *  in a ScrollView on native (NS layouts can't scroll their own overflow). */
export function StackItem(props: StackItemProps) @{
	const itemStyle = stackItemStyle(props);
	const onPan = usePan(props.onPan);

	@if (props.isScrollable) {
		<scrollview
			id={props.id}
			ref={(v: any) => { if (v) { applyEscapeProps(v, props); props.bind?.(v); } }}
			className={cx('vx-stackitem', props.className)}
			style={{ ...itemStyle, ...props.style }}
			orientation="vertical"
			accessible={props.accessible}
			accessibilityLabel={props.accessibilityLabel}
			accessibilityRole={nativeAccessibilityRole(props.accessibilityRole) as any}
			accessibilityHint={props.accessibilityHint}
			accessibilityValue={props.accessibilityValue}
			accessibilityState={nativeAccessibilityState(props.accessibilityState) as any}
			accessibilityLiveRegion={props.accessibilityLiveRegion as any}
			onPan={onPan}
			onSwipe={props.onSwipe}
		>
			<flexboxlayout flexDirection="column">{props.children}</flexboxlayout>
		</scrollview>
	} @else {
		<flexboxlayout
			id={props.id}
			ref={(v: any) => { if (v) { applyEscapeProps(v, props); props.bind?.(v); } }}
			className={cx('vx-stackitem', props.className)}
			style={{ ...itemStyle, ...props.style }}
			accessible={props.accessible}
			accessibilityLabel={props.accessibilityLabel}
			accessibilityRole={nativeAccessibilityRole(props.accessibilityRole) as any}
			accessibilityHint={props.accessibilityHint}
			accessibilityValue={props.accessibilityValue}
			accessibilityState={nativeAccessibilityState(props.accessibilityState) as any}
			accessibilityLiveRegion={props.accessibilityLiveRegion as any}
			onPan={onPan}
			onSwipe={props.onSwipe}
		>
			{props.children}
		</flexboxlayout>
	}
}
