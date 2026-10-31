/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle, styleRecord } from '../../internal/layout/style-merge'
import { useMemo } from 'octane'
import type { View } from '@nativescript/core'
import { useMeasure } from '../layout/useMeasure'
import './pressable-control.windows'
import { refList } from '../../internal/accessibility/ref-list'
import type { PressableProps } from '../../props'
import { cx } from '@octane-xplat/lib'
import {
	applyEscapeProps,
	nativeAccessibilityRole,
	nativeAccessibilityState,
} from '../overlays/escape-props'

import { layoutChildProps } from '../layout/layout-child'
import { usePan } from '../layout/pan'
/** Keep the shared drawing and layout, with a measured native control for
 * focus and activation. Only Click invokes onPress: a second tap listener
 * would dispatch mouse activation twice. */
export function Pressable(props: PressableProps): unknown @{
	const measured = useMeasure()
	const disabled = Boolean(props.disabled || props.accessibilityState?.disabled)
	const pan = usePan(disabled ? undefined : props.onPan)
	const forwardedRef = useMemo(
		() =>
			refList((v: View | null) => {
				measured.ref(v)
				if (v) {
					applyEscapeProps(v, props)
				}
			}, props.ref),
		[measured.ref, props.ref, props.ios, props.android, props.web],
	)

	const peerProps = {
		style: {
			position: 'absolute' as const,
			width: measured.bounds?.width ?? 0,
			height: measured.bounds?.height ?? 0,
		},
		settings: {
			label: props.accessibilityLabel,
			accessible: props.accessible,
			onPress: props.onPress,
		},
		isEnabled: !disabled,
		accessible: props.accessible,
		accessibilityRole: nativeAccessibilityRole(props.accessibilityRole),
		accessibilityHint: props.accessibilityHint,
		accessibilityValue: props.accessibilityValue,
		accessibilityState: nativeAccessibilityState({ ...props.accessibilityState, disabled }),
		accessibilityLiveRegion: props.accessibilityLiveRegion,
		onPan: pan,
		onSwipe: disabled ? undefined : props.onSwipe,
		onLongPress: disabled ? undefined : props.onLongPress,
		onDoubleTap: disabled ? undefined : props.onDoublePress,
		onTouch: disabled
			? undefined
			: (e: any) => {
					if (e.action === 'down') {
						props.onPressIn?.()
					} else if (e.action === 'up' || e.action === 'cancel') {
						props.onPressOut?.()
					}
				},
	}

	<masonview
		ref={forwardedRef}
		id={props.id}
		testID={props.testID ?? ''}
		{...layoutChildProps(
			props,
			mergeStyle(
				{ display: 'flex' },
				{
					...styleRecord(props.style),
					...(props.hitSlop ? { margin: -props.hitSlop, padding: props.hitSlop } : {}),
				},
			),
		)}
		className={cx('vx-pressable', props.className)}
	>
		{props.children}
		// Native hosts must be literal tags; a string-valued component variable
		// compiles as a universal function component and cannot mount.
		@if (props.accessibilityRole === 'link') {
			<xplatwindowslink {...peerProps} />
		} @else {
			<xplatwindowsbutton {...peerProps} />
		}
	</masonview>
}
