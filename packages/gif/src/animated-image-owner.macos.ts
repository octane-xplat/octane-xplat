import type { AnimatedImageProps } from './props.ts'

export interface AppKitAnimatedImageNative {
	setSource(source: string): void
	setFit(value: string): void
	setAlt(value: string): void
	dispose(): void
}
/** Own the current native surface; unrelated renders do not restart animation. */
export function createAppKitAnimatedImageOwner(props: () => AnimatedImageProps) {
	let view: AppKitAnimatedImageNative | null = null
	let revision = 0
	let applied: { source?: string; fit?: string; alt?: string } | null = null
	const sync = () => {
		const native = view, own = ++revision
		if (!native) return
		const current = props(), next = { source: current.src, fit: current.stretch ?? 'aspectFit', alt: current.alt ?? '' }
		const state = applied ??= {}
		try {
			if (state.fit !== next.fit) { state.fit = next.fit; native.setFit(next.fit) }
			if (view !== native || revision !== own) return
			if (state.alt !== next.alt) { state.alt = next.alt; native.setAlt(next.alt) }
			if (view !== native || revision !== own) return
			if (state.source !== next.source) { state.source = next.source; native.setSource(next.source) }
		} catch (error) { if (view === native && revision === own) applied = null; throw error }
	}
	return {
		sync,
		attach(next: AppKitAnimatedImageNative) {
			if (next === view) { sync(); return }
			const previous = view
			revision++; view = next; applied = null
			previous?.dispose()
			if (view === next) sync()
		},
		dispose() { const previous = view; revision++; view = null; applied = null; previous?.dispose() },
	}
}
