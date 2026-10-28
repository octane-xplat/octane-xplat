/** @jsxImportSource @octane-xplat/jsx */
// Native lightbox host: the same pure state machine as web, wired to a
// NativeScript vocabulary (masonview/image/label) over the ui modal Overlay.
import { createContext, useContext, useEffect, useEffectEvent, useLayoutEffect, useMemo, useRef, useState } from 'octane'
import type { Label } from '@nativescript/core'
import { Overlay, Pressable } from '@octane-xplat/ui'
import { cx } from '@octane-xplat/lib'
import { mergeStyle } from './style-merge'
import { useDialogPart, useDialogText } from './dialog-text'
import { useMotionValue, useReducedMotion } from '@octane-xplat/motion'
import type { MotionValue, Transition } from '@octane-xplat/motion'
import { OPEN, CLOSE, REDUCED } from './constants'
import { clamp } from './math'
import { reduce } from './state'
import type { RootAction, RootEffect, RootState } from './state'
import { viewRect } from './rect'
import { scrollTriggerIntoView } from './scroll-sync'
import { Image, type ImageController } from './Image.tsrx'
import type { Intent } from './gesture-machine'
import { Track } from './track.mobile.tsrx'
import type {
	LightboxMedia,
	LightboxPartProps,
	LightboxRootProps,
	LightboxSlidePartProps,
	LightboxTapEvent,
	LightboxTriggerPartProps,
	UseLightboxState,
} from './props'

