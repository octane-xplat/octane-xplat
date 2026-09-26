// Named responsive thresholds — web leaf.
import { useEffect } from 'octane'
import { useSignal$ } from 'octane/signals/client'
import type { BreakpointMap, BreakpointMatches } from './breakpoints.types'

const listeners = new Set<() => void>()

function publish() {
	for (const listener of listeners) listener()
}

function subscribe(listener: () => void): () => void {
	if (listeners.size === 0) {
		window.addEventListener('resize', publish)
		window.addEventListener('orientationchange', publish)
	}
	listeners.add(listener)
	return () => {
		listeners.delete(listener)
		if (listeners.size === 0) {
			window.removeEventListener('resize', publish)
			window.removeEventListener('orientationchange', publish)
		}
	}
}

function matchesAt<T extends BreakpointMap>(width: number, breakpoints: T): BreakpointMatches<T> {
	const matches: Record<string, boolean> = {}
	for (const name in breakpoints) {
		matches[name] = width >= breakpoints[name]
	}
	return matches as BreakpointMatches<T>
}

function sameMatches(a: Record<string, boolean>, b: Record<string, boolean>): boolean {
	for (const name in a) {
		if (!(name in b)) return false
	}
	for (const name in b) {
		if (a[name] !== b[name]) return false
	}
	return true
}

export function useBreakpoints<T extends BreakpointMap>(breakpoints: T): BreakpointMatches<T> {
	const matches$ = useSignal$<BreakpointMatches<T>>(matchesAt(window.innerWidth, breakpoints))
	useEffect(() => {
		const update = () => {
			const next = matchesAt(window.innerWidth, breakpoints)
			if (!sameMatches(matches$.get(), next)) matches$.set(next)
		}
		const unsubscribe = subscribe(update)
		update()
		return unsubscribe
	}, [breakpoints])
	return matches$.get()
}
