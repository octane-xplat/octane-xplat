/** @jsxImportSource @nativescript-community/octane */
import { useImperativeHandle, useCallback, useEffect, useRef, useState } from 'octane';
import type { CarouselHandle, CarouselProps } from './props';
import { applyEscapeProps } from './escape-props';
import { toChildArray, mapChildren } from './child-array';
import { spacingStep } from './spacing';
import { cx } from './cx';
import { Icon } from './Icon';
import { Pressable } from './Pressable';

const EPS = 1;
const SNAP_DEBOUNCE_MS = 140;

/** Horizontal slide strip (Astryx `Carousel`), native leaf — a horizontal
 *  NS ScrollView wrapping a slide row, optional prev/next buttons,
 *  edge-fade gradients, and end-detection snap when `hasSnap` (NS has no
 *  scroll-snap; a debounced scroll event animates to the nearest slide
 *  edge — documented approximation). RTL offsets are physical on native. */
export function Carousel(props: CarouselProps) @{
	const items = toChildArray(props.children);
	const count = items.length;
	const gap = spacingStep(props.gap ?? 2) ?? 8;
	const scroller = useRef<any>(null);
	const track = useRef<any>(null);
	const [canPrev, setCanPrev] = useState(false);
	const [canNext, setCanNext] = useState(false);
	const [atStart, setAtStart] = useState(true);
	const [atEnd, setAtEnd] = useState(false);
	const loop = props.hasLoop === true;
	const snapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	const offsets = useCallback((): number[] => {
		const t = track.current;
		if (!t?.eachChildView) return [];
		const out: number[] = [];
		t.eachChildView((c: any) => {
			out.push(c.left ?? c.originX ?? 0);
			return true;
		});

		return out;
	}, []);

	const measure = useCallback(() => {
		const el = scroller.current;
		if (!el) return;
		const x = Number(el.horizontalOffset) || 0;
		const max = Math.max(0, Number(el.scrollableWidth) || 0);
		const prev = x > EPS;
		const next = x < max - EPS;
		setAtStart(!prev);
		setAtEnd(!next);
		setCanPrev(loop ? count > 1 : prev);
		setCanNext(loop ? count > 1 : next);
	}, [count, loop]);

	const scrollToIndex = useCallback(
		(i: number) => {
			const el = scroller.current;
			const o = offsets();
			if (!el || !o.length) return;
			const clamped = Math.min(Math.max(i, 0), count - 1);
			el.scrollToHorizontalOffset?.(o[clamped] ?? 0, true);
		},
		[count, offsets],
	);

	const scrollNext = useCallback(() => {
		const el = scroller.current;
		if (!el) return;
		const x = Number(el.horizontalOffset) || 0;
		const max = Math.max(0, Number(el.scrollableWidth) || 0);
		const page = el.getActualSize?.().width || 0;
		if (x >= max - EPS && loop) {
			el.scrollToHorizontalOffset?.(0, true);
			return;
		}

		el.scrollToHorizontalOffset?.(Math.min(x + page, max), true);
	}, [loop]);

	const scrollPrev = useCallback(() => {
		const el = scroller.current;
		if (!el) return;
		const x = Number(el.horizontalOffset) || 0;
		const max = Math.max(0, Number(el.scrollableWidth) || 0);
		const page = el.getActualSize?.().width || 0;
		if (x <= EPS && loop) {
			el.scrollToHorizontalOffset?.(max, true);
			return;
		}

		el.scrollToHorizontalOffset?.(Math.max(x - page, 0), true);
	}, [loop]);

	const handle: CarouselHandle = {
		scrollNext,
		scrollPrev,
		scrollTo: scrollToIndex,
		canScrollNext: () => {
			const el = scroller.current;
			if (!el) return false;
			if (loop) return count > 1;
			return (Number(el.horizontalOffset) || 0) < Math.max(0, Number(el.scrollableWidth) || 0) - EPS;
		},
		canScrollPrev: () => {
			const el = scroller.current;
			if (!el) return false;
			if (loop) return count > 1;
			return (Number(el.horizontalOffset) || 0) > EPS;
		},
	};

	useImperativeHandle(props.ref, () => handle, undefined);

	useEffect(() => {
		const el = scroller.current;
		if (!el?.on) return;
		const onScroll = () => {
			measure();
			if (props.hasSnap) {
				if (snapTimer.current) clearTimeout(snapTimer.current);
				snapTimer.current = setTimeout(() => {
					const o = offsets();
					const elNow = scroller.current;
					if (!o.length || !elNow) return;
					const x = Number(elNow.horizontalOffset) || 0;
					let nearest = o[0];
					for (const off of o) {
						if (Math.abs(off - x) < Math.abs(nearest - x)) nearest = off;
					}

					elNow.scrollToHorizontalOffset?.(nearest, true);
				}, SNAP_DEBOUNCE_MS);
			}
		};

		el.on('scroll', onScroll);
		el.on('layoutChanged', measure);
		measure();
		return () => {
			el.off?.('scroll', onScroll);
			el.off?.('layoutChanged', measure);
			if (snapTimer.current) clearTimeout(snapTimer.current);
		};
	}, [count, measure, props.hasSnap, offsets]);

	<gridlayout
		className={cx('vx-carousel', props.className)}
		style={props.style}
		id={props.id}
		rows="*"
		columns="*"
		accessibilityLabel={props.accessibilityLabel ?? props.label}
	>
		<scrollview
			ref={(v: any) => {
				scroller.current = v;
				applyEscapeProps(v, props);
			}}
			orientation="horizontal"
			className="vx-carousel-viewport"
			scrollBarIndicatorVisible={false}
		>
			<flexboxlayout
				ref={(v: any) => {
					track.current = v;
				}}
				flexDirection="row"
				className="vx-carousel-track"
				style={{ columnGap: gap }}
			>
				{mapChildren(items, (child: any, i: number) => (
					<flexboxlayout
						className={cx(
							'vx-carousel-slide',
							props.variant === 'proportional' && 'vx-carousel-slide--prop',
						)}
						accessibilityLabel={`Slide ${i + 1} of ${count}`}
					>
						{child}
					</flexboxlayout>
				))}
			</flexboxlayout>
		</scrollview>
		{props.hasEdgeFade && !atStart && (
			<flexboxlayout
				className="vx-carousel-fade vx-carousel-fade-start"
				verticalAlignment="stretch"
				horizontalAlignment="left"
				isUserInteractionEnabled={false}
			/>
		)}
		{props.hasEdgeFade && !atEnd && (
			<flexboxlayout
				className="vx-carousel-fade vx-carousel-fade-end"
				verticalAlignment="stretch"
				horizontalAlignment="right"
				isUserInteractionEnabled={false}
			/>
		)}
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
	</gridlayout>
}
