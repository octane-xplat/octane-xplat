import { useRef } from 'octane';

export type { AnimatedValue } from './props';
import type { AnimatedValue } from './props';

function createAnimated(initial: number, prop: string): AnimatedValue {
	let el: HTMLElement | null = null;
	let current = initial;
	let raf = 0;
	const apply = (v: number) => {
		current = v;
		if (el) el.style.transform = `translateX(${v}px)`;
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
		bind(e) { el = e as HTMLElement; if (el) el.style.transform = `translateX(${current}px)`; },
		to(target, opts) {
			const dur = opts?.duration ?? 300;
			const from = current;
			run((t) => t >= dur ? (apply(target), null) : from + (target - from) * (t / dur));
		},
		spring(target, opts) {
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

export function useAnimation(initial = 0, prop = 'translateX'): AnimatedValue {
	const c = useRef<AnimatedValue | null>(null);
	if (!c.current) c.current = createAnimated(initial, prop);
	return c.current;
}
