/** @jsxImportSource octane */
import { useEffect, useRef } from 'octane'
import type { BottomSheetProps, WebFocusTarget } from './web/types'

function tabStops(panel: HTMLElement): HTMLElement[] {
	return Array.from(
		panel.querySelectorAll<HTMLElement>(
			'a[href],button,input:not([type="hidden"]),textarea,select,[tabindex],[contenteditable="true"]',
		),
	).filter((element) => {
		if (
			element.tabIndex < 0 ||
			element.matches(':disabled') ||
			element.closest('[inert],[hidden],[aria-hidden="true"]')
		) {
			return false
		}

		for (let parent: HTMLElement | null = element; parent; parent = parent.parentElement) {
			const style = getComputedStyle(parent)
			if (style.display === 'none' || style.visibility === 'hidden') {
				return false
			}
		}

		return true
	})
}

/** Web bottom sheet: a modal browser dialog. `open` controls visibility;
 *  `onDismissed` fires for enabled Escape, scrim, and drag dismissals. */
export function BottomSheet(props: BottomSheetProps) @{
	const dialog = useRef<HTMLDialogElement | null>(null)
	const panel = useRef<HTMLDivElement | null>(null)
	const drag = useRef<{ pointerId: number; startY: number; offsetY: number } | null>(null)

	useEffect(() => {
		const current = dialog.current
		if (!props.open || !current || current.open) {
			return
		}

		const trigger =
			props.finalFocusRef?.current ?? (current.ownerDocument.activeElement as WebFocusTarget | null)

		const previousTabIndex = current.getAttribute('tabindex')
		current.showModal()
		const stops = panel.current ? tabStops(panel.current) : []
		const autofocus = current.querySelector<HTMLElement>('[autofocus]')
		const initialFocus =
			(autofocus && !autofocus.matches(':disabled,[hidden],[inert]') ? autofocus : null) ??
			stops[0] ??
			current

		if (initialFocus === current && previousTabIndex === null) {
			current.tabIndex = -1
		}

		initialFocus.focus({ preventScroll: true })

		return () => {
			if (current.open) {
				current.close()
			}

			if (previousTabIndex === null && initialFocus === current) {
				current.removeAttribute('tabindex')
			}

			requestAnimationFrame(() => {
				if (trigger?.isConnected && !trigger.closest('[inert]')) {
					trigger.focus({ preventScroll: true })
				}
			})
		}
	}, [props.open])

	if (!props.open || typeof document === 'undefined') {
		return <></>
	}

	const resetDrag = () => {
		drag.current = null
		panel.current?.style.removeProperty('--xplat-sheet-drag-offset')
		panel.current?.style.removeProperty('transition')
	}

	const onPointerDown = (event: PointerEvent) => {
		if (props.sheetGesturesEnabled === false || !event.isPrimary || event.button !== 0) {
			return
		}

		drag.current = { pointerId: event.pointerId, startY: event.clientY, offsetY: 0 }
		panel.current?.style.setProperty('transition', 'none')

		;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
	}

	const onPointerMove = (event: PointerEvent) => {
		const active = drag.current
		if (!active || active.pointerId !== event.pointerId) {
			return
		}

		active.offsetY = Math.max(0, event.clientY - active.startY)
		panel.current?.style.setProperty('--xplat-sheet-drag-offset', `${active.offsetY}px`)
	}

	const onPointerUp = (event: PointerEvent) => {
		const active = drag.current
		if (!active || active.pointerId !== event.pointerId) {
			return
		}

		const shouldDismiss = active.offsetY >= Math.min(120, window.innerHeight * 0.18)
		resetDrag()

		if (shouldDismiss && props.sheetGesturesEnabled !== false) {
			props.onDismissed?.()
		}
	}

	const onCancel = (event: Event) => {
		event.preventDefault()
		if (props.shouldDismissOnBackPress ?? true) {
			props.onDismissed?.()
		}
	}

	const onKeyDown = (event: KeyboardEvent) => {
		if (event.key !== 'Tab') {
			return
		}

		const current = dialog.current
		const active = current?.ownerDocument.activeElement
		if (!current?.open || (active !== current && !panel.current?.contains(active))) {
			return
		}

		const stops = panel.current ? tabStops(panel.current) : []
		const index = stops.indexOf(active as HTMLElement)
		event.preventDefault()
		if (!stops.length) {
			dialog.current?.focus({ preventScroll: true })
			return
		}

		const nextIndex = event.shiftKey
			? index <= 0 ? stops.length - 1 : index - 1
			: index < 0 || index === stops.length - 1 ? 0 : index + 1

		stops[nextIndex].focus({ preventScroll: true })
	}

	useEffect(() => {
		const current = dialog.current
		if (!props.open || !current) {
			return
		}

		current.ownerDocument.addEventListener('keydown', onKeyDown, true)
		return () => current.ownerDocument.removeEventListener('keydown', onKeyDown, true)
	}, [props.open])

	<>
		<dialog
			ref={dialog}
			className="xplat-web-sheet"
			aria-label={props.label ?? 'Bottom sheet'}
			aria-modal="true"
			style={{
				'--xplat-sheet-scrim': props.scrimColor ?? 'rgb(0 0 0 / 0.4)',
				'--xplat-sheet-container': props.containerColor ?? 'var(--sheet-bg, Canvas)',
				'--xplat-sheet-content': props.contentColor ?? 'var(--sheet-fg, CanvasText)',
				'--xplat-sheet-max-height': props.skipPartiallyExpanded ? '90vh' : '60vh',
			}}
			onCancel={onCancel}
			onClick={(event: MouseEvent) => {
				if (
					event.target === event.currentTarget &&
					(props.shouldDismissOnClickOutside ?? true)
				) {
					props.onDismissed?.()
				}
			}}
		>
			<div
				ref={panel}
				id={props.id}
				className={'xplat-web-sheet-panel ' + (props.className ?? '')}
				style={props.style}
			>
				{(props.showDragHandle ?? true) && (
					<div
						className="xplat-web-sheet-handle"
						aria-hidden="true"
						onPointerDown={onPointerDown}
						onPointerMove={onPointerMove}
						onPointerUp={onPointerUp}
						onPointerCancel={resetDrag}
					>
						<div className="xplat-web-sheet-handle-mark" />
					</div>
				)}
				{props.content?.()}
			</div>
		</dialog>
	</>
}
