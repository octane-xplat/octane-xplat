import { descriptorChildren } from 'octane';
import { useImperativeHandle, useCallback, useEffect, useRef, useState } from 'octane';
import type { CarouselHandle, CarouselProps } from './props';
import { applyEscapeProps } from './escape-props';
import { toChildArray, mapChildren } from './child-array';
import { spacingStep } from './spacing';
import { cx } from './cx';
import { Icon } from './Icon.web.tsrx';
import { Pressable } from './Pressable.web.tsrx';

const EPS = 1;

/** Horizontal slide strip (Astryx `Carousel`), web leaf — a scrollable
 *  labelled region (`aria-roledescription="carousel"`) whose children are
 *  wrapped in slide groups, with optional snap, edge fades, and prev/next
 *  buttons. `ref` hands back the imperative CarouselHandle. */
function CarouselImpl(props: CarouselProps) @{
	const items = toChildArray(props.children);
	const count = items.length;
	const gapPx = spacingStep(props.gap ?? 2) ?? 8;
	const scroller = useRef<HTMLElement | null>(null);
	const track = useRef<HTMLDivElement | null>(null);
	const [canPrev, setCanPrev] = useState(false);
	const [canNext, setCanNext] = useState(false);
	const [atStart, setAtStart] = useState(true);
	const [atEnd, setAtEnd] = useState(false);
	const loop = props.hasLoop === true;

	const measure = useCallback(() => {
		const el = scroller.current;
		if (!el) return;
		const rtl = getComputedStyle(el).direction === 'rtl';
		const x = rtl ? -el.scrollLeft : el.scrollLeft;
		const max = Math.max(0, el.scrollWidth - el.clientWidth);
		const prev = x > EPS;
		const next = x < max - EPS;
		setAtStart(!prev);
		setAtEnd(!next);
		setCanPrev(loop ? count > 1 : prev);
		setCanNext(loop ? count > 1 : next);
	}, [count, loop]);

	const slideOffsets = useCallback((): number[] => {
		const t = track.current;
		if (!t) return [];
		return Array.from(t.children as any).map(
			(c: any) => (c as HTMLElement).offsetLeft - (t as HTMLElement).offsetLeft,
		);
	}, []);

	const reduced = () =>
		typeof matchMedia === 'function' &&
		matchMedia('(prefers-reduced-motion: reduce)').matches;

	const behavior = () => (reduced() ? 'auto' : 'smooth');

	const isRtl = () =>
		scroller.current != null &&
		getComputedStyle(scroller.current).direction === 'rtl';

	const scrollToIndex = useCallback(
		(i: number) => {
			const el = scroller.current;
			const offsets = slideOffsets();
			if (!el || !offsets.length) return;
			const clamped = Math.min(Math.max(i, 0), count - 1);
			const target = offsets[clamped] ?? 0;
			el.scrollTo({ left: isRtl() ? -target : target, behavior: behavior() });
		},
		[count, slideOffsets],
	);

	const scrollNext = useCallback(() => {
		const el = scroller.current;
		if (!el) return;
		const rtl = isRtl();
		const x = rtl ? -el.scrollLeft : el.scrollLeft;
		const max = Math.max(0, el.scrollWidth - el.clientWidth);
		if (x >= max - EPS && loop) {
			// Loop wraps to the start (scrollLeft 0 is the start edge in both
			// directions — RTL scroll offsets run negative toward the end).
			el.scrollTo({ left: 0, behavior: behavior() });
			return;
		}

		el.scrollBy({ left: (rtl ? -1 : 1) * el.clientWidth, behavior: behavior() });
	}, [loop]);

	const scrollPrev = useCallback(() => {
		const el = scroller.current;
		if (!el) return;
		const rtl = isRtl();
		const x = rtl ? -el.scrollLeft : el.scrollLeft;
		const max = Math.max(0, el.scrollWidth - el.clientWidth);
		if (x <= EPS && loop) {
			el.scrollTo({ left: rtl ? -max : max, behavior: behavior() });
			return;
		}

		el.scrollBy({ left: (rtl ? 1 : -1) * el.clientWidth, behavior: behavior() });
	}, [loop]);

	const handle: CarouselHandle = {
		scrollNext,
		scrollPrev,
		scrollTo: scrollToIndex,
		canScrollNext: () => {
			const el = scroller.current;
			if (!el) return false;
			if (loop) return count > 1;
			const rtl = isRtl();
			const x = rtl ? -el.scrollLeft : el.scrollLeft;
			return x < Math.max(0, el.scrollWidth - el.clientWidth) - EPS;
		},
		canScrollPrev: () => {
			const el = scroller.current;
			if (!el) return false;
			if (loop) return count > 1;
			const rtl = isRtl();
			const x = rtl ? -el.scrollLeft : el.scrollLeft;
			return x > EPS;
		},
	};

	useImperativeHandle(props.ref, () => handle, undefined);

	useEffect(() => {
		measure();
		const el = scroller.current;
		if (!el) return;
		el.addEventListener('scroll', measure, { passive: true });
		const ro =
			typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);

		ro?.observe(el);
		if (track.current) ro?.observe(track.current);
		return () => {
			el.removeEventListener('scroll', measure);
			ro?.disconnect();
		};
	}, [count, measure]);

	// Shift+wheel scrolls horizontally (Astryx behavior).
	const onWheel = (event: WheelEvent) => {
		const el = scroller.current;
		if (!el || !event.shiftKey || el.scrollWidth <= el.clientWidth) return;
		event.preventDefault();
		el.scrollLeft += (event.deltaY || event.deltaX) * (isRtl() ? -1 : 1);
	};

	return (
		<div
			className={cx('vx-carousel', props.className)}
			style={props.style}
			id={props.id}
			role="region"
			aria-roledescription="carousel"
			aria-label={props.accessibilityLabel ?? props.label}
			aria-hidden={props.accessible === false ? true : undefined}
			ref={(el: any) => applyEscapeProps(el, props)}
		>
			{props.hasEdgeFade && atStart === false && (
				<div className="vx-carousel-fade vx-carousel-fade-start" aria-hidden="true" />
			)}
			{props.hasEdgeFade && atEnd === false && (
				<div className="vx-carousel-fade vx-carousel-fade-end" aria-hidden="true" />
			)}
			<div
				ref={(el: any) => {
					scroller.current = el;
				}}
				className="vx-carousel-viewport"
				style={{
					overflowX: 'auto',
					overflowY: 'hidden',
					scrollSnapType: props.hasSnap ? 'x mandatory' : undefined,
					scrollbarWidth: 'none',
				}}
				onWheel={onWheel}
			>
				<div
					ref={track}
					className="vx-carousel-track"
					style={{ display: 'flex', gap: `${gapPx}px` }}
				>
					{mapChildren(items, (child: any, i: number) => (
						<div
							className={cx(
								'vx-carousel-slide',
								props.variant === 'proportional' && 'vx-carousel-slide--prop',
							)}
							role="group"
							aria-roledescription="slide"
							aria-label={`Slide ${i + 1} of ${count}`}
							style={{
								scrollSnapAlign: props.hasSnap ? 'start' : undefined,
								flex: props.variant === 'proportional' ? '1 0 100%' : '0 0 auto',
							}}
						>
							{child}
						</div>
					))}
				</div>
			</div>
			{props.hasButtons && (
				<>
					<Pressable
						className="vx-carousel-btn vx-carousel-prev"
						accessibilityLabel="Previous"
						disabled={!canPrev}
						onPress={scrollPrev}
					>
						<Icon name="xplat-chevron-left" />
					</Pressable>
					<Pressable
						className="vx-carousel-btn vx-carousel-next"
						accessibilityLabel="Next"
						disabled={!canNext}
						onPress={scrollNext}
					>
						<Icon name="xplat-chevron-right" />
					</Pressable>
				</>
			)}
		</div>
	);
}

/** Ask Octane to preserve inspectable child descriptors for collection operations. */
export const Carousel = descriptorChildren(CarouselImpl);
