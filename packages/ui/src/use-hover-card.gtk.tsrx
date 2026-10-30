/** @jsxImportSource @octane-xplat/jsx */
import Gtk from 'gi://Gtk?version=4.0'
import { mergeStyle } from './style-merge'
import { useLayer } from './use-layer'
import { useCallback, useEffect, useRef, useState } from 'octane'
import type { HoverCardOptions, HoverCardReturn } from './props'
import { cx } from '@octane-xplat/lib'

/** Gtk.EventControllerMotion supplies pointer enter/leave intent — the
 *  macOS AppKit `observeHover` tracking-area equivalent. Returns a detach
 *  that removes the controller. */
function observeHover(view: any, handlers: { enter: () => void; exit: () => void }) {
	const motion = new Gtk.EventControllerMotion()
	motion.connect('enter', () => handlers.enter())
	motion.connect('leave', () => handlers.exit())
	view.add_controller(motion)
	return () => view.remove_controller(motion)
}

function HoverCardPanel(props: { body: any; enter: () => void; exit: () => void }) @{
	const detach = useRef<(() => void) | null>(null)
	// `enter`/`exit` are recreated by the caller every render — the ref
	// callback must NOT depend on them or the controller re-attaches each
	// render and loses the pointer state (a controller that re-attachs while
	// the pointer is inside never emits a later `leave`). Latest refs keep
	// the callbacks current with a constant ref identity.
	const handlers = useRef({ enter: props.enter, exit: props.exit })
	handlers.current = { enter: props.enter, exit: props.exit }
	const bind = useCallback(
		(v: any) => {
			detach.current?.()
			detach.current = null
			if (v) {
				detach.current = observeHover(v, {
					enter: () => handlers.current.enter(),
					exit: () => handlers.current.exit(),
				})
			}
		},
		[],
	)
	useEffect(() => () => detach.current?.(), [])

	<masonview
		ref={bind}
		className="vx-hovercard-content"
		style={mergeStyle({ flexDirection: 'column' }, { display: 'flex' })}
	>
		{props.body}
	</masonview>
}

/** GTK leaf of the hover-card hook — pointer intent comes from
 *  Gtk.EventControllerMotion rather than AppKit tracking areas; the card
 *  mounts through the GTK `useLayer` popover session. Identical return shape
 *  to the shared leaf. */
