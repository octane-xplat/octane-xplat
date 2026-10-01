import { useCallback, useEffect, useRef } from 'octane';
import type { ResizeHandleProps } from './props';
import { applyEscapeProps } from './escape-props';

const KEYBOARD_STEP = 10;
const KEYBOARD_LARGE_STEP = 50;

const warned = new Set<string>();
function devWarnOnce(key: string, msg: string) {
	if (warned.has(key)) return;
	warned.add(key);
	console.warn(`[octane-xplat] ${msg}`);
}

/** ResizeHandle — draggable separator bound to a useResizable region via
 *  `resizable`. Pointer drag with capture; keyboard arrows/Home/End/Enter
 *  (AP['s separator pattern); double-click toggles collapse. `direction`
 *  selects the axis — `'horizontal'` resizes along the x-axis (the handle
 *  sits vertically, resizing width). */
export function ResizeHandle(props: ResizeHandleProps) @{
	const direction = props.direction ?? 'horizontal';
	const isHorizontal = direction === 'horizontal';
	const sign = props.isReversed ? -1 : 1;
	const resizable = props.resizable;
	const el = useRef<HTMLElement | null>(null);
	const drag = useRef<{ pointerId: number; startPos: number; rtl: number } | null>(null);

	useEffect(() => {
		const expected = resizable?._direction;
		if (expected && expected !== direction) {
			devWarnOnce(
				'resizable-direction:' + expected + '/' + direction,
				`ResizeHandle direction '${direction}' does not match the resizable region's '${expected}' — drags will act on the wrong axis.`,
			);
		}
	}, [resizable, direction]);

	const rtlMultiplier = useCallback(() => {
		const host = el.current;
		if (!host || !isHorizontal) return 1;
		return getComputedStyle(host).direction === 'rtl' ||
			(host.closest('[dir="rtl"]') && getComputedStyle(host.closest('[dir="rtl"]') as HTMLElement).direction === 'rtl')
			? -1
			: 1;
	}, [isHorizontal]);

	const posFrom = (e: PointerEvent) => (isHorizontal ? e.clientX : e.clientY);

	const onPointerMove = useCallback(
		(e: PointerEvent) => {
			const d = drag.current;
			if (!d || !resizable) return;
			resizable._onResizeMove((posFrom(e) - d.startPos) * d.rtl * sign);
		},
		[resizable, sign, isHorizontal],
	);

	const release = useCallback(
		(e: PointerEvent, cancelled: boolean) => {
			const host = el.current;
			const d = drag.current;
			if (!d || !resizable) return;
			drag.current = null;
			try {
				host?.releasePointerCapture?.(d.pointerId);
			} catch {}

			if (cancelled) {
				resizable._onResizeCancel?.();
			} else {
				resizable._onResizeEnd();
			}
		},
		[resizable],
	);

	const onPointerDown = useCallback(
		(e: PointerEvent) => {
			if (props.isDisabled || !resizable || e.button !== 0) return;
			e.preventDefault();
			const host = el.current;
			drag.current = { pointerId: e.pointerId, startPos: posFrom(e), rtl: isHorizontal ? (rtlMultiplier() as number) : 1 };
			try {
				host?.setPointerCapture?.(e.pointerId);
			} catch {}

			resizable._onResizeStart();
		},
		[resizable, props.isDisabled, isHorizontal, rtlMultiplier],
	);

	const onKeyDown = useCallback(
		(e: KeyboardEvent) => {
			if (props.isDisabled || !resizable) return;
			const step = e.shiftKey ? KEYBOARD_LARGE_STEP : KEYBOARD_STEP;
			const rtl = isHorizontal ? (rtlMultiplier() as number) : 1;
			switch (e.key) {
				case 'ArrowRight':
				case 'ArrowDown':
					e.preventDefault();
					resizable._onResizeStart();
					resizable._onResizeMove(step * (isHorizontal ? rtl : 1) * sign);
					resizable._onResizeEnd();
					break;
				case 'ArrowLeft':
				case 'ArrowUp':
					e.preventDefault();
					resizable._onResizeStart();
					resizable._onResizeMove(-step * (isHorizontal ? rtl : 1) * sign);
					resizable._onResizeEnd();
					break;
				case 'Home':
					e.preventDefault();
					resizable._onResizeStart();
					resizable._onResizeMove(resizable._minSizePx - resizable._size);
					resizable._onResizeEnd();
					break;
				case 'End':
					e.preventDefault();
					if (resizable._maxSizePx !== Infinity) {
						resizable._onResizeStart();
						resizable._onResizeMove(resizable._maxSizePx - resizable._size);
						resizable._onResizeEnd();
					}

					break;
				case 'Enter':
					e.preventDefault();
					if (resizable._collapsible) {
						resizable._onResizeStart();
						resizable._onResizeMove(resizable._isCollapsed ? resizable._minSizePx : -resizable._size);
						resizable._onResizeEnd();
					}

					break;
			}
		},
		[props.isDisabled, resizable, isHorizontal, rtlMultiplier, sign],
	);

	const onDoubleClick = useCallback(() => {
		if (props.isDisabled || !resizable || !resizable._collapsible) return;
		resizable._onResizeStart();
		resizable._onResizeMove(resizable._isCollapsed ? resizable._minSizePx : -resizable._size);
		resizable._onResizeEnd();
	}, [props.isDisabled, resizable]);

	// Lost capture / cancel releases the gesture without signalling end.
	useEffect(() => {
		const host = el.current;
		if (!host || !resizable) return;
		const onLostCapture = () => {
			if (drag.current) {
				drag.current = null;
				resizable._onResizeCancel?.();
			}
		};

		host.addEventListener('lostpointercapture', onLostCapture);
		return () => host.removeEventListener('lostpointercapture', onLostCapture);
	}, [resizable]);

	const collapsed = resizable?._isCollapsed ?? false;
	const pillSide =
		props.pillPlacement === 'auto' || props.pillPlacement == null
			? collapsed
				? 'center'
				: props.isReversed
					? 'end'
					: 'start'
			: props.pillPlacement;

	const cls = [
		'vx-resize-handle',
		isHorizontal ? 'vx-resize-handle--h' : 'vx-resize-handle--v',
		props.position === 'overlay' && 'vx-resize-handle--overlay',
		props.hasDivider && 'vx-resize-handle--divider',
		props.isAlwaysVisible && 'vx-resize-handle--always',
		'vx-resize-handle--pill-' + pillSide,
		collapsed && 'vx-resize-handle--collapsed',
		props.isDisabled && 'vx-resize-handle--disabled',
		props.className,
	];

	<div
		ref={(node: HTMLElement | null) => { el.current = node; if (node) applyEscapeProps(node, props); }}
		id={props.id}
		className={cls}
		style={props.style}
		role="separator"
		aria-orientation={isHorizontal ? 'vertical' : 'horizontal'}
		aria-label={props.label ?? 'Resize handle'}
		aria-valuenow={resizable ? Math.round(resizable._size) : undefined}
		aria-valuemin={resizable ? Math.round(resizable._minSizePx) : undefined}
		aria-valuemax={resizable && resizable._maxSizePx !== Infinity ? Math.round(resizable._maxSizePx) : undefined}
		aria-disabled={props.isDisabled || !resizable ? true : undefined}
		tabIndex={props.isDisabled ? undefined : 0}
		onPointerDown={onPointerDown}
		onPointerMove={onPointerMove}
		onPointerUp={(e: PointerEvent) => release(e, false)}
		onPointerCancel={(e: PointerEvent) => release(e, true)}
		onKeyDown={onKeyDown}
		onDoubleClick={onDoubleClick}
	>
		{props.children ?? <span className="vx-resize-handle-pill" aria-hidden="true" />}
	</div>
}
