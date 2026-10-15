/** @jsxImportSource @nativescript-community/octane */
import { useCallback, useEffect, useRef, useState } from 'octane';
import type { MeasureBounds, MeasureResult, UseMeasureOptions } from './props';

/** Screen position of the app surface's top-left — the topmost attached
 *  ancestor's location. `(0,0)` for full-screen windows; non-zero under
 *  Android multi-window or a moved iPadOS window. A detached or oddly
 *  rooted ancestor still reports its own position, so the subtraction
 *  degrades to the old screen-relative value rather than failing. */
function surfaceOrigin(view: any): { x: number; y: number } {
	let root = view;
	while (root?.parent) root = root.parent;
	const point = root?.getLocationOnScreen?.();
	return point ? { x: point.x, y: point.y } : { x: 0, y: 0 };
}

function readBounds(view: any): MeasureBounds | null {
	const point = view?.getLocationOnScreen?.();
	const size = view?.getActualSize?.();
	if (!point || !size) return null;
	const origin = surfaceOrigin(view);
	return {
		x: point.x - origin.x,
		y: point.y - origin.y,
		width: size.width,
		height: size.height,
	};
}

/** Binds to a NativeScript view and observes app-surface DIP bounds by default. */
export function useMeasure(options: UseMeasureOptions = {}): MeasureResult {
	const [bounds, setBounds] = useState<MeasureBounds | null>(null);
	const detach = useRef<(() => void) | null>(null);
	const observe = options.observe ?? true;
	const ref = useCallback((view: any) => {
		detach.current?.();
		detach.current = null;
		if (!view) {
			setBounds(null);
			return;
		}

		const update = () => {
			const next = readBounds(view);
			// Fresh object each read — skip the setState when nothing moved
			// or the re-render → layoutChanged → update loop never ends.
			setBounds((prev: MeasureBounds | null) => {
				return prev && next &&
					prev.x === next.x && prev.y === next.y &&
					prev.width === next.width && prev.height === next.height
					? prev
					: next;
			});
		};

		view.on?.('loaded', update);
		update();
		const scrollParents: any[] = [];
		if (observe) {
			view.on?.('layoutChanged', update);
			let parent = view.parent;
			while (parent) {
				parent.on?.('scroll', update);
				scrollParents.push(parent);
				parent = parent.parent;
			}
		}

		detach.current = () => {
			view.off?.('loaded', update);
			if (observe) {
				view.off?.('layoutChanged', update);
				for (const parent of scrollParents) {
					parent.off?.('scroll', update);
				}
			}
		};
	}, [observe]);

	useEffect(() => () => detach.current?.(), []);

	return { ref, bounds };
}
