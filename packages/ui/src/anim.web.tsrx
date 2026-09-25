import { useRef } from 'octane';

export type { AnimatedValue } from './props';
import type { AnimatedValue } from './props';

const transformProps = {
	translateX: (v: number) => `translateX(${v}px)`,
	translateY: (v: number) => `translateY(${v}px)`,
	translateZ: (v: number) => `translateZ(${v}px)`,
	scale: (v: number) => `scale(${v})`,
	scaleX: (v: number) => `scaleX(${v})`,
	scaleY: (v: number) => `scaleY(${v})`,
	rotate: (v: number) => `rotate(${v}deg)`,
	rotateX: (v: number) => `rotateX(${v}deg)`,
	rotateY: (v: number) => `rotateY(${v}deg)`,
	skewX: (v: number) => `skewX(${v}deg)`,
	skewY: (v: number) => `skewY(${v}deg)`,
} satisfies Record<string, (v: number) => string>;

type TransformProp = keyof typeof transformProps;
type TransformState = { base: string; values: Map<TransformProp, number> };

const transformStates = new WeakMap<HTMLElement, TransformState>();

function writeAnimatedValue(el: HTMLElement, prop: string, value: number) {
	if (Object.prototype.hasOwnProperty.call(transformProps, prop)) {
		const transformProp = prop as TransformProp;
		let state = transformStates.get(el);
		if (!state) {
			const computed = getComputedStyle(el).transform;
			state = {
				base: computed === 'none' ? '' : computed,
				values: new Map(),
			};

			transformStates.set(el, state);
		}

		state.values.set(transformProp, value);
		const transforms = Object.entries(transformProps)
			.filter(([name]) => state.values.has(name as TransformProp))
			.map(([name, toTransform]) => toTransform(state.values.get(name as TransformProp)!));

		el.style.transform = [state.base, ...transforms].filter(Boolean).join(' ');
		return;
	}

	(el.style as any)[prop] = value;
}

function createAnimated(initial: number, prop: string): AnimatedValue {
	let el: HTMLElement | null = null;
	let current = initial;
	let raf = 0;
	const apply = (v: number) => {
		current = v;
		if (el) writeAnimatedValue(el, prop, v);
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
		bind(e) { el = e as HTMLElement; if (el) writeAnimatedValue(el, prop, current); },
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