export function useHoverCard(options: HoverCardOptions = {}): HoverCardReturn @{
	const isEnabled = options.isEnabled ?? true
	const delay = Math.max(0, options.delay ?? 300)
	const hideDelay = Math.max(0, options.hideDelay ?? 200)
	const controlled = options.isOpen !== undefined
	const [uncontrolled, setUncontrolled] = useState(options.isDefaultOpen === true)
	const open = controlled ? options.isOpen === true : uncontrolled

	const positionEl = useRef<any>(null)
	const interactionEl = useRef<any>(null)
	const detachHover = useRef<(() => void) | null>(null)

	const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
	const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
	const onShow = useRef(options.onShow)
	onShow.current = options.onShow
	const onHide = useRef(options.onHide)
	onHide.current = options.onHide

	const clearTimers = useCallback(() => {
		if (openTimer.current) { clearTimeout(openTimer.current) }
		if (closeTimer.current) { clearTimeout(closeTimer.current) }
		openTimer.current = null
		closeTimer.current = null
	}, [])

	const requestedShow = useRef(false)
	const closeNow = useCallback(() => {
		clearTimers()
		if (!controlled) { setUncontrolled(false) }
		onHide.current?.()
	}, [clearTimers, controlled])

	const openNow = useCallback(() => {
		if (!isEnabled || open || !positionEl.current) { return }
		requestedShow.current = true
		if (!controlled) { setUncontrolled(true) }
		onShow.current?.()
	}, [isEnabled, controlled, open])

	const layer = useLayer({
		mode: 'context',
		isOpen: open && isEnabled,
		dismissOnEscape: true,
		lightDismiss: true,
		onHide: closeNow,
	})

	const id = layer.id
	const scheduleShow = useCallback(() => {
		if (!isEnabled || options.isOpen === false) { return }
		clearTimers()
		openTimer.current = setTimeout(() => {
			openTimer.current = null
			openNow()
		}, delay)
	}, [isEnabled, options.isOpen, clearTimers, openNow, delay])

	// Pointer motion on a Gtk popup can deliver the panel's `enter` before the
	// trigger's `leave` — the earlier `enter` then cannot cancel the later
	// `leave`'s hide timer. Track hover state and only close when the pointer
	// is over neither the trigger nor the card when the timer fires.
	const overTrigger = useRef(false)
	const overCard = useRef(false)
	const scheduleHide = useCallback(() => {
		if (options.isOpen === true) { return }
		clearTimers()
		closeTimer.current = setTimeout(() => {
			closeTimer.current = null
			if (!overTrigger.current && !overCard.current) { closeNow() }
		}, hideDelay)
	}, [options.isOpen, clearTimers, hideDelay, closeNow])

	const scheduleCardHide = useCallback(() => {
		clearTimers()
		closeTimer.current = setTimeout(() => {
			closeTimer.current = null
			if (!overTrigger.current && !overCard.current) { closeNow() }
		}, hideDelay)
	}, [clearTimers, closeNow, hideDelay])

	const positionRef = useCallback(
		(el: any) => {
			positionEl.current = el
			layer.ref(el)
		},
		[layer.ref],
	)

	// Same stability fix — scheduleShow/scheduleHide are recreated every
	// render, so the ref must bind once with latest refs, not re-attach.
	const latestShow = useRef(scheduleShow)
	latestShow.current = scheduleShow
	const latestHide = useRef(scheduleHide)
	latestHide.current = scheduleHide
	const interactionRef = useCallback(
		(el: any) => {
			detachHover.current?.()
			detachHover.current = null
			interactionEl.current = el
			if (!el || !isEnabled) { return }
			detachHover.current = observeHover(el, {
				enter: () => { overTrigger.current = true; latestShow.current() },
				exit: () => {
					overTrigger.current = false
					if (openTimer.current) {
						clearTimeout(openTimer.current)
						openTimer.current = null
					}
					latestHide.current()
				},
			})
		},
		[isEnabled],
	)

	const ref = useCallback(
		(el: any) => {
			positionRef(el)
			interactionRef(el)
		},
		[positionRef, interactionRef],
	)

	useEffect(() => {
		if (open && isEnabled) {
			if (!requestedShow.current) { onShow.current?.() }
			requestedShow.current = false
		}
	}, [open, isEnabled])

	useEffect(() => {
		if (options.isOpen === false) { clearTimers() }
	}, [options.isOpen, clearTimers])

	useEffect(
		() => () => {
			clearTimers()
			detachHover.current?.()
		},
		[clearTimers],
	)

	const renderHoverCard = useCallback(
		(children: any, props?: Record<string, any>) => {
			return layer.render(
				<HoverCardPanel
					body={children}
					enter={() => { overCard.current = true; clearTimers() }}
					exit={() => { overCard.current = false; scheduleCardHide() }}
				/>,
				{
					placement: props?.placement ?? options.placement ?? 'above',
					alignment: props?.alignment ?? options.alignment ?? 'center',
					offset: 8,
					className: cx('vx-hovercard', props?.className),
					style: props?.style,
					accessibilityLabel: options.label,
				},
			)
		},
		[layer.render, options.placement, options.alignment, options.label, scheduleCardHide, clearTimers],
	)

	return {
		ref,
		positionRef,
		interactionRef,
		anchorId: layer.anchorId,
		id,
		describedBy: id,
		isOpen: open,
		renderHoverCard,
		show: openNow,
		hide: closeNow,
	}
}
