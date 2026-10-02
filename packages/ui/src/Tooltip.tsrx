/** @jsxImportSource @nativescript-community/octane */
import { useEffect, useRef } from 'octane'
import type { TooltipProps } from './props'
import { cx } from './cx'
import { View } from './View.tsrx'

const host = () => (globalThis as any).__xplatAppKit ?? {}

function TooltipPanel(props: { body?: any; className?: any; style?: any }) @{
	<View className={cx('vx-tooltip', props.className)} style={props.style}>
		{props.body}
	</View>
}

/** Native-default leaf — the implementation, not a stub. On macOS the
 *  `__xplatAppKit` bridge supplies real pointer intent: an NSTrackingArea on
 *  the anchor feeds the same open/close delays as web, and the panel is an
 *  anchored NSPopover mounted as its own Octane root. iOS/Android take the
 *  `.mobile` passthrough; bridge-absent targets (Windows) render the
 *  trigger only. The content renders once at open (the popup root is a
 *  separate tree — no shared context). */
export function Tooltip(props: TooltipProps) @{
	const anchor = useRef<any>(null)
	const popup = useRef<any>(null)
	const detachHover = useRef<(() => void) | null>(null)
	const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
	const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

	const clearOpen = () => {
		if (openTimer.current !== null) clearTimeout(openTimer.current)
		openTimer.current = null
	}

	const clearClose = () => {
		if (closeTimer.current !== null) clearTimeout(closeTimer.current)
		closeTimer.current = null
	}

	const closeNow = () => {
		clearOpen()
		clearClose()
		popup.current?.close()
		popup.current = null
	}

	const openNow = () => {
		if (props.disabled || popup.current) return
		const view = anchor.current
		const show = host().showAnchoredPopup
		if (!view || typeof show !== 'function') return
		popup.current = show({
			anchor: view,
			placement: props.placement ?? 'top',
			component: TooltipPanel,
			props: { body: props.content, className: props.contentClassName, style: props.contentStyle },
		})
	}

	const startOpen = () => {
		if (props.disabled) return
		clearClose()
		clearOpen()
		openTimer.current = setTimeout(() => {
			openTimer.current = null
			openNow()
		}, Math.max(0, props.openDelay ?? 500))
	}

	const scheduleClose = () => {
		clearClose()
		closeTimer.current = setTimeout(() => {
			closeTimer.current = null
			closeNow()
		}, Math.max(0, props.closeDelay ?? 100))
	}

	const bindAnchor = (view: any) => {
		if (view && view === anchor.current && detachHover.current) return
		anchor.current = view
		detachHover.current?.()
		detachHover.current = null
		if (!view) return
		const observe = host().observeHover
		if (typeof observe !== 'function') return
		detachHover.current = observe(view, {
			enter: startOpen,
			exit: () => { clearOpen(); scheduleClose() },
		})
	}

	useEffect(() => () => {
		clearOpen()
		clearClose()
		detachHover.current?.()
		popup.current?.close()
		popup.current = null
	}, [])

	<View id={props.id} className={props.className} style={props.style} ref={bindAnchor}>
		{props.trigger}
	</View>
}
