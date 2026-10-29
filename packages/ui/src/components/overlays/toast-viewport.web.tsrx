/** @jsxImportSource @octane-xplat/jsx/dom */
import { useEffect, useId, useMemo, useRef } from 'octane'
import type { ToastEntry, ToastPosition, ToastViewportProps } from '../../props'
import { ToastViewportProvider, type ToastViewportContextValue } from './toast-context'
import {
	FALLBACK_TOAST_VIEWPORT,
	dismissToast,
	registerToastViewport,
	toastOnViewport,
	toastStore,
	toastTiming,
} from './toast-store'

import { useStore } from '../../data/use-store.web.tsrx'
import { announce } from '../../internal/accessibility/announce.web'
import { applyThemeClasses } from '../../theme/theme-host'
import { cx } from '@octane-xplat/lib'
import { ToastSurface } from './Toast.web.tsrx'
import { Popover } from './Popover.web.tsrx'

const POSITIONS: ToastPosition[] = ['topStart', 'topEnd', 'bottomStart', 'bottomEnd']

const FOCUSABLE =
	'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"]), [role="button"], [role="link"]'

const firstFocusable = (container: HTMLElement | null): HTMLElement | null => {
	if (!container) {
		return null
	}

	for (const el of container.querySelectorAll<HTMLElement>(FOCUSABLE)) {
		if (el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true') {
			continue
		}

		return el
	}

	return null
}

const positionOf = (entry: ToastEntry, fallback: ToastPosition): ToastPosition =>
	entry.options.position ?? fallback

/** The toast stack for one viewport id — the fixed, top-layer container
 *  holding a column per occupied edge. Shared by `ToastViewport` and the
 *  auto-mounted fallback stack (`showToast` without a provider). */
