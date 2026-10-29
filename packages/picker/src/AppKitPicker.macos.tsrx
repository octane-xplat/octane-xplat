/** @jsxImportSource @octane-xplat/jsx */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'octane'
import { createPickerOwner, type PickerAttach } from './picker-owner.macos'
import type { AppKitPickerProps } from './macos/types'

const host = (): any => (globalThis as any).__xplatAppKit ?? {}

/** A native noneditable NSPopUpButton with stable string selection IDs. */
export function AppKitPicker(props: AppKitPickerProps) @{
	const live = useRef(props); live.current = props
	const [, rerender] = useState(0)
	const owner = useMemo(() => createPickerOwner({
		props: () => live.current,
		attach: () => typeof host().attachPicker === 'function' ? host().attachPicker as PickerAttach : undefined,
		status: () => rerender((n) => n + 1),
	}), [])
	useLayoutEffect(() => owner.update(), null)
	useEffect(() => () => owner.dispose(), [])
	<masonview id={props.id} className={['xplat-appkit-picker', props.className]} style={props.style}>
		<label text={props.label} />
		<masonview ref={owner.bind} className="xplat-appkit-picker-control" />
		@if (owner.getStatus() === 'empty') { <label text="No choices available." accessibilityLiveRegion="polite" /> }
		@if (owner.getStatus() === 'invalid') { <label text="Provide valid choices and a matching selection." accessibilityLiveRegion="polite" /> }
		@if (owner.getStatus() === 'unavailable') { <label text="Selection is unavailable in this app." accessibilityLiveRegion="polite" /> }
	</masonview>
}
<style>
	.xplat-appkit-picker { display: flex; flex-direction: column; gap: 4; }
	.xplat-appkit-picker-control { display: flex; min-width: 160; min-height: 26; }
</style>
