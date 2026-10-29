import type { NSView } from '@octane-xplat/platform/macos'

type NativeElements<T> = readonly T[] | { readonly count: number; objectAtIndex(index: number): T } | null | undefined
function elements<T>(value: NativeElements<T>): T[] {
	if (!value) return []
	if ('objectAtIndex' in value) return Array.from({ length: value.count }, (_, index) => value.objectAtIndex(index))
	return Array.from(value)
}
interface State {
	input: NSView | null
	list: NSView | null
	active: NSView | null
	open: boolean
	blocked: boolean
}
/** Private native AX relationships for the inline AppKit suggestion list.
 * Pending list selection follows highlight; keyboard focus stays in the editor. */
export function createAppKitTypeaheadAccessibility(state: () => State, native: () => Record<string, any> = () => globalThis) {
	let owned: { input: NSView; list: NSView; window: NonNullable<NSView['window']>; inputLinks: NSView['accessibilityLinkedUIElements']; listLinks: NSView['accessibilityLinkedUIElements']; inputSelection: NSView['accessibilitySelectedChildren']; listSelection: NSView['accessibilitySelectedChildren']; active: NSView | null } | null = null
	let stopObserver: (() => void) | undefined, queued = false, disposed = false
	const release = () => {
		const previous = owned; owned = null
		if (!previous) return
		for (const restore of [
			() => { previous.input.accessibilityLinkedUIElements = previous.inputLinks ?? [] },
			() => { previous.list.accessibilityLinkedUIElements = previous.listLinks ?? [] },
			() => { previous.input.accessibilitySelectedChildren = previous.inputSelection ?? [] },
			() => { previous.list.accessibilitySelectedChildren = previous.listSelection ?? [] },
		]) { try { restore() } catch (error) { console.warn('[macos-typeahead] AX cleanup failed', error) } }
	}
	const stop = () => { const release = stopObserver; stopObserver = undefined; try { release?.() } catch (error) { console.warn('[macos-typeahead] AX observer cleanup failed', error) } }
	const hidden = (view: NSView) => ['hidden', 'hiddenOrHasHiddenAncestor'].some((name) => { const value = Reflect.get(view, name); return !!(typeof value === 'function' ? value.call(view) : value) })
	const sync = () => {
		if (disposed) return
		const current = state(), { input, list } = current
		if (!current.open || current.blocked) { release(); stop(); return }
		if (!stopObserver) {
			const host = native(), center = host.NSNotificationCenter?.defaultCenter
			if (center?.addObserverForNameObjectQueueUsingBlock && center?.removeObserver) {
				try {
					const token = center.addObserverForNameObjectQueueUsingBlock(host.NSWindowDidUpdateNotification ?? 'NSWindowDidUpdateNotification', null, null, (note: { object: unknown }) => {
						const latest = state()
						if (note.object === latest.input?.window || note.object === latest.list?.window || note.object === owned?.window) update()
					})
					if (token != null) { if (disposed) center.removeObserver(token); else stopObserver = () => center.removeObserver(token) }
				} catch (error) { console.warn('[macos-typeahead] AX attachment observation unavailable', error) }
			}
		}
		if (disposed) return
		if (!input?.window || !list || list.window !== input.window || hidden(input) || hidden(list)) { release(); return }
		if (!owned || owned.input !== input || owned.list !== list || owned.window !== input.window) {
			release()
			owned = { input, list, window: input.window, inputLinks: input.accessibilityLinkedUIElements, listLinks: list.accessibilityLinkedUIElements,
				inputSelection: input.accessibilitySelectedChildren, listSelection: list.accessibilitySelectedChildren, active: null }
			input.accessibilityLinkedUIElements = [...elements(owned.inputLinks).filter((view) => view !== list), list]
			list.accessibilityLinkedUIElements = [...elements(owned.listLinks).filter((view) => view !== input), input]
		}
		const row = current.active, active = row?.window === input.window && typeof row.isDescendantOf === 'function' && row.isDescendantOf(list) && !hidden(row) ? row : null
		if (owned.active !== active) {
			owned.active = active
			input.accessibilitySelectedChildren = active ? [active] : []
			list.accessibilitySelectedChildren = active ? [active] : []
			const host = native()
			host.NSAccessibilityPostNotification?.(list, host.NSAccessibilitySelectedChildrenChangedNotification ?? 'AXSelectedChildrenChanged')
		} else if (!active) {
			// Initial empty/awaiting results must not retain an unrelated native selection.
			input.accessibilitySelectedChildren = []; list.accessibilitySelectedChildren = []
		}
	}
	const update = () => {
		if (disposed || queued) return
		queued = true
		void Promise.resolve().then(() => { queued = false; try { sync() } catch (error) { release(); stop(); console.warn('[macos-typeahead] AX relationships failed', error) } })
	}
	return { update, dispose() { if (disposed) return; disposed = true; stop(); release() } }
}
