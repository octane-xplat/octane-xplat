/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle, styleRecord } from '../../internal/layout/style-merge'
import { useMemo } from 'octane'
import { refList } from '../../internal/accessibility/ref-list'
import type { StackProps } from '../../props'
import { cx } from '@octane-xplat/lib'
import {
	applyEscapeProps,
	nativeAccessibilityRole,
	nativeAccessibilityState,
} from '../overlays/escape-props'

import { resolveStackLayout } from './stack-layout'
import { usePan } from './pan'

/** Astryx flow Stack — a flex masonview in `direction`, `hAlign`/`vAlign`
 *  mapped to main/cross axes, spacing-step gap/padding (steps × 4 dips).
 *  Children that need to overlap belong in `Absolute` instead.
 *  `isScrollable` hosts the flow inside a ScrollView — NS layouts can't
 *  scroll their own overflow. */
export function Stack(props: StackProps): unknown @{
	const layout = resolveStackLayout(props)
	const onPan = usePan(props.onPan)
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
	}

	const forwardedRef = useMemo(
		() =>
			refList((v: any) => {
				if (v) {
					applyEscapeProps(v, props)
				}
			}, props.ref),
		[props.ref, props.ios, props.android, props.web],
	)

	@if (layout.scrollable) {
		<scrollview
			id={props.id}
			testID={props.testID ?? ''}
			ref={forwardedRef}
			className={cx('vx-stack', 'vx-stack--scroll', props.className)}
			style={{ ...sizingStyle, ...styleRecord(props.style) }}
			orientation={layout.flexDirection === 'row' ? 'horizontal' : 'vertical'}
			accessible={props.accessible}
			accessibilityLabel={props.accessibilityLabel}
			accessibilityRole={nativeAccessibilityRole(props.accessibilityRole)}
			accessibilityHint={props.accessibilityHint}
			accessibilityValue={props.accessibilityValue}
			accessibilityState={nativeAccessibilityState(props.accessibilityState)}
			accessibilityLiveRegion={props.accessibilityLiveRegion}
			onPan={onPan}
			onSwipe={props.onSwipe}
		>
			<masonview
				style={mergeStyle(
					{
						flexDirection: layout.flexDirection,
						justifyContent: layout.justifyContent,
						alignItems: layout.alignItems,
						flexWrap: layout.flexWrap,
						gap: layout.gap,
					},
					{ display: 'flex' },
				)}
			>
				{props.children}
			</masonview>
		</scrollview>
	} @else {
		<masonview
			id={props.id}
			testID={props.testID ?? ''}
			ref={forwardedRef}
			className={cx('vx-stack', props.className)}
			style={mergeStyle(
				{
					flexDirection: layout.flexDirection,
					justifyContent: layout.justifyContent,
					alignItems: layout.alignItems,
					flexWrap: layout.flexWrap,
					gap: layout.gap,
				},
				mergeStyle({ display: 'flex' }, { ...sizingStyle, ...styleRecord(props.style) }),
			)}
			accessible={props.accessible}
			accessibilityLabel={props.accessibilityLabel}
			accessibilityRole={nativeAccessibilityRole(props.accessibilityRole)}
			accessibilityHint={props.accessibilityHint}
			accessibilityValue={props.accessibilityValue}
			accessibilityState={nativeAccessibilityState(props.accessibilityState)}
			accessibilityLiveRegion={props.accessibilityLiveRegion}
			onPan={onPan}
			onSwipe={props.onSwipe}
		>
			{props.children}
		</masonview>
	}
}
