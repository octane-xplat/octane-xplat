/** @jsxImportSource @octane-xplat/jsx/dom */
import type { Context } from 'octane'
import type { JSX } from 'octane/jsx-runtime'
import {
	createContext,
	createPortal,
	useContext,
	useEffect,
	useEffectEvent,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from 'octane'

import { Overlay } from '@octane-xplat/ui'
import { useMotionValue, useReducedMotion } from '@octane-xplat/motion'
import { Image } from './Image.web.tsrx'
import type { MotionValue } from '@octane-xplat/motion'
import { cx } from '@octane-xplat/lib'
import { mergeStyle } from './style-merge'
import { useDialogPart, useDialogText } from './dialog-text'
import { clamp } from './math'
import type { Rect, Visual } from './math'
import { reduce } from './state'
import type { RootAction, RootEffect, RootState } from './state'
import { CLOSE, FADE, OPEN, REDUCED, SETTLE } from './constants'
import type { Transition } from '@octane-xplat/motion'
import { lockScroll, thumbImg, visibleFraction } from './web-dom.web'
import type {
	LightboxMedia,
	LightboxPartProps,
	LightboxRootProps,
	LightboxSlidePartProps,
	LightboxTapEvent,
	LightboxTriggerPartProps,
	UseLightboxState,
} from './props'

export interface ImageController {
	animateIn(trigger: HTMLElement | null): void
	animateOut(trigger: HTMLElement | null, velocity?: { x: number; y: number }): Promise<void>
	zoomBy(factor: number): void
	resetZoom(): void
}

export interface ViewportController {
	goTo(index: number, behavior: 'auto' | 'instant' | 'smooth'): void
	freeze(index: number): void
	fade(from: number, to: number): Promise<void>
	track(phase: 'start' | 'move' | 'end', dx: number, vx: number): void
}

interface CtxOptions {
	maxZoom: number
	wheelToZoom: boolean
	closeOnBackdropClick: boolean
	scrollTriggerIntoView: 'smooth' | 'instant' | false
	open: Transition
	close: Transition
	finalFocusRef?: { current: unknown | null }
}

export interface LightboxCtx {
	dialogText: ReturnType<typeof useDialogText>
	items: LightboxMedia[]
	index: number
	phase: 'closed' | 'opening' | 'open' | 'closing'
	zoomed: boolean
	dragging: boolean
	uiHidden: boolean
	reducedMotion: boolean
	presence: MotionValue
	progress: MotionValue
	held: number | null
	options: CtxOptions
	triggers: Map<number, Set<HTMLElement>>
	images: Map<number, ImageController>
	viewport: { current: ViewportController | null }
	openTrigger: { current: HTMLElement | null }
	openAt(index: number, trigger?: HTMLElement | null): void
	close(velocity?: { x: number; y: number }): void
	goTo(index: number): void
	pickTrigger(index: number, scroll: 'auto' | 'instant' | 'smooth' | false): HTMLElement | null
	hideTrigger(trigger: HTMLElement | null): void
	onScrollIndex(index: number): void
	onOpened(): void
	setZoomed(zoomed: boolean): void
	setDragging(dragging: boolean): void
	toggleUi(): void
}

export interface SlideCtx {
	index: number
	onTap?: (event: LightboxTapEvent) => void
}

export const LightboxContext: Context<LightboxCtx | null> = createContext<LightboxCtx | null>(null)
/** Internal: lets `useLightbox` share a trigger registry with the Root it
 *  renders, without exposing a `triggers` prop on the public API. */
export const InternalTriggersContext: Context<Map<number, Set<HTMLElement>> | null> =
	createContext<Map<number, Set<HTMLElement>> | null>(null)

export const SlideContext: Context<SlideCtx | null> = createContext<SlideCtx | null>(null)

export function useLightboxCtx(): LightboxCtx {
	const ctx = useContext(LightboxContext)
	if (!ctx) {
		throw new Error('Lightbox parts must be used inside <Lightbox.Root>.')
	}

	return ctx
}

export function useSlideCtx(): SlideCtx {
	const slide = useContext(SlideContext)
	if (!slide) {
		throw new Error('<Lightbox.Image> must be inside <Lightbox.Slide>.')
	}

	return slide
}

const initialState = (): RootState => ({
	index: 0,
	phase: 'closed',
	zoomed: false,
	dragging: false,
	uiHidden: false,
	held: null,
})

export function Root(props: LightboxRootProps): JSX.Element {
	const {
		media: items,
		children,
		maxZoom: requestedMaxZoom = 4,
		hasWheelZoom: wheelToZoom = false,
		hasBackdropDismiss = true,
		triggerScroll: scrollTriggerIntoView = 'smooth',
		transition,
		onOpenChange,
		onIndexChange,
		finalFocusRef,
	} = props

	const dialogText = useDialogText()
	const maxZoom = props.hasZoom === false ? 1 : requestedMaxZoom
	const [state, setState] = useState(initialState)
	const live = useRef(state)
	live.current = state
	const reducedMotion = useReducedMotion() ?? false
	const presence = useMotionValue(0)
	const progress = useMotionValue(0)
	const sharedTriggers = useContext(InternalTriggersContext)
	const [triggers] = useState(() => sharedTriggers ?? new Map<number, Set<HTMLElement>>())
	const [images] = useState(() => new Map<number, ImageController>())
	const viewport = useRef<ViewportController | null>(null)
	const openTrigger = useRef<HTMLElement | null>(null)
	const hidden = useRef<HTMLElement[]>([])
	const closeVelocity = useRef<{ x: number; y: number } | undefined>(undefined)

	const hideTrigger = useEffectEvent((trigger: HTMLElement | null) => {
		for (const el of hidden.current) {
			el.style.visibility = ''
		}

		hidden.current = trigger ? [thumbImg(trigger) ?? trigger] : []
		for (const el of hidden.current) {
			el.style.visibility = 'hidden'
		}
	})

	const pickTrigger = useEffectEvent(
		(i: number, scroll: 'auto' | 'instant' | 'smooth' | false): HTMLElement | null => {
			const list = [...(triggers.get(i) ?? [])].filter((el) => el.isConnected)
			const opened = list.find((el) => el === openTrigger.current && visibleFraction(el) > 0)
			let best: HTMLElement | null = null
			let seen = 0
			for (const el of list) {
				const v = visibleFraction(el)
				if (v > seen + 0.01) {
					;[best, seen] = [el, v]
				}
			}

			const el = opened ?? best ?? list[0] ?? null
			const v = el ? visibleFraction(el) : 1
			if (el && scroll && v < 0.99) {
				el.scrollIntoView?.({
					block: v > 0 ? 'nearest' : 'center',
					inline: 'nearest',
					behavior: scroll === 'instant' ? 'auto' : scroll,
				})
			}

			return el
		},
	)

	const isOpen = live.current.phase !== 'closed'
	useLayoutEffect(() => (isOpen ? lockScroll() : undefined), [isOpen])

	// The page behind keeps up: hide the current thumbnail and keep it in view.
	useEffect(() => {
		if (state.phase !== 'open') {
			return
		}

		hideTrigger(pickTrigger(state.index, false))
		if (!scrollTriggerIntoView) {
			return
		}

		const id = setTimeout(() => {
			const el = pickTrigger(state.index, false)
			if (el && visibleFraction(el) < 0.99) {
				el.scrollIntoView?.({
					block: 'nearest',
					inline: 'nearest',
					behavior: scrollTriggerIntoView === 'instant' ? 'auto' : scrollTriggerIntoView,
				})
			}
		}, 150)

		return () => clearTimeout(id)
	}, [state.index, state.phase])

	useLayoutEffect(() => {
		if (state.phase === 'closed') {
			hideTrigger(null)
		}
	}, [state.phase])

	const onOpenChangeRef = useRef(onOpenChange)
	onOpenChangeRef.current = onOpenChange
	const onIndexChangeRef = useRef(onIndexChange)
	onIndexChangeRef.current = onIndexChange

	const runEffects = useEffectEvent((effects: RootEffect[]) => {
		for (const effect of effects) {
			switch (effect.kind) {
				case 'animateIn': {
					const index = live.current.index
					const image = images.get(index)
					if (!image) {
						break
					}

					image.animateIn(openTrigger.current ?? pickTrigger(index, false))
					break
				}
				case 'animateOut': {
					const index = live.current.index
					viewport.current?.freeze(index)
					const trigger = pickTrigger(index, scrollTriggerIntoView === false ? false : 'instant')
					if (trigger && scrollTriggerIntoView) {
						trigger.scrollIntoView?.({ block: 'nearest', inline: 'nearest', behavior: 'auto' })
					}

					const image = images.get(index)
					const velocity = closeVelocity.current
					closeVelocity.current = undefined
					const animation = image
						? image.animateOut(trigger, velocity)
						: presence
								.animate(0, reducedMotion ? REDUCED : (transition ?? CLOSE))
								.finished.then(() => {})

					// An invisible layer that never unmounts would block the page; never wait forever.
					void Promise.race([animation, new Promise((r) => setTimeout(r, 1500))]).then(() => {
						dispatch({ kind: 'closed' })
						// The modal focus isolation restores focus on unmount; run
						// ours after it settles so the explicit target wins.
						setTimeout(() => {
							const focus =
								(finalFocusRef?.current as HTMLElement | null) ?? pickTrigger(index, false)

							focus?.focus?.({ preventScroll: true })
						}, 0)
					})

					break
				}
				case 'slideTo': {
					viewport.current?.goTo(effect.index, effect.instant ? 'auto' : 'smooth')
					break
				}
				case 'fade': {
					void viewport.current?.fade(effect.from, effect.to).then(() => {
						dispatch({ kind: 'fadeDone', from: effect.from })
					})

					break
				}
				case 'notifyOpen': {
					onOpenChangeRef.current?.(effect.open)
					break
				}
				case 'notifyIndex': {
					onIndexChangeRef.current?.(effect.index)
					break
				}
			}
		}
	})

	const dispatch = useEffectEvent((action: RootAction) => {
		const next = reduce(live.current, action)
		live.current = next.state
		setState(next.state)
		runEffects(next.effects)
	})

	const ctx: LightboxCtx = useMemo(
		() => ({
			dialogText,
			items: items ?? [],
			index: state.index,
			phase: state.phase,
			zoomed: state.zoomed,
			dragging: state.dragging,
			uiHidden: state.uiHidden,
			reducedMotion,
			presence,
			progress,
			held: state.held,
			options: {
				maxZoom,
				wheelToZoom,
				closeOnBackdropClick: hasBackdropDismiss,
				scrollTriggerIntoView,
				open: reducedMotion ? REDUCED : (transition ?? OPEN),
				close: reducedMotion ? REDUCED : (transition ?? CLOSE),
				finalFocusRef,
			},
			triggers,
			images,
			viewport,
			openTrigger,
			openAt: (i, trigger) => {
				openTrigger.current = null
				openTrigger.current = trigger ?? pickTrigger(i, false)
				progress.set(clamp(i, 0, (items ?? []).length - 1))
				dispatch({ kind: 'open', index: i, count: (items ?? []).length })
			},
			close: (velocity) => {
				closeVelocity.current = velocity
				dispatch({ kind: 'requestClose' })
			},
			goTo: (i) =>
				dispatch({
					kind: 'goTo',
					index: i,
					count: (items ?? []).length,
					reducedMotion,
				}),
			pickTrigger,
			hideTrigger,
			onScrollIndex: (i) => dispatch({ kind: 'scrolled', index: i }),
			onOpened: () => dispatch({ kind: 'opened' }),
			setZoomed: (v) => dispatch({ kind: 'zoomed', value: v }),
			setDragging: (v) => dispatch({ kind: 'dragging', value: v }),
			toggleUi: () => dispatch({ kind: 'toggleUi' }),
		}),
		[
			state,
			dialogText,
			reducedMotion,
			items,
			maxZoom,
			wheelToZoom,
			hasBackdropDismiss,
			scrollTriggerIntoView,
			transition,
		],
	)

	// Controlled/uncontrolled open + index.
	const controlledOpen = props.isOpen ?? props.defaultOpen
	const firstControlled = useRef(false)
	useEffect(() => {
		if (controlledOpen === undefined) {
			// Uncontrolled triggers still allowed — but if a Trigger or openAt ran,
			// the reducer already reflects it; do nothing.
			return
		}

		if (!firstControlled.current) {
			firstControlled.current = true

			// Honour a controlled open at mount only when the layer isn't open.
			if (controlledOpen && live.current.phase === 'closed') {
				dispatch({
					kind: 'open',
					index: props.index ?? props.defaultIndex ?? 0,
					count: items?.length ?? 0,
				})
			}

			return
		}

		if (controlledOpen && live.current.phase === 'closed') {
			dispatch({
				kind: 'open',
				index: props.index ?? live.current.index,
				count: items?.length ?? 0,
			})
		} else if (
			!controlledOpen &&
			live.current.phase !== 'closed' &&
			live.current.phase !== 'closing'
		) {
			dispatch({ kind: 'requestClose' })
		}
	}, [controlledOpen])

	// Controlled index: navigate when it changes.
	const indexProp = props.index ?? props.defaultIndex
	const prevIndexProp = useRef(indexProp)
	useEffect(() => {
		if (indexProp === undefined || indexProp === prevIndexProp.current) {
			return
		}

		prevIndexProp.current = indexProp
		if (indexProp !== live.current.index) {
			dispatch({ kind: 'goTo', index: indexProp, count: items?.length ?? 0, reducedMotion })
		}
	}, [indexProp])

	useEffect(() => {
		if (props.index == null && indexProp !== undefined) {
			// defaultIndex: seed once.
			if (live.current.index === 0 && indexProp !== 0) {
				dispatch({ kind: 'goTo', index: indexProp, count: items?.length ?? 0, reducedMotion: true })
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	// Children mount unconditionally so page-side parts (Trigger) exist while
	// the viewer is closed — the modal layer parts gate themselves on phase.
	return <LightboxContext value={ctx}>{children ?? null}</LightboxContext>
}

// ---------- parts ----------

export function Trigger(props: LightboxTriggerPartProps): JSX.Element {
	const ctx = useLightboxCtx()
	const ref = useRef<HTMLElement | null>(null)
	useLayoutEffect(() => {
		const el = ref.current
		if (!el) {
			return
		}

		let set = ctx.triggers.get(props.index)
		if (!set) {
			set = new Set()
			ctx.triggers.set(props.index, set)
		}

		set.add(el)
		return () => void set.delete(el)
	}, [ctx.triggers, props.index])

	const active = ctx.phase !== 'closed' && ctx.index === props.index
	return (
		<button
			ref={ref as never}
			type="button"
			aria-haspopup="dialog"
			className={cx(
				'vx-lightbox-trigger',
				active && 'vx-lightbox-trigger--active',
				props.className,
			)}
			style={props.style as never}
			data-testid={props.testID}
			data-lightbox-trigger={active ? '' : undefined}
			onClick={(e: MouseEvent) => {
				props.onPress?.(e)
				if (!e.defaultPrevented) {
					ctx.openAt(props.index, e.currentTarget as HTMLElement)
				}
			}}
		>
			{props.children as never}
		</button>
	)
}

export function Backdrop(props: LightboxPartProps): JSX.Element | null {
	const ctx = useLightboxCtx()
	const ref = useRef<HTMLDivElement | null>(null)
	if (ctx.phase === 'closed') {
		return null
	}

	useLayoutEffect(() => {
		const el = ref.current
		if (!el) {
			return
		}

		const apply = (v: number) => {
			el.style.setProperty('--lightbox-presence', String(v))
			el.style.opacity = String(v)
		}

		apply(ctx.presence.get())
		return ctx.presence.on('change', apply)
	}, [ctx.presence])

	// Inline layer inside the popup's stacking context — one modal host.
	return (
		<div
			ref={ref}
			className={cx('vx-lightbox-backdrop', props.className)}
			style={mergeStyle({ position: 'fixed', inset: 0 }, props.style)}
			data-testid={props.testID}
		>
			{props.children as never}
		</div>
	) as never
}

const isEditable = (t: EventTarget | null) =>
	t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))

export function Popup(props: LightboxPartProps): JSX.Element | null {
	const ctx = useLightboxCtx()
	const ref = useRef<HTMLDivElement | null>(null)
	useLayoutEffect(() => {
		const el = ref.current
		if (!el) {
			return
		}

		const apply = (v: number) => el.style.setProperty('--lightbox-presence', String(v))
		apply(ctx.presence.get())
		return ctx.presence.on('change', apply)
	}, [ctx.presence])

	// Custom slides (no <Image>) still need an open transition.
	useLayoutEffect(() => {
		if (ctx.phase !== 'opening' || ctx.images.has(ctx.index)) {
			return
		}

		ctx.presence.set(0)
		ctx.presence.animate(1, ctx.options.open).finished.then((r) => {
			if (r === 'finished') {
				ctx.onOpened()
			}
		})
	}, [ctx.phase])

	// A slide that scrolls away goes inert; don't let focus fall out of the dialog.
	useEffect(() => {
		const el = ref.current
		const active = document.activeElement
		if (
			el &&
			(!active ||
				active === document.body ||
				active.closest('[data-lightbox-slide]:not([data-current])'))
		) {
			el.focus({ preventScroll: true })
		}
	}, [ctx.index])

	const onKeyDown = (e: KeyboardEvent) => {
		if (e.defaultPrevented || isEditable(e.target)) {
			return
		}

		const image = ctx.images.get(ctx.index)
		if (e.key === 'ArrowRight') {
			ctx.goTo(ctx.index + 1)
		} else if (e.key === 'ArrowLeft') {
			ctx.goTo(ctx.index - 1)
		} else if (e.key === '+' || e.key === '=') {
			image?.zoomBy(1.6)
		} else if (e.key === '-') {
			image?.zoomBy(1 / 1.6)
		} else if (e.key === '0') {
			image?.resetZoom()
		} else {
			return
		}

		e.preventDefault()
	}

	const mods = `vx-lightbox-popup--${ctx.phase}`
	if (ctx.phase === 'closed') {
		return null
	}

	return (
		<Overlay
			open
			isModal
			accessibilityLabelledBy={ctx.dialogText.labelledBy}
			accessibilityDescribedBy={ctx.dialogText.describedBy}
			accessibilityLabel={ctx.dialogText.label ?? ctx.items[ctx.index]?.alt ?? 'Media viewer'}
			onDismiss={() => ctx.close()}
		>
			<div
				ref={ref}
				tabIndex={-1}
				className={cx(
					'vx-lightbox-popup',
					mods,
					ctx.zoomed && 'vx-lightbox-popup--zoomed',
					ctx.dragging && 'vx-lightbox-popup--dragging',
					ctx.uiHidden && 'vx-lightbox-popup--ui-hidden',
					props.className,
				)}
				style={mergeStyle({ position: 'fixed', inset: 0 }, props.style)}
				data-testid={props.testID}
				data-phase={ctx.phase}
				data-zoomed={ctx.zoomed ? '' : undefined}
				data-dragging={ctx.dragging ? '' : undefined}
				data-ui-hidden={ctx.uiHidden ? '' : undefined}
				onKeyDown={onKeyDown as never}
			>
				{props.children as never}
			</div>
		</Overlay>
	)
}

export function Viewport(props: LightboxPartProps): JSX.Element {
	const ctx = useLightboxCtx()
	const ref = useRef<HTMLDivElement | null>(null)
	const count = ctx.items.length
	const { viewport } = ctx
	// Publishing a fractional scroll can change the current index. Keep the
	// listener stable so that update does not remount and re-snap the scroller.
	const onScrollIndex = useRef(ctx.onScrollIndex)
	onScrollIndex.current = ctx.onScrollIndex
	const { progress, reducedMotion } = ctx
	const fadeP = useMotionValue(0)
	const trackP = useMotionValue(0)

	useLayoutEffect(() => {
		const el = ref.current
		if (!el) {
			return
		}

		// Held while a crossfade has moved a slide out of place: measuring then would include its transform.
		let fixedStride: number | null = null
		let dragStart: number | null = null
		let originalSnap: string | null = null
		let snapping: { stop(): void } | null = null
		const restoreSnap = () => {
			if (originalSnap !== null) {
				el.style.scrollSnapType = originalSnap
			}

			originalSnap = null
		}

		const stopTrack = () => {
			dragStart = null
			snapping?.stop()
			snapping = null
			restoreSnap()
		}

		const stride = () => {
			if (fixedStride !== null) {
				return fixedStride
			}

			const [a, b] = el.children as unknown as HTMLElement[]
			return a && b
				? b.getBoundingClientRect().left - a.getBoundingClientRect().left
				: el.clientWidth
		}

		const to = (i: number, behavior: 'auto' | 'instant' | 'smooth') => {
			stopTrack()
			const left = clamp(i, 0, count - 1) * stride()
			if (typeof el.scrollTo === 'function') {
				el.scrollTo({ left, behavior })
			} else {
				el.scrollLeft = left
			}
		}

		let fading: { finish(): void } | null = null
		viewport.current = {
			goTo: to,
			track(phase, dx, vx) {
				if (phase === 'start') {
					stopTrack()
					dragStart = el.scrollLeft
					originalSnap = el.style.scrollSnapType
					el.style.scrollSnapType = 'none'
					el.scrollTo?.({ left: dragStart, behavior: 'instant' })
				} else if (dragStart !== null) {
					el.scrollLeft = dragStart - dx
					if (phase === 'move') {
						return
					}

					dragStart = null
					const width = stride()
					const index = clamp(Math.round((el.scrollLeft - 0.2 * vx) / width), 0, count - 1)
					const target = index * width
					trackP.jump(el.scrollLeft)
					const off = trackP.on('change', (left: number) => {
						el.scrollLeft = left
					})

					const animation = trackP.animate(
						target,
						reducedMotion ? REDUCED : { ...SETTLE, velocity: -vx },
					)

					const playback = {
						stop() {
							off()
							animation.stop()
						},
					}

					snapping = playback
					void animation.finished.then((result) => {
						off()
						if (snapping !== playback) {
							return
						}

						snapping = null
						restoreSnap()
						if (result !== 'finished') {
							return
						}

						el.scrollLeft = target
						progress.set(index)
						onScrollIndex.current(index)
					})
				}
			},
			// Not 'instant': Chromium lets an in-flight smooth scroll override an instant one on the next
			// frame; a smooth scroll to the current slide replaces it cleanly.
			freeze: (i) => to(i, reducedMotion ? 'auto' : 'smooth'),
			fade: (from, target) =>
				new Promise((resolve) => {
					fading?.finish()
					const slides = el.querySelectorAll<HTMLElement>(':scope > [data-lightbox-slide]')
					const [a, b] = [slides[from], slides[target]]
					to(target, 'auto')
					if (!a || !b) {
						return resolve()
					}

					fixedStride = stride()
					const restore = [a, b].map((slide) => {
						const { transform, zIndex, opacity, scrollSnapAlign } = slide.style
						return () => Object.assign(slide.style, { transform, zIndex, opacity, scrollSnapAlign })
					})

					Object.assign(a.style, {
						transform: `translateX(${(target - from) * stride()}px)`,
						zIndex: '1',
						scrollSnapAlign: 'none',
					})

					b.style.opacity = '0'
					fadeP.jump(0)
					const offP = fadeP.on('change', (v: number) => {
						a.style.opacity = String(1 - v)
						b.style.opacity = String(v)
					})

					const p = fadeP.animate(1, FADE)
					const pAnim = progress.animate(target, FADE)
					const anims = [p, pAnim]
					const finish = () => {
						if (fading !== handle) {
							return
						}

						fading = null
						offP()
						for (const anim of anims) {
							anim.stop()
						}

						for (const undo of restore) {
							undo()
						}

						fixedStride = null
						progress.set(el.scrollLeft / stride())
						resolve()
					}

					const handle = { finish }
					fading = handle
					void anims[0]!.finished.then(finish)
				}),
		}

		// Land on the requested slide: openAt(index>0) must not leave the
		// current slide clipped offscreen on mount.
		to(ctx.index, 'auto')
		const onScroll = () => {
			const p = el.scrollLeft / stride()
			if (!fading) {
				progress.set(p)
			}

			// Keep the originating slide active until its mouse gesture settles.
			if (dragStart === null && !snapping) {
				onScrollIndex.current(clamp(Math.round(p), 0, count - 1))
			}
		}

		el.addEventListener('scroll', onScroll, { passive: true })
		return () => {
			fading?.finish()
			el.removeEventListener('scroll', onScroll)
			stopTrack()
			viewport.current = null
		}
	}, [viewport, onScrollIndex, count, progress, reducedMotion, trackP])

	return (
		<div
			ref={ref}
			aria-roledescription="carousel"
			className={cx(
				'vx-lightbox-viewport',
				ctx.zoomed && 'vx-lightbox-viewport--zoomed',
				props.className,
			)}
			style={mergeStyle(
				{
					display: 'flex',
					position: 'relative',
					height: '100%',
					overflowX: ctx.zoomed ? 'hidden' : 'auto',
					overflowY: 'hidden',
					scrollSnapType: 'x mandatory',
					overscrollBehavior: 'contain',
				},
				props.style,
			)}
			data-testid={props.testID}
		>
			{
				(props.children ??
					ctx.items.map((item, i) => (
						<Slide key={item.src + i} index={i}>
							<Image />
						</Slide>
					))) as never
			}
		</div>
	)
}

export function Slide(props: LightboxSlidePartProps): JSX.Element {
	const ctx = useLightboxCtx()
	const current = props.index === ctx.index
	// Renders index±2 only; a large gallery would want real virtualisation too.
	const near = Math.abs(props.index - ctx.index) <= 2 || props.index === ctx.held
	const slide = useMemo(
		() => ({ index: props.index, onTap: props.onTap }),
		[props.index, props.onTap],
	)

	return (
		<SlideContext value={slide}>
			<div
				data-lightbox-slide=""
				role="group"
				aria-roledescription="slide"
				aria-label={`${props.index + 1} of ${ctx.items.length}`}
				aria-hidden={current ? undefined : true}
				inert={!current}
				className={cx(
					'vx-lightbox-slide',
					current && 'vx-lightbox-slide--current',
					props.className,
				)}
				style={mergeStyle(
					{
						flex: '0 0 100%',
						position: 'relative',
						overflow: 'clip',
						scrollSnapAlign: 'center',
						scrollSnapStop: 'always',
					},
					props.style,
				)}
				data-testid={props.testID}
				{...(current ? { 'data-current': '' } : {})}
			>
				{(near ? props.children : null) as never}
			</div>
		</SlideContext>
	)
}

export function Close(
	props: LightboxPartProps & { onClick?: (e: MouseEvent) => void },
): JSX.Element {
	const ctx = useLightboxCtx()
	return (
		<button
			type="button"
			aria-label="Close"
			className={cx('vx-lightbox-close', props.className)}
			style={props.style as never}
			data-testid={props.testID}
			onClick={(e: MouseEvent) => {
				props.onClick?.(e)
				if (!e.defaultPrevented) {
					ctx.close()
				}
			}}
		>
			{(props.children ?? 'Close') as never}
		</button>
	)
}

function NavButton(props: LightboxPartProps & { step: 1 | -1 }) {
	const ctx = useLightboxCtx()
	const target = ctx.index + props.step
	const disabled = target < 0 || target >= ctx.items.length
	return (
		<button
			type="button"
			disabled={disabled}
			aria-label={props.step < 0 ? 'Previous image' : 'Next image'}
			className={cx('vx-lightbox-nav', disabled && 'vx-lightbox-nav--disabled', props.className)}
			style={props.style as never}
			data-testid={props.testID}
			onClick={() => ctx.goTo(target)}
		>
			{(props.children ?? (props.step < 0 ? '‹' : '›')) as never}
		</button>
	)
}

export function Prev(props: LightboxPartProps): JSX.Element {
	return <NavButton step={-1} {...props} />
}

export function Next(props: LightboxPartProps): JSX.Element {
	return <NavButton step={1} {...props} />
}

export function Title(props: LightboxPartProps & { id?: string }): JSX.Element {
	const ctx = useLightboxCtx()
	const id = useDialogPart(ctx.dialogText, 'title', props.id, props.children)
	return (
		<h2 id={id} className={cx('vx-lightbox-title', props.className)} style={props.style}>
			{props.children as never}
		</h2>
	)
}

export function Description(props: LightboxPartProps & { id?: string }): JSX.Element {
	const ctx = useLightboxCtx()
	const id = useDialogPart(ctx.dialogText, 'description', props.id, props.children)
	return (
		<p id={id} className={cx('vx-lightbox-description', props.className)} style={props.style}>
			{props.children as never}
		</p>
	)
}

/** Read lightbox state and drive it from your own UI (counters, captions…). */
export function useLightboxState<T extends LightboxMedia = LightboxMedia>(): UseLightboxState<T> {
	const ctx = useLightboxCtx()
	const image = () => ctx.images.get(ctx.index)
	return {
		items: ctx.items as T[],
		item: ctx.items[ctx.index] as T,
		index: ctx.index,
		count: ctx.items.length,
		phase: ctx.phase,
		open: ctx.phase !== 'closed',
		zoomed: ctx.zoomed,
		dragging: ctx.dragging,
		uiHidden: ctx.uiHidden,
		presence: ctx.presence,
		progress: ctx.progress,
		openAt: ctx.openAt,
		close: () => ctx.close(),
		goTo: ctx.goTo,
		next: () => ctx.goTo(ctx.index + 1),
		prev: () => ctx.goTo(ctx.index - 1),
		zoomIn: () => image()?.zoomBy(1.6),
		zoomOut: () => image()?.zoomBy(1 / 1.6),
		resetZoom: () => image()?.resetZoom(),
	}
}
