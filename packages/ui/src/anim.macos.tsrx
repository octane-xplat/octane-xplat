import type { AnimatedValue } from './props'

/** AppKit animation writes currently commit their target value immediately.
 * This preserves the shared hook surface while the host animation driver is
 * still unsupported. */
export function useAnimation(initial = 0, property = 'opacity'): AnimatedValue {
	let value = initial
	let view: any
	const write = (next: number) => {
		value = next
		if (view) {view[property] = next}
	}

	return {
		get value() { return value },
		ref(el: any) { view = el; write(value) },
		to(target: number) { write(target) },
		spring(target: number) { write(target) },
		stop() {},
	}
}
