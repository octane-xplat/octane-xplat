import { useEffect, useMemo, useRef, useState } from 'octane';
import { useMeasure } from '@octane-xplat/ui';
import type { ChartProps } from './props';
import { computeScene } from './core/scene';
import type { ChartScene } from './core/scene';
import { createScrub, hitLabel } from './core/hit';
import type { SceneHit } from './core/hit';

const TIP_ESTIMATE_CHAR = 6.2;

/** Chart — web leaf. The core's Mark[] serialize to one svg markup string,
 *  inlined as `innerHTML` (Icon.web precedent — the same bytes feed
 *  `<svgview>` on native). Axis labels, legend, tooltip, and crosshair are
 *  real absolutely-positioned elements in the overlay — never `<text>` in
 *  the markup. Pointer handlers attach to the plot host so chart coords are
 *  client-minus-rect, matching the markup's coordinate space. */
export function Chart(props: ChartProps) @{
	const measure = useMeasure();
	const [cursor, setCursor] = useState<SceneHit | null>(null);
	const sceneRef = useRef<ChartScene | null>(null);
	const propsRef = useRef(props);
	propsRef.current = props;
	const hostRef = useRef<HTMLElement | null>(null);

	const bounds = measure.bounds;
	const w = props.width ?? bounds?.width ?? 0;
	const h =
		props.height ??
		(props.aspectRatio && w > 0
			? w / props.aspectRatio
			: bounds?.height && bounds.height > 0
				? bounds.height
				: w > 0
					? w / 1.6
					: 0);

	const scene = useMemo(
		() => (w > 0 && h > 0 ? computeScene(propsRef.current, w, h) : null),
		[
			props.type,
			props.data,
			props.margin,
			props.stacked,
			props.innerRadiusRatio,
			props.xAxis,
			props.yAxis,
			w,
			h,
		],
	);

	sceneRef.current = scene;

	const interactive = !!(props.onPress || props.onScrub || props.tooltip || props.crosshair);
	useEffect(() => {
		const el = hostRef.current;
		if (!el || !interactive) {
			return;
		}

		const scrub = createScrub(
			() => sceneRef.current,
			() => propsRef.current,
			setCursor,
		);

		const at = (e: PointerEvent) => {
			const rect = el.getBoundingClientRect();
			return { x: e.clientX - rect.left, y: e.clientY - rect.top };
		};

		const down = (e: PointerEvent) => {
			el.setPointerCapture?.(e.pointerId);
			const p = at(e);
			scrub('down', p.x, p.y);
		};

		const move = (e: PointerEvent) => {
			const p = at(e);
			scrub(e.buttons !== 0 ? 'move' : 'hover', p.x, p.y);
		};

		const up = (e: PointerEvent) => {
			const p = at(e);
			scrub('up', p.x, p.y);
		};

		// `click` (incl. el.click()/AT activation) is the web 'tap' — onPress
		// lives on tap so a real click after pointerup doesn't double-fire.
		// Synthetic clicks carry no pointer position → tap the center.
		const click = (e: MouseEvent) => {
			const p =
				e.clientX === 0 && e.clientY === 0
					? { x: el.getBoundingClientRect().width / 2, y: el.getBoundingClientRect().height / 2 }
					: at(e as PointerEvent);

			scrub('tap', p.x, p.y);
		};

		const end = () => scrub('cancel', 0, 0);
		const leave = () => scrub('leave', 0, 0);
		el.addEventListener('pointerdown', down);
		el.addEventListener('pointermove', move);
		el.addEventListener('pointerup', up);
		el.addEventListener('pointercancel', end);
		el.addEventListener('pointerleave', leave);
		el.addEventListener('click', click);
		return () => {
			el.removeEventListener('pointerdown', down);
			el.removeEventListener('pointermove', move);
			el.removeEventListener('pointerup', up);
			el.removeEventListener('pointercancel', end);
			el.removeEventListener('pointerleave', leave);
			el.removeEventListener('click', click);
		};
	}, [interactive]);

	const legend = props.legend === true ? 'bottom' : props.legend;
	const plot = scene?.plot;
	const dotColor =
		cursor && scene
			? scene.pie
				? scene.pie.slices.find((s) => s.series === cursor.series && s.index === cursor.index)?.color
				: scene.series[cursor.series]?.color
			: undefined;

	const tipText = cursor && scene ? hitLabel(scene, cursor) : null;
	const tipWidth = tipText ? tipText.length * TIP_ESTIMATE_CHAR + 14 : 0;
	const tipLeft =
		cursor && scene ? Math.min(Math.max(0, cursor.px - tipWidth / 2), Math.max(0, scene.width - tipWidth)) : 0;

	const tipTop = cursor ? cursor.py - 30 : 0;

	const legendRow = (items: { color: string; text: string }[], position: 'top' | 'bottom') => (
		<div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, paddingTop: position === 'bottom' ? 4 : 0, paddingBottom: position === 'top' ? 4 : 0 }}>
			{items.map((item) => (
				<span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
					<span style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: item.color, display: 'inline-block' }} />
					{item.text}
				</span>
			))}
		</div>
	);

	<div
		id={props.id}
		className={props.className}
		style={{ display: 'flex', flexDirection: 'column', width: props.width, height: props.height, ...props.style }}
		role={props.accessibilityLabel ? 'img' : undefined}
		aria-label={props.accessibilityLabel}
	>
		{legend === 'top' && scene ? legendRow(scene.legend, 'top') : null}
		<div
			id={props.id ? props.id + '-overlay' : undefined}
			ref={(el: HTMLElement | null) => {
				hostRef.current = el;
				measure.ref(el);
			}}
			style={{
				position: 'relative',
				flexGrow: 1,
				minHeight: 0,
				width: props.width,
				height: props.height ?? (props.aspectRatio && w > 0 ? w / props.aspectRatio : undefined),
			}}
		>
			<div dangerouslySetInnerHTML={scene ? { __html: scene.markup } : undefined} />
			<div style={{ position: 'absolute', inset: 0 }}>
				{scene?.labels.map((l) => (
					<div
						style={{
							position: 'absolute',
							left: l.x,
							top: l.y,
							width: l.width,
							fontSize: 10,
							opacity: 0.7,
							textAlign: l.align,
							overflow: 'hidden',
							whiteSpace: 'nowrap',
							textOverflow: 'ellipsis',
						}}
					>
						{l.text}
					</div>
				))}
				{cursor && props.crosshair && !scene?.pie && plot ? (
					<div style={{ position: 'absolute', left: cursor.px - 0.5, top: plot.y, width: 1, height: plot.height, backgroundColor: '#8a8a8a', pointerEvents: 'none' }} />
				) : null}
				{cursor && (props.crosshair || props.tooltip) ? (
					<div style={{ position: 'absolute', left: cursor.px - 4, top: cursor.py - 4, width: 8, height: 8, borderRadius: 4, backgroundColor: dotColor ?? '#4e79a7', pointerEvents: 'none' }} />
				) : null}
				{cursor && props.tooltip && tipText ? (
					<div
						style={{
							position: 'absolute',
							left: tipLeft,
							top: tipTop < 0 ? cursor.py + 12 : tipTop,
							backgroundColor: 'rgba(20,20,20,0.88)',
							color: '#fff',
							fontSize: 11,
							padding: '2px 6px',
							borderRadius: 4,
							whiteSpace: 'nowrap',
							pointerEvents: 'none',
						}}
					>
						{tipText}
					</div>
				) : null}
			</div>
		</div>
		{legend === 'bottom' && scene ? legendRow(scene.legend, 'bottom') : null}
	</div>
}
