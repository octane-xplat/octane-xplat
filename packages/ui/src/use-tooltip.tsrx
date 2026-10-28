/** @jsxImportSource @nativescript-community/octane */
import { useCallback, useEffect, useId, useRef } from 'octane'
import type { ContextRenderProps, TooltipOptions, TooltipReturn } from './props'
import { appKitHost } from './host-bridge'
import { View } from './View'

const host = () => appKitHost() ?? {}

function TooltipPanel(props: { body?: any }) @{
	<View className="vx-tooltip">{props.body}</View>
}

/** Headless tooltip (Astryx `useTooltip`), AppKit leaf — `observeHover` on
 *  the bound view feeds the same open/close delays as `Tooltip` and the
 *  panel is an anchored NSPopover hosted on its own root. `renderTooltip`
 *  registers the content and mounts nothing in-tree. */
export function useTooltip(options: TooltipOptions = {}): TooltipReturn {
	const id = useId()
	const anchor = useRef<any>(null)
	const popup = useRef<any>(null)
	const detach = useRef<(() => void) | null>(null)
	const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
	const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
	const content = useRef<any>(null)
	const surface = useRef<ContextRenderProps | undefined>(undefined)
	const isEnabled = options.isEnabled !== false

	const clear = (timer: typeof openTimer) => {
		if (timer.current) {
			clearTimeout(timer.current)
		}

		timer.current = null
	}

	const closeNow = () => {
		clear(openTimer)
		clear(closeTimer)
		popup.current?.close()
		popup.current = null
		options.onHide?.()
	}

	const openNow = () => {
		if (!isEnabled || popup.current || options.isOpen === false) {
			return
		}

		const show = host().showAnchoredPopup
		if (!anchor.current || typeof show !== 'function') {
			return
		}

		popup.current = show({
			anchor: anchor.current,
			placement: surface.current?.placement ?? options.placement ?? 'top',
			component: TooltipPanel,
			props: { body: content.current },
		})

		options.onShow?.()
	}

	const startOpen = () => {
		clear(closeTimer)
		clear(openTimer)
		openTimer.current = setTimeout(openNow, Math.max(0, options.delay ?? 200))
	}

	const scheduleClose = () => {
		if (options.isOpen === true) {
			return
		}

		clear(closeTimer)
		closeTimer.current = setTimeout(closeNow, Math.max(0, options.hideDelay ?? 100))
	}

	const bindAnchor = (view: any) => {
		if (view && view === anchor.current && detach.current) {
			return
		}

		anchor.current = view
		detach.current?.()
		detach.current = null
		const observe = host().observeHover
		if (!view || typeof observe !== 'function') {
			return
		}

		detach.current = observe(view, {
			enter: startOpen,
			exit: () => {
				clear(openTimer)
				scheduleClose()
			},
		})
	}

	useEffect(
		() => () => {
			clear(openTimer)
			clear(closeTimer)
			detach.current?.()
			popup.current?.close()
		},
		[],
	)

	useEffect(() => {
		if (options.isOpen === true) {
			openNow()
		} else if (options.isOpen === false) {
			closeNow()
		}
	}, [options.isOpen])

	if (options.isDefaultOpen) {
		openNow()
	}

	const renderTooltip = useCallback(
		(children: any, props?: Omit<ContextRenderProps, 'positioning'>) => {
			content.current = children
			surface.current = props
			return null
		},
		[],
	)

	return {
		ref: bindAnchor,
		positionRef: bindAnchor,
		interactionRef: bindAnchor,
		anchorId: id,
		describedBy: id,
		renderTooltip,
	}
}
