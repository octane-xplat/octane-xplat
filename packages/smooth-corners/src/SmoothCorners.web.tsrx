import { useLayoutEffect, useRef, useState } from 'octane';
import { innerLayoutProps, outerLayoutProps, paintedStyle } from './layout-child.web';
import { smoothPathD } from './path';
import type { SmoothCornersProps } from './props';

/** SmoothCorners — `clip-path: path(d)` on the inner box + an SVG stroke
 *  overlay for `border`. `shadow` wraps the box in a `drop-shadow` filter so
 *  the shadow follows the clip (spread is not expressible — ignored). */
export function SmoothCorners(props: SmoothCornersProps) @{
	const ref = useRef<HTMLDivElement | null>(null);
	const [size, setSize] = useState({ w: 0, h: 0 });

	useLayoutEffect(() => {
		const el = ref.current;
		if (!el) return;
		const update = () => {
			const r = el.getBoundingClientRect();
			setSize((prev) =>
				prev.w === r.width && prev.h === r.height ? prev : { w: r.width, h: r.height },
			);
		};

		update();
		const ro = new ResizeObserver(update);
		ro.observe(el);
		return () => ro.disconnect();
	}, []);

	const d = smoothPathD(size.w, size.h, props.corners);
	const shadow = props.shadow;
	// Flex props style the clipped box; parent-layout metadata styles the
	// outermost element — the shadow wrapper when present, the box itself
	// otherwise.
	const inner = innerLayoutProps(props).style;
	const outer = outerLayoutProps(props).style;

	const box = (
		<div
			ref={ref}
			id={props.id}
			className={props.className}
			style={{
				position: 'relative',
				...paintedStyle(props.style),
				...inner,
				...(shadow ? {} : outer),
				clipPath: size.w > 0 ? `path("${d}")` : undefined,
			}}
		>
			{props.children}
			{props.border && size.w > 0 && (
				<svg
					style={{
						position: 'absolute',
						inset: 0,
						width: '100%',
						height: '100%',
						pointerEvents: 'none',
						overflow: 'visible',
					}}
					viewBox={`0 0 ${size.w} ${size.h}`}
					preserveAspectRatio="none"
				>
					<path
						d={d}
						fill="none"
						stroke={props.border.color}
						// Stroke is centered on the edge — the clip removes the outer half.
						strokeWidth={props.border.width * 2}
					/>
				</svg>
			)}
		</div>
	);

	if (!shadow) return box;
	const filter = `drop-shadow(${shadow.offsetX ?? 0}px ${shadow.offsetY ?? 0}px ${shadow.blur ?? 0}px ${shadow.color ?? 'rgba(0,0,0,0.35)'})`;
	return <div style={{ display: 'grid', ...outer, filter }}>{box}</div>;
}