export interface ViewportController {
	goTo(index: number, behavior: 'auto' | 'instant' | 'smooth'): void
	freeze(index: number): void
	fade(from: number, to: number): Promise<void>
	/** Machine `track` commands move the track directly. */
	track(phase: 'start' | 'move' | 'end', dx: number, vx: number): void
	/** Slides register their machine input; the track's gesture surface routes
	 *  each gesture sequence to one slide (latched at gesture start). */
	registerInput(index: number, send: (i: Intent) => void): () => void
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
	triggers: Map<number, Set<any>>
	images: Map<number, ImageController>
	viewport: { current: ViewportController | null }
	openTrigger: { current: any }
	openAt(index: number, trigger?: any): void
	close(velocity?: { x: number; y: number }): void
	goTo(index: number): void
	pickTrigger(index: number, scroll: 'auto' | 'instant' | 'smooth' | false): any
	hideTrigger(trigger: any): void
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

export const LightboxContext = createContext<LightboxCtx | null>(null)
/** Internal: lets `useLightbox` share a trigger registry with the Root it
 *  renders, without exposing a `triggers` prop on the public API. */
export const InternalTriggersContext = createContext<Map<number, Set<any>> | null>(null)
export const SlideContext = createContext<SlideCtx | null>(null)

// Native bundlers retarget Octane contexts to the universal renderer. JSX
// supplies the render scope internally; callers only supply provider props.
type NativeProvider<T> = (props: { value: T; children?: unknown }) => unknown
const LightboxProvider = LightboxContext as unknown as NativeProvider<LightboxCtx>
const SlideProvider = SlideContext as unknown as NativeProvider<SlideCtx>
export const InternalTriggersProvider = InternalTriggersContext as unknown as NativeProvider<Map<number, Set<any>>>

export function useLightboxCtx() @{
	const ctx = useContext(LightboxContext)
	if (!ctx) {
		throw new Error('Lightbox parts must be used inside <Lightbox.Root>.')
	}
	return ctx
}

export function useSlideCtx() @{
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

const visibleFraction = (view: any) => {
	const r = viewRect(view)
	if (!r || !r.w || !r.h) return 0
	// Full-screen surface: the visible fraction is just whether the rect is
	// on-screen at all on native (no scroll-snap viewport to clip against).
	return r.x + r.w > 0 && r.y + r.h > 0 && r.x < r.x + r.w + 1e9 ? 1 : 0
}

export function Root(props: LightboxRootProps) @{
	const {
		media: items,
		children,
		maxZoom: requestedMaxZoom = 4,
		hasWheelZoom: wheelToZoom = false,
		hasBackdropDismiss = true,
		triggerScroll: scrollTriggerOption = 'smooth',
		transition,
		onOpenChange,
		onIndexChange,
		finalFocusRef,
	} = props
	const dialogText = useDialogText()
	const maxZoom = props.hasZoom === false ? 1 : requestedMaxZoom
	const [state, setState] = useState(() => ({
		...initialState(),
		index: clamp(props.index ?? props.defaultIndex ?? 0, 0, Math.max(0, items.length - 1)),
	}))
	const live = useRef(state)
	live.current = state
	const mounted = useRef(true)
	useLayoutEffect(() => {
		mounted.current = true
		return () => { mounted.current = false }
	}, [])
	const reducedMotion = useReducedMotion() ?? false
	const presence = useMotionValue(0)
	const progress = useMotionValue(state.index)
	const sharedTriggers = useContext(InternalTriggersContext)
	const [triggers] = useState(() => sharedTriggers ?? new Map<number, Set<any>>())
	const [images] = useState(() => new Map<number, ImageController>())
	const viewport = useRef<ViewportController | null>(null)
	const openTrigger = useRef<any>(null)
	const hidden = useRef<any[]>([])
	const pendingFade = useRef<{ from: number; to: number } | null>(null)
	const closeVelocity = useRef<{ x: number; y: number } | undefined>(undefined)

	const hideTrigger = useEffectEvent((trigger: any) => {
		for (const v of hidden.current) v.visibility = 'visible'
		hidden.current = trigger ? [trigger] : []
		for (const v of hidden.current) v.visibility = 'hidden'
	})

	const pickTrigger = useEffectEvent(
		(i: number, scroll: 'auto' | 'instant' | 'smooth' | false): any => {
			const list = [...(triggers.get(i) ?? [])].filter((v) => v?.parent)
			const el = list.includes(openTrigger.current) ? openTrigger.current : (list[0] ?? null)
			if (el && scroll) scrollTriggerIntoView(el)
			return el
		},
	)

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
					if (!image) break
					image.animateIn(openTrigger.current ?? pickTrigger(index, false))
					break
				}
				case 'animateOut': {
					const index = live.current.index
					viewport.current?.freeze(index)
					const trigger = pickTrigger(index, scrollTriggerOption === false ? false : 'instant')
					const image = images.get(index)
					const velocity = closeVelocity.current
					closeVelocity.current = undefined
					const animation = image
						? image.animateOut(trigger, velocity)
						: presence.animate(0, reducedMotion ? REDUCED : (transition ?? CLOSE)).finished.then(() => {})
					void Promise.race([animation, new Promise((r) => setTimeout(r, 1500))]).then(() => {
						if (mounted.current) dispatch({ kind: 'closed' })
					})
					break
				}
				case 'slideTo': {
					viewport.current?.goTo(effect.index, effect.instant ? 'auto' : 'smooth')
					break
				}
				case 'fade': {
					pendingFade.current = { from: effect.from, to: effect.to }
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
				scrollTriggerIntoView: scrollTriggerOption,
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
				dispatch({ kind: 'goTo', index: i, count: (items ?? []).length, reducedMotion }),
			pickTrigger,
			hideTrigger,
			onScrollIndex: (i) => dispatch({ kind: 'scrolled', index: i }),
			onOpened: () => dispatch({ kind: 'opened' }),
			setZoomed: (v) => dispatch({ kind: 'zoomed', value: v }),
			setDragging: (v) => dispatch({ kind: 'dragging', value: v }),
			toggleUi: () => dispatch({ kind: 'toggleUi' }),
		}),
		[state, dialogText, reducedMotion, items, maxZoom, wheelToZoom, hasBackdropDismiss, scrollTriggerOption, transition],
	)

	const controlledOpen = props.isOpen ?? props.defaultOpen
	const firstControlled = useRef(false)
	useEffect(() => {
		if (controlledOpen === undefined) return
		if (!firstControlled.current) {
			firstControlled.current = true
			if (controlledOpen && live.current.phase === 'closed') {
				dispatch({ kind: 'open', index: props.index ?? props.defaultIndex ?? 0, count: items?.length ?? 0 })
			}
			return
		}
		if (controlledOpen && live.current.phase === 'closed') {
			dispatch({ kind: 'open', index: props.index ?? live.current.index, count: items?.length ?? 0 })
		} else if (!controlledOpen && live.current.phase !== 'closed' && live.current.phase !== 'closing') {
			dispatch({ kind: 'requestClose' })
		}
	}, [controlledOpen])

	const indexProp = props.index ?? props.defaultIndex
	const prevIndexProp = useRef(indexProp)
	useEffect(() => {
		if (indexProp === undefined || indexProp === prevIndexProp.current) return
		prevIndexProp.current = indexProp
		if (indexProp !== live.current.index) {
			dispatch({ kind: 'goTo', index: indexProp, count: items?.length ?? 0, reducedMotion })
		}
	}, [indexProp])

	useLayoutEffect(() => {
		const jump = pendingFade.current
		if (!jump || state.phase !== 'open' || jump.to !== state.index) return
		pendingFade.current = null
		// The target may have been outside the render window. Begin only once
		// its content and the held source have committed.
		const timer = setTimeout(() => {
			void viewport.current?.fade(jump.from, jump.to).then(() => {
				if (mounted.current) dispatch({ kind: 'fadeDone', from: jump.from })
			})
		}, 0)
		return () => clearTimeout(timer)
	}, [state.index, state.held, state.phase])

	// Hide the current thumbnail while the viewer is open.
	useEffect(() => {
		if (state.phase !== 'open') return
		hideTrigger(pickTrigger(state.index, false))
		if (scrollTriggerOption) scrollTriggerIntoView(pickTrigger(state.index, false))
	}, [state.index, state.phase])
	useLayoutEffect(() => {
		if (state.phase === 'closed') hideTrigger(null)
	}, [state.phase])

	return <LightboxProvider value={ctx}>{children ?? null}</LightboxProvider>
}

