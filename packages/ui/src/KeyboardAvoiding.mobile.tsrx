/** @jsxImportSource @nativescript-community/octane */
import { mergeStyle } from './style-merge'
import { useCallback, useContext, useEffect, useState } from 'octane'
import { Application } from '@nativescript/core'
import { cx } from '@octane-xplat/lib'
import {
	keyboardAvoidancePadding,
	keyboardBottomOverlap,
} from '@octane-xplat/platform/keyboard-geometry'

import { keyboardHostOverlap, subscribeKeyboardState } from './keyboard-inset'
import { KeyboardAvoidanceContext, KeyboardAvoidanceProvider } from './keyboard-avoidance-context'
import { useConsumedInsets } from './inset-consumption'
import type { KeyboardAvoidingProps } from './props'

export function KeyboardAvoiding(props: KeyboardAvoidingProps) @{
	const enabled = props.enabled ?? true
	const [host, setHost] = useState<any>(null)
	const attach = useCallback((next: any) => setHost(next), [])
	const [measurement, setMeasurement] = useState<{
		window?: object
		inset: number
		overlap: number
	}>({ inset: 0, overlap: 0 })

	const consumed = useConsumedInsets()
	const ancestor = useContext(KeyboardAvoidanceContext)
	const platformProps = Application.ios != null ? props.ios : props.android
	useEffect(() => {
		if (host && platformProps) {
			Object.assign(host, platformProps)
		}
	}, [host, platformProps])

	useEffect(() => {
		if (!enabled || !host) {
			setMeasurement({ inset: 0, overlap: 0 })
			return
		}

		return subscribeKeyboardState((state, window) => {
			const overlap = keyboardHostOverlap(host, state)
			// The numeric Android hook excludes system bars for compatibility.
			// A host drawing through those bars still needs its full actual overlap.
			const inset = Math.max(
				state.inset,
				keyboardBottomOverlap(state.windowRect, state.currentFrame ?? state.targetFrame),
			)

			setMeasurement((previous) =>
				previous.window === window && previous.inset === inset && previous.overlap === overlap
					? previous
					: { window, inset, overlap },
			)
		}, host)
	}, [enabled, host])

	const inherited = ancestor.window === measurement.window ? ancestor.bottom : 0
	const paddingBottom = enabled
		? keyboardAvoidancePadding({
				windowInset: measurement.inset,
				hostOverlap: measurement.overlap,
				consumedSafeArea: consumed.bottom,
				ancestorAvoidance: inherited,
				offset: props.keyboardVerticalOffset,
			})
		: 0

	const provided = { window: measurement.window, bottom: inherited + paddingBottom }

	<scrollview
		id={props.id}
		className={cx('vx-keyboard-avoiding', props.className)}
		style={props.style as any}
		ref={attach}
	>
		<KeyboardAvoidanceProvider value={provided}>
			<masonview style={mergeStyle({ display: "flex", flexDirection: "column" }, paddingBottom ? { paddingBottom } : undefined)}>
				{props.children}
			</masonview>
		</KeyboardAvoidanceProvider>
	</scrollview>
}
