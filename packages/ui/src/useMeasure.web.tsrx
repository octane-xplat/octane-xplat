import { useCallback, useEffect, useState } from 'octane';
import type { MeasureBounds, MeasureResult, UseMeasureOptions } from './props';

function readBounds(element: HTMLElement): MeasureBounds {
	const rect = element.getBoundingClientRect();
	return { x: rect.left, y: rect.top, width: rect.width, height: rect.height };
}

/** Binds to a web element and observes its viewport-relative bounds by default. */
export function useMeasure(options: UseMeasureOptions = {}): MeasureResult {
	const [element, setElement] = useState<HTMLElement | null>(null);
	const [bounds, setBounds] = useState<MeasureBounds | null>(null);
	const observe = options.observe ?? true;
	const bind = useCallback((next: any) => {
		setElement((current) => current === next ? current : next);
	}, []);

	useEffect(() => {
		if (!element) {
			setBounds(null);
			return;
		}

		const update = () => setBounds(readBounds(element));
		update();
		if (!observe) return;
		const resizeObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update);
		resizeObserver?.observe(element);
		window.addEventListener('resize', update);
		window.addEventListener('scroll', update, true);
		return () => {
			resizeObserver?.disconnect();
			window.removeEventListener('resize', update);
			window.removeEventListener('scroll', update, true);
		};
	}, [element, observe]);

	return { bind, bounds };
}
