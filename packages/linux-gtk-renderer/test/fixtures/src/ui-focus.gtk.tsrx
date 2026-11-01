/** @jsxImportSource @octane-xplat/jsx */
import {
	Text,
	View,
	isFocusVisible,
	useFocus,
	useFocusRing,
	useFocusVisible,
	useFocusWithin,
	useGridFocus,
	useKeyboard,
	useLandmark,
} from '@octane-xplat/ui'

/** Driver-readable event log + hook snapshots — same-process module state,
 *  like the other ui fixtures. */
export const events: string[] = []
export const state: Record<string, any> = {}
export const api: { focusCell?: (index: number) => void } = {}

const mods = (e: any) =>
	`${e.key}|${e.code}|${+e.altKey}${+e.ctrlKey}${+e.metaKey}${+e.shiftKey}|${e.repeat}|${e.isComposing}|${e.defaultPrevented}`

export function FocusProbe() {
	const focus = useFocus({
		onFocus: (e) => events.push('focus:on:' + ((e as any)?.eventName ?? 'none') + ':' + ((e as any)?.type ?? 'none')),
		onBlur: () => events.push('focus:off'),
		onFocusChange: (focused) => events.push('focus:change:' + focused),
	})
	const within = useFocusWithin({
		onFocusWithin: () => events.push('within:on'),
		onBlurWithin: () => events.push('within:off'),
		onFocusWithinChange: (value: boolean) => events.push('within:change:' + value),
	})
	const ring = useFocusRing()
	const visible = useFocusVisible()
	const keyboard = useKeyboard({
		onKeyDown: (event) => events.push('kb:down:' + event.key + ':' + event.ctrlKey),
		onKeyUp: (event) => events.push('kb:up:' + event.key),
	})
	const grid = useGridFocus({
		rows: 2,
		columns: 3,
		onFocusChange: (index: number) => events.push('grid:index:' + index),
	})
	const main = useLandmark({ role: 'main', label: 'Main region' })
	const nav = useLandmark({ role: 'navigation', label: 'Side nav' })

	api.focusCell = grid.onFocusCell
	state.withinSupported = within.isSubtreeTrackingSupported
	state.kbSupported = keyboard.isSupported
	state.ringFocused = ring.isFocused
	state.ringVisible = ring.isFocusVisible
	state.ringSupported = ring.isFocusVisibleSupported
	state.modality = visible.inputModality
	state.fvSupported = visible.isSupported
	state.gridIndex = grid.focusIndex
	state.nowVisible = isFocusVisible()
	const ringKey = ring.isFocused + ':' + ring.isFocusVisible
	if (state.lastRing !== ringKey) {
		state.lastRing = ringKey
		events.push('ring:' + ringKey)
	}

	return (
		<View style={{ width: 360, padding: 8, flexDirection: 'column', gap: 6 }}>
			<textfield
				id="tf-keys"
				text=""
				style={{ width: 320, height: 30 }}
				onKeyDown={(e) => {
					events.push('tf:down:' + mods(e))
					if (e.key === 'x') {
						e.preventDefault()
						events.push('tf:claim:x')
					}
					if (e.key === 'z') {
						e.stopPropagation()
						events.push('tf:claim:z')
					}
				}}
				onKeyUp={(e) => events.push('tf:up:' + e.key + ':' + e.eventName + ':' + (e.object != null))}
			/>
			<textfield id="tf-focus" text="" style={{ width: 320, height: 30 }} {...(focus.focusProps as any)} />
			<masonview
				id="fw-box"
				style={{ flexDirection: 'column', gap: 4 }}
				{...(within.focusWithinProps as any)}
			>
				<textfield id="fw-a" text="" style={{ width: 320, height: 30 }} />
				<textfield id="fw-b" text="" style={{ width: 320, height: 30 }} />
			</masonview>
			<textfield id="tf-ring" text="" style={{ width: 320, height: 30 }} {...ring.focusProps} />
			<masonview id="kb-box" style={{ flexDirection: 'column' }} {...(keyboard.keyboardProps as any)}>
				<textfield id="kb-field" text="" style={{ width: 320, height: 30 }} />
			</masonview>
			<masonview
				id="grid"
				ref={grid.ref}
				onKeyDown={grid.onKeyDown}
				style={{ flexDirection: 'row', flexWrap: 'wrap', width: 320 }}
			>
				{[0, 1, 2, 3, 4, 5].map((i) => (
					<masonview
						key={i}
						id={'cell-' + i}
						accessibilityRole="button"
						accessibilityLabel={'Cell ' + i}
						style={{ width: 90, height: 30, margin: 2 }}
					>
						<label text={'C' + i} />
					</masonview>
				))}
			</masonview>
			<masonview id="lm-main" {...main.landmarkProps} style={{ width: 8, height: 8 }} />
			<masonview id="lm-nav" {...nav.landmarkProps} style={{ width: 8, height: 8 }} />
			<Text id="lbl">{`m:${state.modality} r:${state.ringVisible}`}</Text>
		</View>
	)
}
