import type { ShortcutEvent, ShortcutPlatform } from './engine/types/public.js'

export interface ShortcutHost {
	platform(): ShortcutPlatform
	delay(callback: () => void, milliseconds: number): () => void
	subscribe(
		target: object,
		callbacks: {
			key(event: ShortcutEvent): void
			capture?(event: ShortcutEvent): void
			reset(): void
		},
	): () => void
	boundaryDepth(target: object | undefined, event: ShortcutEvent): number | undefined
	isEditableTarget(target: object | null): boolean
}

export function unwrap(target: object): any {
	return (target as { nativeViewProtected?: object }).nativeViewProtected ?? target
}

export function pathFrom(target: any, parent: (target: any) => any): object[] {
	const path: object[] = []
	for (let node = target; node && !path.includes(node); node = parent(node)) {
		path.push(node)
	}
	return path
}

export function pathDepth(target: object | undefined, event: ShortcutEvent): number | undefined {
	if (!target) {
		return Infinity
	}
	const path = event.composedPath?.() ?? (event.target ? [event.target] : [])
	const index = path.indexOf(unwrap(target))
	return index < 0 ? undefined : index
}

export function cleanupAll(releases: (() => void)[]): void {
	const errors: unknown[] = []
	for (const release of releases.splice(0).reverse()) {
		try {
			release()
		} catch (error) {
			errors.push(error)
		}
	}
	if (errors.length) {
		throw new AggregateError(errors, 'Shortcut cleanup failed')
	}
}

export function delay(callback: () => void, milliseconds: number): () => void {
	const timer = setTimeout(callback, milliseconds)
	return () => clearTimeout(timer)
}
