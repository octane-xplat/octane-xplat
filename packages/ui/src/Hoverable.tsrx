/** @jsxImportSource @nativescript-community/octane */
import { useEffect, useRef } from 'octane'
import type { HoverableProps } from './props'
import { cx } from './cx'
import { View } from './View.tsrx'

const host = () => (globalThis as any).__xplatAppKit ?? {}

function HoverablePanel(props: { body?: any; className?: any; style?: any }) @{
	<View className={cx('vx-hoverable-card', props.className)} style={props.style}>
		{props.body}
	</View>
}

/** Native-default leaf — the implementation, not a stub. On macOS the
 *  `__xplatAppKit` bridge supplies real pointer intent: an NSTrackingArea
 *  drives the same open/close delays as web and the card is an anchored
 *  NSPopover that stays open while the pointer crosses to the panel (the
 *  panel gets its own tracking area), matching the web leaf's pointer
 *  bridge. iOS/Android take the `.mobile` passthrough; bridge-absent
 *  targets (Windows) render the children only. The card renders once at
 *  open in a separate Octane root — no shared context. */
export function Hoverable(props: HoverableProps) @{
	const anchor = useRef<any>(null)
	const popup = useRef<any>(null)
	const detachHover = useRef<(() => void) | null>(null)
	const detachCardHover = useRef<(() => void) | null>(null)
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
		detachCardHover.current?.()
		detachCardHover.current = null
		popup.current?.close()
		popup.current = null
	}

	const openNow = () => {
		if (popup.current) return
		const view = anchor.current
		const show = host().showAnchoredPopup
		if (!view || typeof show !== 'function') return
		popup.current = show({
			anchor: view,
			placement: props.placement ?? 'bottom',
			component: HoverablePanel,
			props: { body: props.card, className: props.cardClassName, style: props.cardStyle },
		})

		if (popup.current?.contentView && typeof host().observeHover === 'function') {
			detachCardHover.current = host().observeHover(popup.current.contentView, {
				enter: clearClose,
				exit: scheduleClose,
			})
		}
	}

	const startOpen = () => {
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
		}, Math.max(0, props.closeDelay ?? 120))
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
		detachCardHover.current?.()
		popup.current?.close()
		popup.current = null
	}, [])

	<View id={props.id} className={props.className} style={props.style} bind={bindAnchor}>
		{props.children}
	</View>
}
