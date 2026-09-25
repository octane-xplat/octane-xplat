/** Per-element transform composition for imperative writes. The DOM has a
 *  single `transform` string where native has discrete view props, so web
 *  keeps the last-written value per transform prop and re-joins them —
 *  an AnimatedValue on `rotate` and a setTranslate drag on the same
 *  element don't clobber each other. */

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

/** Write one transform prop without disturbing the element's other
 *  transform components (or its stylesheet/base transform). */
export function writeTransformProp(el: HTMLElement, prop: string, value: number): void {
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
