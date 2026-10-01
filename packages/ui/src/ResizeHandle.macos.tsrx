/** @jsxImportSource @xplat/macos/renderer */
import { useRef } from 'octane';
import type { ResizeHandleProps, PanEvent } from './props';
import { cx } from './cx';

import { Pressable } from './Pressable.macos.tsrx';

/** ResizeHandle — draggable separator bound to a useResizable region.
 *  Native leaf: pan gestures drive the same _onResize{Start,Move,End,
 *  Cancel} lifecycle; a double-tap toggles collapse; arrows are a
 *  pointer-platform behavior (web). The handle is focusable for
 *  assistive tech via `accessibilityRole="adjustable"`. */
export function ResizeHandle(props: ResizeHandleProps) @{
	const direction = props.direction ?? 'horizontal';
	const isHorizontal = direction === 'horizontal';
	const sign = props.isReversed ? -1 : 1;
	const resizable = props.resizable;
	const started = useRef(false);
	const lastTap = useRef(0);

	const onPan = (e: PanEvent) => {
		if (props.isDisabled || !resizable) return;
		const delta = (isHorizontal ? e.dx : e.dy) * sign;
		if (e.state === 'began') {
			started.current = true;
			resizable._onResizeStart();
		} else if (e.state === 'changed' || e.state === 'moved') {
			if (started.current) resizable._onResizeMove(delta);
		} else {
			// ended / cancelled
			if (started.current) {
				started.current = false;
				if (e.state === 'cancelled' || e.state === 'canceled') {
					resizable._onResizeCancel?.();
				} else {
					resizable._onResizeEnd();
				}
			}
		}
	};

	const onTap = () => {
		if (props.isDisabled || !resizable?._collapsible) return;
		// Double-tap toggles collapse — the touch analog of dblclick.
		const now = Date.now();
		if (now - lastTap.current < 400) {
			lastTap.current = 0;
			resizable._onResizeStart();
			resizable._onResizeMove(resizable._isCollapsed ? resizable._minSizePx : -resizable._size);
			resizable._onResizeEnd();
		} else {
			lastTap.current = now;
		}
	};

	const collapsed = resizable?._isCollapsed ?? false;
	const pillSide =
		props.pillPlacement === 'auto' || props.pillPlacement == null
			? collapsed
				? 'center'
				: props.isReversed
					? 'end'
					: 'start'
			: props.pillPlacement;

	<Pressable

		id={props.id}
		className={cx(
			'vx-resize-handle',
			isHorizontal ? 'vx-resize-handle--h' : 'vx-resize-handle--v',
			props.position === 'overlay' && 'vx-resize-handle--overlay',
			props.hasDivider && 'vx-resize-handle--divider',
			props.isAlwaysVisible && 'vx-resize-handle--always',
			'vx-resize-handle--pill-' + pillSide,
			collapsed && 'vx-resize-handle--collapsed',
			props.isDisabled && 'vx-resize-handle--disabled',
			props.className,
		)}
		style={props.style}
		disabled={props.isDisabled}
		accessibilityRole="adjustable"
		accessibilityLabel={props.label ?? 'Resize handle'}
		accessibilityValue={resizable ? String(Math.round(resizable._size)) : undefined}
		onPress={onTap}
	>
		{props.children ?? <flexboxlayout className="vx-resize-handle-pill" />}
	</Pressable>
}
