import type { CaptureTarget } from './types'
const components = new WeakMap<object, () => object | null>()
export function bindComponentTarget(handle: object, read: () => object | null): void {
	components.set(handle, read)
}
export function resolveTarget(target: CaptureTarget): object {
	if (!target || typeof target !== 'object') {
		throw new TypeError('Capture requires an attached host or a populated Octane host ref')
	}
	let host: unknown =
		'current' in target ? (target as { readonly current: unknown }).current : target
	if (host && typeof host === 'object') {
		const component = components.get(host)
		if (component) {
			host = component()
		}
	}
	if (!host || typeof host !== 'object') {
		throw new TypeError('Capture ref is empty or disposed')
	}
	return host
}
