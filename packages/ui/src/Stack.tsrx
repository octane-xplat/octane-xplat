/** @jsxImportSource @nativescript-community/octane */
import { useMemo } from 'octane'
import { refList } from './ref-list'
import type { StackProps } from './props';
import { cx } from './cx';
import { applyEscapeProps, nativeAccessibilityRole, nativeAccessibilityState } from './escape-props';
import { resolveStackLayout } from './stack-layout';
import { usePan } from './pan';

/** Astryx flow Stack — flexboxlayout in `direction`, `hAlign`/`vAlign`
 *  mapped to main/cross axes, spacing-step gap/padding (steps × 4 dips).
 *  Children that need to overlap belong in `Absolute` instead.
 *  `isScrollable` hosts the flow inside a ScrollView — NS layouts can't
 *  scroll their own overflow. */
export function Stack(props: StackProps) @{
	const layout = resolveStackLayout(props);
	const onPan = usePan(props.onPan);
	const sizingStyle = {
		...(props.width != null ? { width: props.width } : {}),
		...(props.height != null ? { height: props.height } : {}),
		...(props.maxWidth != null ? { maxWidth: props.maxWidth } : {}),
		...(props.minHeight != null ? { minHeight: props.minHeight } : {}),
		...(layout.paddingTop !== undefined ? { paddingTop: layout.paddingTop } : {}),
		...(layout.paddingBottom !== undefined ? { paddingBottom: layout.paddingBottom } : {}),
		// Logical inline edges map to physical left/right (LTR).
		...(layout.paddingInlineStart !== undefined ? { paddingLeft: layout.paddingInlineStart } : {}),
		...(layout.paddingInlineEnd !== undefined ? { paddingRight: layout.paddingInlineEnd } : {}),
	};

	const forwardedRef = useMemo(() => refList((v: any) => { if (v) { applyEscapeProps(v, props); } }, props.ref), [props.ref, props.ios, props.android, props.web]);

	@if (layout.scrollable) {
		<scrollview
			id={props.id}
			testID={props.testID ?? ''}
			ref={forwardedRef}
			className={cx('vx-stack', 'vx-stack--scroll', props.className)}
			style={{ ...sizingStyle, ...props.style }}
			orientation={layout.flexDirection === 'row' ? 'horizontal' : 'vertical'}
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
			<flexboxlayout
				flexDirection={layout.flexDirection}
				justifyContent={layout.justifyContent as any}
				alignItems={layout.alignItems as any}
				flexWrap={layout.flexWrap as any}
				gap={layout.gap as any}
			>
				{props.children}
			</flexboxlayout>
		</scrollview>
	} @else {
		<flexboxlayout
			id={props.id}
			testID={props.testID ?? ''}
			ref={forwardedRef}
			flexDirection={layout.flexDirection}
			justifyContent={layout.justifyContent as any}
			alignItems={layout.alignItems as any}
			flexWrap={layout.flexWrap as any}
			gap={layout.gap as any}
			className={cx('vx-stack', props.className)}
			style={{ ...sizingStyle, ...props.style }}
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
