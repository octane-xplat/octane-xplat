/** @jsxImportSource @nativescript-community/octane */
import { useCallback, useEffect, useRef, useState } from 'octane';
import type { MeasureBounds, MeasureResult, UseMeasureOptions } from './props';

function readBounds(view: any): MeasureBounds | null {
	const point = view?.getLocationOnScreen?.();
	const size = view?.getActualSize?.();
	if (!point || !size) return null;
	return { x: point.x, y: point.y, width: size.width, height: size.height };
}

/** Binds to a NativeScript view and observes screen-relative DIP bounds by default. */
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
