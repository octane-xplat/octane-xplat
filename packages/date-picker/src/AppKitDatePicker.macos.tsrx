/** @jsxImportSource @octane-xplat/jsx */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'octane'
import type { AppKitDatePickerProps } from './macos/types'
import { createDatePickerOwner } from './date-picker-owner.macos'
import type { DatePickerAttach } from './date-picker-owner.macos'

const host = (): any => (globalThis as any).__xplatAppKit ?? {}

/** Embeds a real NSDatePicker in the leaf's backing view via the
 *  `__xplatAppKit` bridge. 'date' uses a text field (or the inline
 *  graphical calendar when `pickerStyle` is 'graphical'); 'time' uses the
 *  clock-and-calendar field; 'dateAndTime' shows both element groups.
 *  The host element carries an explicit size — the picker is pinned to
 *  its edges. */
export function AppKitDatePicker(props: AppKitDatePickerProps) @{
	const live = useRef(props); live.current = props
	const [, rerender] = useState(0)
	const owner = useMemo(() => createDatePickerOwner({
		props: () => live.current,
		attach: () => typeof host().attachDatePicker === 'function' ? host().attachDatePicker as DatePickerAttach : undefined,
		status: () => rerender((n) => n + 1),
	}), [])
	useLayoutEffect(() => owner.update(), null)
	useEffect(() => () => owner.dispose(), [])
	const graphical = props.components === 'time' || ((props.components ?? 'date') === 'date' && props.pickerStyle === 'graphical')

	<masonview
		ref={owner.bind}
		id={props.id}
		className={['xplat-appkit-date-picker', props.className]}
		style={[{ minHeight: graphical ? 300 : 26 }, props.style]}
	>
		@if (owner.getStatus() === 'invalid') { <label text="Choose a valid date and date range." accessibilityLiveRegion="polite" /> }
		@if (owner.getStatus() === 'unavailable') { <label text="Date selection is unavailable in this app." accessibilityLiveRegion="polite" /> }
	</masonview>
}
<style>
	.xplat-appkit-date-picker { display: flex; min-width: 240; }
</style>
