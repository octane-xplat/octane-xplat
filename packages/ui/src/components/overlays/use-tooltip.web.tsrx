/** @jsxImportSource @octane-xplat/jsx/dom */
import { useCallback, useEffect, useRef, useState } from 'octane'
import type { ContextRenderProps, TooltipOptions, TooltipReturn } from '../../props'
import { useLayer } from './use-layer'
import { cx } from '@octane-xplat/lib'

const ACTION_SELECTOR =
	'button, a[href], input, select, textarea, summary, [role="button"], [role="link"], [contenteditable="true"]'

const isFocusable = (el: HTMLElement): boolean =>
	el.hasAttribute('tabindex')
		? el.tabIndex >= 0
		: el.isContentEditable || ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].includes(el.tagName)

/** Headless tooltip (Astryx `useTooltip`), web leaf — hover/focus intent
 *  opens the hint after `delay`; pointer/focus leave, Escape and scroll
 *  hide it. The panel is `role="tooltip"` with pointer events off; the
 *  resolved focusable trigger gets `aria-describedby`. Touch taps open
 *  per `touchTrigger` ('auto' skips action triggers). */
export function useTooltip(options: TooltipOptions = {}): TooltipReturn {
	const {
		placement = 'above',
		alignment = 'center',
		delay = 200,
		hideDelay = 0,
		focusTrigger = 'auto',
		touchTrigger = 'auto',
		isEnabled = true,
		isOpen,
		isDefaultOpen = false,
		onShow,
		onHide,
	} = options

	const [uncontrolled, setUncontrolled] = useState(isDefaultOpen)
	const controlled = isOpen !== undefined
	const open = controlled ? isOpen === true : uncontrolled
	const interactionEl = useRef<HTMLElement | null>(null)
	const describedEl = useRef<HTMLElement | null>(null)
	const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
	const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
	const isTouch = useRef(false)
	const onShowRef = useRef(onShow)
	onShowRef.current = onShow
	const onHideRef = useRef(onHide)
	onHideRef.current = onHide

	const clearTimers = useCallback(() => {
		if (showTimer.current) {
			clearTimeout(showTimer.current)
		}

		if (hideTimer.current) {
			clearTimeout(hideTimer.current)
		}

		showTimer.current = hideTimer.current = null
	}, [])

	const showNow = useCallback(() => {
		clearTimers()
		if (!controlled) {
			setUncontrolled(true)
		}

		onShowRef.current?.()
	}, [clearTimers, controlled])

	const hideNow = useCallback(() => {
		clearTimers()
		if (!controlled) {
			setUncontrolled(false)
		}

		onHideRef.current?.()
	}, [clearTimers, controlled])

	const scheduleShow = useCallback(() => {
		if (!isEnabled || isOpen === false) {
			return
		}

		clearTimers()
		showTimer.current = setTimeout(
			() => {
				showTimer.current = null
				if (!controlled) {
					setUncontrolled(true)
				}

				onShowRef.current?.()
			},
			Math.max(0, delay),
		)
	}, [isEnabled, isOpen, controlled, delay, clearTimers])

	const scheduleHide = useCallback(() => {
		if (isOpen === true) {
			return
		}

		clearTimers()
		hideTimer.current = setTimeout(
			() => {
				hideTimer.current = null
				if (!controlled) {
					setUncontrolled(false)
				}

				onHideRef.current?.()
			},
			Math.max(0, hideDelay),
		)
	}, [isOpen, controlled, hideDelay, clearTimers])

	const onMouseEnter = useCallback(() => {
		if (!isTouch.current) {
			scheduleShow()
		}
	}, [scheduleShow])

	const onMouseLeave = useCallback(() => {
		if (!isTouch.current) {
			scheduleHide()
		}
	}, [scheduleHide])

	const onPointerDown = useCallback(
		(event: PointerEvent) => {
			if (event.pointerType !== 'touch') {
				isTouch.current = false
				return
			}

			isTouch.current = true
			if (!isEnabled || touchTrigger === 'none' || controlled) {
				return
			}

			if (
				touchTrigger === 'auto' &&
				(event.target as HTMLElement | null)?.closest?.(ACTION_SELECTOR)
			) {
				return
			}

			open ? hideNow() : showNow()
		},
		[isEnabled, touchTrigger, controlled, open, showNow, hideNow],
	)

	const onFocusIn = useCallback(() => {
		if (!isEnabled || isTouch.current) {
			return
		}

		clearTimers()
		if (!controlled) {
			setUncontrolled(true)
		}

		onShowRef.current?.()
	}, [isEnabled, controlled, clearTimers])

	const onFocusOut = useCallback(() => {
		if (!controlled) {
			setUncontrolled(false)
		}

		onHideRef.current?.()
	}, [controlled])

	const interactionRef = useCallback(
		(el: any) => {
			const prev = interactionEl.current
			if (prev) {
				prev.removeEventListener('mouseenter', onMouseEnter)
				prev.removeEventListener('mouseleave', onMouseLeave)
				prev.removeEventListener('pointerdown', onPointerDown as EventListener)
				prev.removeEventListener('focusin', onFocusIn)
				prev.removeEventListener('focusout', onFocusOut as EventListener)
			}

			interactionEl.current = el
			if (el) {
				el.addEventListener('mouseenter', onMouseEnter)
				el.addEventListener('mouseleave', onMouseLeave)
				el.addEventListener('pointerdown', onPointerDown as EventListener)
				if (focusTrigger === 'always' || (focusTrigger === 'auto' && isFocusable(el))) {
					el.addEventListener('focusin', onFocusIn)
					el.addEventListener('focusout', onFocusOut as EventListener)
				}
			}
		},
		[focusTrigger, onMouseEnter, onMouseLeave, onPointerDown, onFocusIn, onFocusOut],
	)

	const layer = useLayer({
		mode: 'context',
		isOpen: open,
		lightDismiss: isTouch.current,
		dismissOnEscape: true,
		onHide: () => {
			isTouch.current = false
			hideNow()
		},
	})

	const id = layer.id

	const positionRef = useCallback(
		(el: any) => {
			layer.ref(el)
		},
		[layer.ref],
	)

	const ref = useCallback(
		(el: any) => {
			positionRef(el)
			interactionRef(el)
		},
		[positionRef, interactionRef],
	)

	useEffect(() => {
		if (isDefaultOpen) {
			if (!controlled) {
				setUncontrolled(true)
			}

			onShowRef.current?.()
		}
	}, [])

	useEffect(() => () => clearTimers(), [clearTimers])

	// aria-describedby on the resolved focusable trigger; scroll hides.
	useEffect(() => {
		if (!open) {
			return
		}

		const host = interactionEl.current
		const target = (
			host?.matches?.(ACTION_SELECTOR) ? host : (host?.querySelector?.(ACTION_SELECTOR) ?? host)
		) as HTMLElement | null

		if (target) {
			target.setAttribute('aria-describedby', id)
			describedEl.current = target
		}

		const onScroll = () => hideNow()
		window.addEventListener('scroll', onScroll, true)
		return () => {
			window.removeEventListener('scroll', onScroll, true)
			describedEl.current?.removeAttribute('aria-describedby')
			describedEl.current = null
		}
	}, [open, id, hideNow])

	const renderTooltip = useCallback(
		(children: any, props?: Omit<ContextRenderProps, 'positioning'>) =>
			layer.render(children, {
				placement: props?.placement ?? placement,
				alignment: props?.alignment ?? alignment,
				offset: props?.offset ?? 8,
				accessibilityRole: 'tooltip',
				className: cx('vx-tooltip', props?.className),
				style: { pointerEvents: 'none', ...(props?.style as any) },
				web: { id, ...props?.web },
			}),
		[layer.render, placement, alignment, id],
	)

	return {
		ref,
		positionRef,
		interactionRef,
		anchorId: layer.anchorId,
		describedBy: id,
		renderTooltip,
	}
}
