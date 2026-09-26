/** @jsxImportSource @nativescript-community/octane */
import { useCallback, useEffect, useState } from 'octane';
import type { MeasureBounds, MeasureResult, UseMeasureOptions } from './props';

function readBounds(view: any): MeasureBounds | null {
	const point = view?.getLocationOnScreen?.();
	const size = view?.getActualSize?.();
	if (!point || !size) return null;
	return { x: point.x, y: point.y, width: size.width, height: size.height };
}

/** Binds to a NativeScript view and observes screen-relative DIP bounds by default. */
export function useMeasure(options: UseMeasureOptions = {}): MeasureResult {
	const [view, setView] = useState<any>(null);
	const [bounds, setBounds] = useState<MeasureBounds | null>(null);
	const observe = options.observe ?? true;
	const bind = useCallback((next: any) => {
		setView((current: any) => current === next ? current : next);
	}, []);

	useEffect(() => {
		if (!view) {
			setBounds(null);
			return;
		}

		const update = () => {
			const next = readBounds(view);
			// Fresh object each read — skip the setState when nothing moved
			// or the re-render → layoutChanged → update loop never ends.
			setBounds((prev: MeasureBounds | null) =>
				prev && next &&
				prev.x === next.x && prev.y === next.y &&
				prev.width === next.width && prev.height === next.height
					? prev
					: next,
			);
		};

		const onLoaded = update;
		view.on?.('loaded', onLoaded);
		update();
		if (observe) {
			view.on?.('layoutChanged', update);
			let parent = view.parent;
			while (parent) {
				parent.on?.('scroll', update);
				parent = parent.parent;
			}
		}

		return () => {
			view.off?.('loaded', onLoaded);
			if (observe) {
				view.off?.('layoutChanged', update);
				let parent = view.parent;
				while (parent) {
					parent.off?.('scroll', update);
					parent = parent.parent;
				}
			}
		};
	}, [view, observe]);

	return { bind, bounds };
}
