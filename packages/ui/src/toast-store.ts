import { createStore } from './store'
import type { ToastDismissReason, ToastEntry, ToastOptions } from './props'

/** Module-scope toast queue — the single source of truth for every leaf.
 *  Cross-root state uses module stores (overlay roots never share context
 *  with the declaring tree on native); each leaf's stack reads this and
 *  owns only presentation. */
export const toastStore = createStore<ToastEntry[]>([])

/** Stack id for toasts pushed without an enclosing `ToastViewport`
 *  (`showToast`, or `useToast` outside a provider) — the auto-mounted
 *  fallback stack. */
export const FALLBACK_TOAST_VIEWPORT = '__xplat_toast_fallback__'

/** Time the `exiting` flag holds before an entry leaves the store — the
 *  leaf's exit presentation runs inside this window. */
export const TOAST_EXIT_MS = 220

let counter = 0

const mountedViewports = new Set<string>()

/** Registers a mounted stack so orphaned entries can drain to the
 *  fallback instead of vanishing with their viewport. */
export function registerToastViewport(id: string): () => void {
	mountedViewports.add(id)
	return () => {
		mountedViewports.delete(id)
	}
}

/** Does this entry render on `viewportId`'s stack? Entries whose owning
 *  viewport unmounted fall back so they still dismiss on schedule. */
export function toastOnViewport(entry: ToastEntry, viewportId: string): boolean {
	const owner = entry.viewportId ?? FALLBACK_TOAST_VIEWPORT
	if (owner === viewportId) {
		return true
	}

	return (
		viewportId === FALLBACK_TOAST_VIEWPORT &&
		owner !== FALLBACK_TOAST_VIEWPORT &&
		!mountedViewports.has(owner)
	)
}

/** Push a toast. Returns the entry id ('' when a same-`uniqueID` toast
 *  with `collisionBehavior: 'ignore'` suppressed it). Overwrite collision
 *  swaps the entry in place — the replaced toast's `onHide` does NOT fire
 *  (it was superseded, not dismissed). */
export function pushToast(options: ToastOptions, viewportId?: string): string {
	const list = toastStore.get()
	const uniqueID = options.uniqueID
	if (
		uniqueID &&
		(options.collisionBehavior ?? 'overwrite') === 'ignore' &&
		list.some((t) => t.options.uniqueID === uniqueID)
	) {
		return ''
	}

	const entry: ToastEntry = { id: `xplat-toast-${++counter}`, options, viewportId }
	if (uniqueID) {
		const existing = list.findIndex((t) => t.options.uniqueID === uniqueID)
		if (existing >= 0) {
			toastStore.set(list.map((t) => (t.options.uniqueID === uniqueID ? entry : t)))
			return entry.id
		}
	}

	toastStore.set([...list, entry])
	return entry.id
}

/** Dismiss a toast: fires `onHide` exactly once, flags `exiting` for the
 *  exit presentation, then prunes the entry after `TOAST_EXIT_MS`.
 *  Idempotent — a second call while exiting is a no-op. */
export function dismissToast(id: string, reason: ToastDismissReason = 'manual'): void {
	if (!id) {
		return
	}

	const list = toastStore.get()
	const entry = list.find((t) => t.id === id)
	if (!entry || entry.exiting) {
		return
	}

	entry.options.onHide?.(reason)
	toastStore.set(list.map((t) => (t.id === id ? { ...t, exiting: true } : t)))
	setTimeout(() => {
		toastStore.set(toastStore.get().filter((t) => t.id !== id))
	}, TOAST_EXIT_MS)
}

/** Look up a live toast by its deduplication key. */
export function findToastByUniqueID(uniqueID: string): ToastEntry | undefined {
	return toastStore.get().find((t) => t.options.uniqueID === uniqueID)
}

/** Resolved auto-hide contract: error toasts hold for manual dismissal
 *  unless `isAutoHide` overrides; info toasts auto-hide after
 *  `autoHideDuration` (default 5000ms). */
export function toastTiming(options: ToastOptions): {
	isAutoHide: boolean
	autoHideDuration: number
} {
	const type = options.type ?? 'info'
	return {
		isAutoHide: options.isAutoHide ?? type !== 'error',
		autoHideDuration: Math.max(0, options.autoHideDuration ?? 5000),
	}
}
