/** @jsxImportSource @octane-xplat/jsx */
import { useCallback, useRef } from 'octane'
import type { Renderable } from '../../props'
import { appKitHost } from '../../internal/platform/host-bridge'

/** Pointer label target without a second sequential keyboard stop. The real
 * control owns keyboard/AX activation and receives focus before label presses. */
export function AppKitLabelPress(props: {
	children?: Renderable
	blocked: boolean
	control(): NSView | null
	press(): void
}) @{
	const label = useRef<NSView | null>(null)
	const release = useRef<(() => void) | null>(null)
	const available = typeof appKitHost()?.suppressTabStop === 'function'
	const bind = useCallback((view: NSView | null) => {
		const previous = label.current
		release.current?.()
		release.current = null
		label.current = view
		if (view && typeof appKitHost()?.suppressTabStop === 'function') {
			const dispose = appKitHost()!.suppressTabStop(view)
			if (typeof dispose !== 'function') throw new Error('AppKit label Tab-stop ownership unavailable')
			release.current = dispose
		}
		previous?.window?.recalculateKeyViewLoop()
		if (view !== previous) view?.window?.recalculateKeyViewLoop()
	}, [])
	<masonview ref={bind} accessible={false} className="vx-field-label-press--appkit"
		onTap={!available || props.blocked ? undefined : () => {
			const control = props.control()
			if (!control) return
			control.window?.makeFirstResponder(control)
			props.press()
		}}>
		{props.children}
	</masonview>
}
