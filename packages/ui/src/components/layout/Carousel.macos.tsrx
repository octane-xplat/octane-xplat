/** @jsxImportSource @octane-xplat/jsx */
import './Carousel.macos.css'
import { useCallback, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from 'octane'
import type { CarouselProps } from '../../props'
import { toChildArray, mapChildren } from '../../internal/rendering/child-array'
import { spacingStep } from './spacing'
import { cx } from '@octane-xplat/lib'
import { useDirection } from '../../internal/platform/internationalization'
import { createAppKitCarouselScroll } from './carousel-scroll.macos'
import { createAppKitCarouselSnap } from './carousel-snap.macos'
import { readReducedMotion } from '../../internal/platform/animation-host.macos'
import { Icon } from '../media/Icon.macos.tsrx'
import { Pressable } from '../actions/Pressable.macos.tsrx'

/** Native geometry controls/handle and user-scroll snapping. Edge fades remain a gap. */
export function Carousel(props: CarouselProps) @{
	const items = toChildArray(props.children), count = items.length, direction = useDirection(), rtl = direction === 'rtl'
	const gap = spacingStep(props.gap ?? 2) ?? 8, viewport = useRef<NSScrollView | null>(null)
	const slides = useRef(new Map<number, NSView>()), live = useRef({ count, loop: props.hasLoop === true, snap: props.hasSnap === true, direction })
	live.current = { count, loop: props.hasLoop === true, snap: props.hasSnap === true, direction }
	const beforeMove = useRef<() => void>(() => {})
	const control = useMemo(() => createAppKitCarouselScroll({ view: () => viewport.current,
		slides: () => Array.from({ length: live.current.count }, (_, i) => slides.current.get(i) ?? null),
		count: () => live.current.count, loop: () => live.current.loop, direction: () => live.current.direction,
		reducedMotion: readReducedMotion, beforeMove: () => beforeMove.current(),
	}), [])
	const snap = useMemo(() => createAppKitCarouselSnap({ view: () => viewport.current, enabled: () => live.current.snap,
		interaction: control.interacted, snap: control.snap,
	}), [])
	beforeMove.current = snap.invalidate
	useImperativeHandle(props.ref, () => control.handle, [])
	const [measured, setMeasured] = useState({ width: 0, canPrev: false, canNext: false })
	const previous = useRef(measured), queued = useRef(false), measuring = useRef(false), owner = useRef<NSWindow | null>(null)
	const measure = () => {
		if (!viewport.current || measuring.current) return
		measuring.current = true
		try {
			const view = viewport.current
			snap.validate()
			if (view.window) owner.current = view.window
			const width = control.width()
			if (width > 0 && width !== previous.current.width) snap.invalidate()
			const proportionalReady = width > 0 && slides.current.size === count &&
				Number(view.documentView?.frame.size.width) >= count * width + Math.max(0, count - 1) * gap - 1 &&
				[...slides.current.values()].every((slide) => Math.abs(Number(slide.bounds.size.width) - width) <= 1)
			if (props.variant !== 'proportional' || proportionalReady) control.initialize()
			const next = { width: width || previous.current.width, ...control.state() }
			if (viewport.current === view && (next.width !== previous.current.width || next.canPrev !== previous.current.canPrev || next.canNext !== previous.current.canNext)) {
				previous.current = next; setMeasured(next)
			}
		} catch (error) { console.warn('[macos-carousel] measurement failed', error) }
		finally { measuring.current = false }
	}
	const latestMeasure = useRef(measure); latestMeasure.current = measure
	const queueMeasure = () => {
		if (queued.current) return
		queued.current = true
		void Promise.resolve().then(() => { queued.current = false; if (viewport.current) latestMeasure.current() })
	}
	const bind = useCallback((view: NSScrollView | null) => {
		if (viewport.current !== view) control.reset()
		viewport.current = view; snap.bind(view)
		if (!view) owner.current = null
		else queueMeasure()
	}, [])
	const register = useCallback((index: number, view: NSView) => {
		slides.current.set(index, view); snap.invalidate(); queueMeasure()
		return () => { if (slides.current.get(index) === view) { slides.current.delete(index); snap.invalidate() } queueMeasure() }
	}, [])
	useLayoutEffect(queueMeasure)
	useLayoutEffect(() => snap.invalidate(), [props.hasSnap, count, direction, props.variant, gap])
	useEffect(() => { snap.bind(viewport.current); return () => snap.dispose() }, [])
	useEffect(() => {
		const native = globalThis as Record<string, any>, center = native.NSNotificationCenter?.defaultCenter
		if (!center?.addObserverForNameObjectQueueUsingBlock || !center?.removeObserver) return
		let token: unknown
		try {
			token = center.addObserverForNameObjectQueueUsingBlock(native.NSWindowDidUpdateNotification ?? 'NSWindowDidUpdateNotification', null, null,
				(note: { object: NSWindow }) => { if (note.object === viewport.current?.window || note.object === owner.current) latestMeasure.current() })
		} catch (error) { console.warn('[macos-carousel] geometry observation unavailable', error); return }
		return () => { if (token != null) center.removeObserver(token) }
	}, [])
	useEffect(() => () => { viewport.current = null; owner.current = null; snap.dispose(); slides.current.clear(); control.reset() }, [])
	const width = props.variant === 'proportional' && measured.width > 0 ? measured.width : undefined

	<masonview id={props.id} className={cx('vx-carousel', 'vx-carousel--appkit', props.className)} style={props.style}
		accessible={props.accessible} accessibilityRole={props.accessibilityRole ?? 'group'}
		accessibilityLabel={props.accessibilityLabel ?? props.label} accessibilityHint={props.accessibilityHint}
		accessibilityValue={props.accessibilityValue} accessibilityState={props.accessibilityState}>
		<scrollview ref={bind} orientation="horizontal" className="vx-carousel-viewport vx-carousel-viewport--appkit"
			scrollBarIndicatorVisible={false} onScroll={() => latestMeasure.current()} onLayoutChanged={queueMeasure}>
			<masonview className="vx-carousel-track vx-carousel-track--appkit" onLayoutChanged={queueMeasure}
				style={{ columnGap: gap, flexDirection: rtl ? 'row-reverse' : 'row', minWidth: measured.width || undefined,
					width: width == null ? undefined : Math.max(width, count * width + Math.max(0, count - 1) * gap) }}>
				{mapChildren(items, (child: any, i: number) => <AppKitCarouselSlide index={i} count={count} width={width} register={register}>{child}</AppKitCarouselSlide>)}
			</masonview>
		</scrollview>
		{props.hasButtons && <>
			<Pressable className="vx-carousel-btn vx-carousel-prev vx-carousel-btn--appkit" accessibilityLabel="Previous"
				disabled={!measured.canPrev} onPress={control.handle.scrollPrev} style={{ justifySelf: rtl ? 'end' : 'start' }}>
				<Icon name={rtl ? 'xplat-chevron-right' : 'xplat-chevron-left'} />
			</Pressable>
			<Pressable className="vx-carousel-btn vx-carousel-next vx-carousel-btn--appkit" accessibilityLabel="Next"
				disabled={!measured.canNext} onPress={control.handle.scrollNext} style={{ justifySelf: rtl ? 'start' : 'end' }}>
				<Icon name={rtl ? 'xplat-chevron-left' : 'xplat-chevron-right'} />
			</Pressable>
		</>}
	</masonview>
}
function AppKitCarouselSlide(props: { index: number; count: number; width?: number; register(index: number, view: NSView): () => void; children?: unknown }) @{
	const release = useRef<(() => void) | null>(null)
	const bind = useCallback((view: NSView | null) => {
		release.current?.(); release.current = view ? props.register(props.index, view) : null
	}, [props.index, props.register])
	<masonview ref={bind} className={cx('vx-carousel-slide', 'vx-carousel-slide--appkit', props.width != null && 'vx-carousel-slide--prop')}
		accessibilityRole="group" accessibilityLabel={`Slide ${props.index + 1} of ${props.count}`}
		style={{ width: props.width, flexBasis: props.width ?? 'auto' }}>{props.children}</masonview>
}
