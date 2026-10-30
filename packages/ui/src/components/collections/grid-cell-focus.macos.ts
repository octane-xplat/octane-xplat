import type { NativeKeyboardEvent } from '@octane-xplat/jsx/intrinsics'
import type { GridFocusOptions } from './use-grid-focus'
import { appKitHost } from '../../internal/platform/host-bridge'
import { createAppKitGridNavigation } from './grid-navigation.macos'
import type { NSView } from '@octane-xplat/platform/macos'

// Imperative query boundaries, not rendered state. Every mounted hook owns a lease.
const roots = new Map<NSView, number>()
const rootReaders = new Set<() => void>()
let refreshingRoots = false,
	rootsPending = false

function refreshRoots() {
	if (refreshingRoots) {
		rootsPending = true
		return
	}
	refreshingRoots = true
	try {
		do {
			rootsPending = false
			for (const refresh of [...rootReaders]) {
				try {
					refresh()
				} catch {}
			}
		} while (rootsPending)
	} finally {
		refreshingRoots = false
	}
}

function flag(view: any, name: string, fallback = false): boolean {
	const value = view?.[name]
	return value == null ? fallback : Boolean(typeof value === 'function' ? value.call(view) : value)
}

const enabled = (view: NSView) =>
	!flag(view, 'hidden') &&
	!flag(view, 'hiddenOrHasHiddenAncestor') &&
	flag(view, 'enabled', true) &&
	flag(view, 'isEnabled', true) &&
	flag(view, 'isAccessibilityEnabled', true)

/** Bounded 2D cell movement over the existing native row focus/scroll/Tab engine. */
export function createAppKitGridCellFocus(
	deps: {
		root(): NSView | null
		options(): GridFocusOptions
		changed(index: number): void
	},
	native: () => Record<string, any> = () => globalThis,
	bridge: typeof appKitHost = appKitHost,
): {
	available: () => boolean
	synchronize: () => void
	start(): () => void
	focusCell: (next: number) => boolean
	getIndex: () => number
	onKeyDown(event: NativeKeyboardEvent<object>): void
	dispose: () => void
} {
	let active = false,
		disposed = false,
		registered: NSView | null = null,
		off: (() => void) | undefined,
		index = 0
	const replaceRoot = (next: NSView | null) => {
		if (next === registered) {
			return
		}
		const previous = registered
		registered = next
		let changed = false
		if (previous) {
			const count = (roots.get(previous) ?? 1) - 1
			if (count) {
				roots.set(previous, count)
			} else {
				roots.delete(previous)
				changed = true
			}
		}
		if (next) {
			if (!roots.has(next)) {
				changed = true
			}

			roots.set(next, (roots.get(next) ?? 0) + 1)
		}
		if (changed) {
			refreshRoots()
		}
	}
	const root = () => {
		const next = deps.root()
		if (active) {
			replaceRoot(next)
		}
		return next
	}
	const cells = (): NSView[] => {
		const view = root(),
			read = bridge()?.readGridCells
		if (!view || typeof read !== 'function') {
			return []
		}
		const found = read(
			view,
			[...roots.keys()].filter((other) => other !== view),
		)
		return Array.isArray(found)
			? found.filter((view) => view && (typeof view === 'object' || typeof view === 'function'))
			: []
	}
	const makeNavigation = () =>
		createAppKitGridNavigation(
			{
				root,
				rows: () => cells().map((view, key) => ({ key, view })),
				columns: () => deps.options().columns,
				tabMode: () => false,
				press() {},
			},
			native,
			bridge,
		)
	let navigation = makeNavigation()
	const valid = () =>
		[deps.options().rows, deps.options().columns].every(
			(value) => Number.isSafeInteger(value) && value > 0,
		)
	const available = (): boolean =>
		!disposed && valid() && typeof bridge()?.readGridCells === 'function' && navigation.available()
	const stop = () => {
		active = false
		rootReaders.delete(refreshBoundary)
		const cleanup = off
		off = undefined
		try {
			cleanup?.()
		} finally {
			replaceRoot(null)
		}
	}
	const refreshBoundary = () => {
		if (active && off) {
			if (!available()) {
				stop()
				return
			}

			try {
				navigation.synchronize()
			} catch {
				stop()
			}
		}
	}
	const start = () => {
		if (disposed || active) {
			return
		}
		// A later render may retry a missing/failed bridge using a fresh native owner.
		if (!navigation.available()) {
			navigation = makeNavigation()
		}
		if (!available()) {
			return
		}
		active = true
		rootReaders.add(refreshBoundary)
		root()
		off = navigation.start()
		if (!navigation.available()) {
			stop()
		}
	}
	const synchronize = (): void => {
		if (disposed) {
			return
		}
		if (!available()) {
			stop()
			start()
			return
		}
		if (!active) {
			start()
		}
		if (active) {
			try {
				navigation.synchronize()
			} catch {
				stop()
			}
		}
	}
	const focusCell = (next: number): boolean => {
		if (!active || !available() || !Number.isSafeInteger(next)) {
			return false
		}
		try {
			const ownerRoot = root()
			const list = cells(),
				clamped = Math.max(0, Math.min(next, list.length - 1))

			if (!list[clamped] || !enabled(list[clamped])) {
				return false
			}

			if (!navigation.focusRow(clamped)) {
				return false
			}

			if (!active || disposed || !available() || root() !== ownerRoot) {
				return false
			}

			const accepted = cells().indexOf(list[clamped])
			if (accepted < 0) {
				return false
			}

			index = accepted
		} catch {
			stop()
			return false
		}
		deps.changed(index)
		return true
	}
	const dispose = (): void => {
		if (!disposed) {
			disposed = true
			stop()
		}
	}
	return {
		available,
		synchronize,
		start(): () => void {
			start()
			return dispose
		},
		focusCell,
		getIndex: (): number => index,
		onKeyDown(event: NativeKeyboardEvent<object>): void {
			if (
				disposed ||
				event.defaultPrevented ||
				event.isComposing ||
				event.altKey ||
				event.ctrlKey ||
				event.metaKey
			) {
				return
			}
			synchronize()
			if (!active || !available()) {
				return
			}
			let list: NSView[]
			try {
				list = cells()
			} catch {
				stop()
				return
			}
			const current = list.indexOf(event.target as NSView)
			if (current < 0 || !enabled(list[current])) {
				return
			} // Descendant text controls keep their editing keys.
			const columns = deps.options().columns
			const delta =
				event.key === 'ArrowRight'
					? 1
					: event.key === 'ArrowLeft'
						? -1
						: event.key === 'ArrowDown'
							? columns
							: event.key === 'ArrowUp'
								? -columns
								: 0
			let next =
				event.key === 'Home'
					? 0
					: event.key === 'End'
						? list.length - 1
						: Math.max(0, Math.min(current + delta, list.length - 1))
			if (!delta && event.key !== 'Home' && event.key !== 'End') {
				return
			} // Activation stays with each cell.
			const step = event.key === 'Home' ? 1 : event.key === 'End' ? -1 : delta
			while (next >= 0 && next < list.length && !enabled(list[next])) {
				next += step
			}
			if (next < 0 || next >= list.length) {
				return
			}
			if (next === current) {
				event.preventDefault()
				return
			}
			if (focusCell(next)) {
				event.preventDefault()
				deps.options().onFocusChange?.(index)
			}
		},
		dispose,
	}
}