// ---------- parts ----------

export function Trigger(props: LightboxTriggerPartProps) @{
	const ctx = useLightboxCtx()
	const ref = useRef<any>(null)
	useLayoutEffect(() => {
		const v = ref.current
		if (!v) return
		let set = ctx.triggers.get(props.index)
		if (!set) {
			set = new Set()
			ctx.triggers.set(props.index, set)
		}
		set.add(v)
		return () => void set.delete(v)
	}, [ctx.triggers, props.index])
	const active = ctx.phase !== 'closed' && ctx.index === props.index
	return (
		<Pressable
			ref={ref as never}
			className={cx('vx-lightbox-trigger', active && 'vx-lightbox-trigger--active', props.className)}
			style={props.style as never}
			id={props.id}
			testID={props.testID}
			onPress={() => {
				props.onPress?.(undefined)
				ctx.openAt(props.index, ref.current)
			}}
		>
			{props.children as never}
		</Pressable>
	)
}

export function Backdrop(props: LightboxPartProps) @{
	const ctx = useLightboxCtx()
	const ref = useRef<any>(null)
	useLayoutEffect(() => {
		const v = ref.current
		if (!v) return
		const off = ctx.presence.on('change', (p: number) => { v.opacity = p })
		v.opacity = ctx.presence.get()
		return off
	}, [ctx.presence])
	if (ctx.phase === 'closed') return null
	// Inline layer inside the popup's stack — one modal host per viewer.
	return (
		<masonview
			ref={ref as never}
			className={cx('vx-lightbox-backdrop', props.className)}
			style={mergeStyle({ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.9)' }, props.style)}
			id={props.id}
			testID={props.testID}
			onTap={() => {
				if (ctx.options.closeOnBackdropClick) ctx.close()
			}}
		>
			{props.children as never}
		</masonview>
	)
}

export function Popup(props: LightboxPartProps) @{
	const ctx = useLightboxCtx()
	useEffect(() => {
		if (ctx.phase !== 'opening') return
		let active = true
		let stop = () => {}
		// Child Image controllers register in layout effects. Check after that
		// commit so delayed image layout is not mistaken for custom content.
		const timer = setTimeout(() => {
			if (!active || ctx.images.has(ctx.index)) return
			ctx.presence.set(0)
			const animation = ctx.presence.animate(1, ctx.options.open)
			stop = () => animation.stop()
			void animation.finished.then(result => {
				if (active && result === 'finished') ctx.onOpened()
			})
		}, 0)
		return () => { active = false; clearTimeout(timer); stop() }
	}, [ctx.phase, ctx.index])
	if (ctx.phase === 'closed') return null
	return (
		<Overlay
			open
			isModal
			accessibilityLabel={ctx.dialogText.label ?? ctx.items[ctx.index]?.alt ?? 'Media viewer'}
			onDismiss={() => ctx.close()}
		>
			<masonview
				className={cx('vx-lightbox-popup', `vx-lightbox-popup--${ctx.phase}`, ctx.zoomed && 'vx-lightbox-popup--zoomed', ctx.dragging && 'vx-lightbox-popup--dragging', ctx.uiHidden && 'vx-lightbox-popup--ui-hidden', props.className)}
				style={mergeStyle({ width: '100%', height: '100%', alignSelf: 'stretch' }, props.style)}
				id={props.id}
				testID={props.testID}
			>
				{props.children as never}
			</masonview>
		</Overlay>
	)
}

export function Viewport(props: LightboxPartProps) @{
	const ctx = useLightboxCtx()
	return (
		<Track
			className={cx('vx-lightbox-viewport', props.className)}
			style={props.style}
			id={props.id}
			testID={props.testID}
			items={ctx.items}
			currentIndex={ctx.index}
			controllerRef={ctx.viewport}
			maxZoom={ctx.options.maxZoom}
			onScrollIndex={(i) => ctx.onScrollIndex(i)}
			progress={ctx.progress}
			zoomed={ctx.zoomed}
		>
			{props.children ?? ctx.items.map((_, i) => (
				<Slide index={i} key={i}><Image /></Slide>
			))}
		</Track>
	)
}

export function Slide(props: LightboxSlidePartProps) @{
	const ctx = useLightboxCtx()
	const index = props.index
	const near = Math.abs(ctx.index - index) <= 2 || index === ctx.held
	const current = ctx.index === index
	return (
		<SlideProvider value={{ index, onTap: props.onTap }}>
			<masonview
				className={cx('vx-lightbox-slide', current && 'vx-lightbox-slide--current', props.className)}
				style={props.style as never}
				id={props.id}
			testID={props.testID}
			>
				{near ? (props.children as never) ?? null : null}
			</masonview>
		</SlideProvider>
	)
}

export function Close(props: LightboxPartProps & { onPress?: () => void }) {
	const ctx = useLightboxCtx()
	return (
		<Pressable
			className={cx('vx-lightbox-close', props.className)}
			style={props.style as never}
			id={props.id}
			testID={props.testID}
			onPress={() => {
				props.onPress?.()
				ctx.close()
			}}
		>
			{props.children as never}
		</Pressable>
	)
}

function NavButton(props: LightboxPartProps & { step: 1 | -1 }) @{
	const ctx = useLightboxCtx()
	const target = ctx.index + props.step
	const disabled = target < 0 || target >= ctx.items.length
	return (
		<Pressable
			disabled={disabled}
			className={cx('vx-lightbox-nav', disabled && 'vx-lightbox-nav--disabled', props.className)}
			style={props.style as never}
			id={props.id}
			testID={props.testID}
			onPress={() => ctx.goTo(target)}
		>
			{props.children as never}
		</Pressable>
	)
}
export function Prev(props: LightboxPartProps) @{
	return <NavButton step={-1} {...props} />
}
export function Next(props: LightboxPartProps) @{
	return <NavButton step={1} {...props} />
}
export function Title(props: LightboxPartProps) @{
	const ctx = useLightboxCtx()
	const ref = useRef<Label | null>(null)
	const id = useDialogPart(ctx.dialogText, 'title', props.id, props.children, ref)
	return <label ref={ref} className={cx('vx-lightbox-title', props.className)} style={props.style as never} id={id}
			testID={props.testID}>{props.children as never}</label>
}
export function Description(props: LightboxPartProps) @{
	const ctx = useLightboxCtx()
	const ref = useRef<Label | null>(null)
	const id = useDialogPart(ctx.dialogText, 'description', props.id, props.children, ref)
	return <label ref={ref} className={cx('vx-lightbox-description', props.className)} style={props.style as never} id={id}
			testID={props.testID}>{props.children as never}</label>
}

// ---------- state hook ----------

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