export function ToastViewportSurface(props: {
	viewportId: string
	position: ToastPosition
	maxVisible: number
	inset?: ToastViewportProps['inset']
	isTopLayer?: boolean
}) @{
	const entries = useStore(toastStore)
	const mine = entries.filter((e) => toastOnViewport(e, props.viewportId))
	const viewport = useRef<HTMLDivElement | null>(null)
	const prevFocus = useRef<HTMLElement | null>(null)
	const announced = useRef<string | null>(null)
	const themeDetach = useRef<(() => void) | undefined>(undefined)

	const viewportClass = cx(
		'vx-toast-viewport',
		props.position.startsWith('top') ? 'vx-toast-viewport--top' : 'vx-toast-viewport--bottom',
		props.position.endsWith('Start') ? 'vx-toast-viewport--start' : 'vx-toast-viewport--end',
	)

	// The fallback stack mounts on a detached container — mirror the app's
	// theme attrs onto it so scoped theme CSS resolves (MutationObserver
	// keeps it live). Mounted viewports inherit the tree's theme already.
	// `applyThemeClasses` owns the element's className, so the viewport's
	// own classes ride along as its base.
	useEffect(() => {
		const el = viewport.current
		if (!el) {
			return
		}

		themeDetach.current = applyThemeClasses(el, viewportClass)
		return () => themeDetach.current?.()
	}, [])

	// Top-layer promotion (above <dialog> modals) via popover=manual.
	useEffect(() => {
		const el = viewport.current
		if (!el || props.isTopLayer === false) {
			return
		}

		if (typeof el.showPopover === 'function') {
			try {
				el.showPopover()
			} catch {
				/* already showing */
			}
		}
	}, [props.isTopLayer])

	// Announce the newest toast through the persistent document-level live
	// regions (Astryx `useAnnounce`) — the per-toast role regions are born
	// with content, which many screen readers skip; mutating a mounted
	// empty region is what announces. String bodies announce; structured
	// content does not (documented).
	useEffect(() => {
		const newest = mine[mine.length - 1]
		if (!newest || newest.id === announced.current) {
			return
		}

		announced.current = newest.id
		const body = newest.options.body
		if (typeof body !== 'string' || !body) {
			return
		}

		announce(body, (newest.options.type ?? 'info') === 'error' ? 'assertive' : 'polite')
	}, [mine])

	// F6 jumps focus into the stack (standard "go to notifications" jump);
	// non-modal toasts let it leave naturally. Restore it when the last
	// toast exits so focus never falls to <body>.
	useEffect(() => {
		if (!mine.length) {
			const prev = prevFocus.current
			const el = viewport.current
			const active = document.activeElement as HTMLElement | null
			if (prev && el && active && el.contains(active)) {
				prevFocus.current = null
				if (prev.isConnected) {
					prev.focus({ preventScroll: true })
				}
			}

			return
		}

		const onKey = (event: KeyboardEvent) => {
			if (event.key !== 'F6') {
				return
			}

			const el = viewport.current
			if (!el) {
				return
			}

			const active = document.activeElement
			if (active instanceof Node && el.contains(active)) {
				return
			}

			event.preventDefault()
			if (active instanceof HTMLElement) {
				prevFocus.current = active
			}

			const toasts = el.querySelectorAll<HTMLElement>('[data-toast-id]')
			const newestToast = toasts[toasts.length - 1] ?? null

			;(firstFocusable(newestToast) ?? newestToast ?? el).focus?.()
		}

		document.addEventListener('keydown', onKey)
		return () => document.removeEventListener('keydown', onKey)
	}, [mine.length])

	// Anchored toasts bypass the edge stack — a Popover positions them
	// against their anchor view (xplat extension, `options.anchor`).
	const anchored = mine.filter((e) => e.options.anchor != null)
	const stacked = mine.filter((e) => e.options.anchor == null)
	const buckets = POSITIONS.map((pos) =>
		stacked.filter((e) => positionOf(e, props.position) === pos).slice(-props.maxVisible),
	)

	// The viewport box anchors to the stack's block edge; `inset` also feeds
	// the fixed corner stacks through custom properties.
	const insetStyle: Record<string, any> = {}
	if (props.inset?.top != null) {
		insetStyle.top = props.inset.top
		insetStyle['--vx-toast-inset-block-start'] = `${props.inset.top}px`
	}

	if (props.inset?.bottom != null) {
		insetStyle.bottom = props.inset.bottom
		insetStyle['--vx-toast-inset-block-end'] = `${props.inset.bottom}px`
	}

	if (props.inset?.start != null) {
		insetStyle.insetInlineStart = props.inset.start
		insetStyle['--vx-toast-inset-inline-start'] = `${props.inset.start}px`
	}

	if (props.inset?.end != null) {
		insetStyle.insetInlineEnd = props.inset.end
		insetStyle['--vx-toast-inset-inline-end'] = `${props.inset.end}px`
	}

	const viewportEl = (
		<div
			ref={viewport}
			className={viewportClass}
			style={insetStyle}
			role={mine.length ? 'region' : undefined}
			aria-label={mine.length ? 'Notifications' : undefined}
			tabIndex={mine.length ? -1 : undefined}
			{...(props.isTopLayer === false ? {} : ({ popover: 'manual' } as Record<string, unknown>))}
		>
			{POSITIONS.map((pos, i) => {
				const list = buckets[i]
				if (!list.length) {
					return null
				}

				return (
					<div
						key={pos}
						className={cx(
							'vx-toast-stack',
							`vx-toast-stack--${pos[0] === 't' ? 'top' : 'bottom'}`,
							pos.endsWith('Start') ? 'vx-toast-stack--start' : 'vx-toast-stack--end',
						)}
					>
						{list.map((entry) => {
							const o = entry.options
							const timing = toastTiming(o)
							return (
								<div
									key={entry.id}
									data-toast-id={entry.id}
									className={cx('vx-toast-row', entry.exiting && 'vx-toast-row--exiting')}
								>
									<ToastSurface
										type={o.type ?? 'info'}
										body={o.body}
										endContent={o.endContent}
										isAutoHide={timing.isAutoHide}
										autoHideDuration={timing.autoHideDuration}
										isExiting={entry.exiting}
										renderContent={o.renderContent}
										onDismiss={(reason) => dismissToast(entry.id, reason)}
									/>
								</div>
							)
						})}
					</div>
				)
			})}
			{anchored.map((entry) => {
				const o = entry.options
				const timing = toastTiming(o)
				return (
					<Popover
						key={entry.id}
						open={!entry.exiting}
						anchor={o.anchor!}
						placement={
							o.placement ??
							(positionOf(entry, props.position).startsWith('top') ? 'top' : 'bottom')
						}
						dismissOnOutsideTap={false}
						web={{ 'data-toast-id': entry.id }}
					>
						<ToastSurface
							type={o.type ?? 'info'}
							body={o.body}
							endContent={o.endContent}
							isAutoHide={timing.isAutoHide}
							autoHideDuration={timing.autoHideDuration}
							isExiting={entry.exiting}
							renderContent={o.renderContent}
							onDismiss={(reason) => dismissToast(entry.id, reason)}
						/>
					</Popover>
				)
			})}
		</div>
	)

	// Top-layer viewports sit behind display:contents outlet/host wrappers
	// (Astryx's markup) so the in-flow node carries zero layout footprint.
	if (props.isTopLayer === false) {
		return viewportEl
	}

	return (
		<div className="vx-toast-outlet">
			<div className="vx-toast-layer">{viewportEl}</div>
		</div>
	)
}

/** Toast stack container (Astryx `ToastViewport`), web leaf. Provides the
 *  context `useToast` routes through and renders its own fixed stack;
 *  toasts pushed unscoped land on the auto-mounted fallback stack. */
export function ToastViewport(props: ToastViewportProps) @{
	const id = useId()
	const ctx = useMemo<ToastViewportContextValue>(
		() => ({ id, position: props.position ?? 'bottomEnd', maxVisible: props.maxVisible ?? 5 }),
		[id, props.position, props.maxVisible],
	)

	useEffect(() => registerToastViewport(id), [id])

	<ToastViewportProvider value={ctx}>
		{props.children}
		<ToastViewportSurface
			viewportId={id}
			position={ctx.position}
			maxVisible={ctx.maxVisible}
			inset={props.inset}
			isTopLayer={props.isTopLayer}
		/>
	</ToastViewportProvider>
}
