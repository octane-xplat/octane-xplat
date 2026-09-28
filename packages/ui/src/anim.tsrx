import { useRef } from 'octane';
import { requestAnimationFrame, cancelAnimationFrame } from '@nativescript/core/animation-frame';

/**
 * Imperative animation value (decision #10 — no worklets; JS runs on the UI
 * thread on NS so a rAF tween writes the view directly). `bind` is a leaf
 * `bind` prop target: the leaf forwards it to the intrinsic's `ref`, and the
 * runtime hands us the NS view.
 */
export type { AnimatedValue } from './props';
import type { AnimatedValue } from './props';

function createAnimated(initial: number, prop: string): AnimatedValue {
	let view: any = null;
	let current = initial;
	let raf = 0;
	const apply = (v: number) => {
		current = v;
		if (view) view[prop] = v;
	};

	const run = (step: (t: number) => number | null) => {
		cancelAnimationFrame(raf);
		const start = Date.now();
		const tick = () => {
			const v = step(Date.now() - start);
			if (v === null) return;
			apply(v);
			raf = requestAnimationFrame(tick);
		};

		raf = requestAnimationFrame(tick);
	};

	return {
		get value() { return current; },
		bind(v) { view = v; if (view) view[prop] = current; },
		to(target, opts) {
			const dur = opts?.duration ?? 300;
			const from = current;
			run((t) => t >= dur ? (apply(target), null) : from + (target - from) * (t / dur));
		},
		spring(target, opts) {
			// JS integrator — native spring curves diverge iOS/Android; simulating
			// keeps semantics identical on both targets (doc: animation-gestures).
			const damping = opts?.damping ?? 14, stiffness = opts?.stiffness ?? 120;
			let v = 0, x = current;
			run(() => {
				const dt = 1 / 60;
				v += (-stiffness * (x - target) - damping * v) * dt;
				x += v * dt;
				return Math.abs(v) < 0.5 && Math.abs(x - target) < 0.5 ? (apply(target), null) : x;
			});
		},
		stop() { cancelAnimationFrame(raf); },
	};
}

/** useAnimation — a stable animated value across renders. `prop` is the NS
 *  view property written per frame (translateX default). */
export function useAnimation(initial = 0, prop = 'translateX'): AnimatedValue {
	const c = useRef<AnimatedValue | null>(null);
	if (!c.current) c.current = createAnimated(initial, prop);
	return c.current;
}
