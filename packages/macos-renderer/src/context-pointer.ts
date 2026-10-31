interface PointerView { window?: any; superview?: PointerView | null; [key: string]: any }

/** One process-local pointer monitor, with observation before context consumption. */
export function createAppKitContextPointerDispatcher<View extends PointerView>(
	hit: (event: any) => View | null,
	native: () => Record<string, any> = () => globalThis,
) {
	const owners = new Map<PointerView, Set<(target: View) => boolean>>()
	const observers = new Set<(event: { type: number; modifierFlags: number }) => void>()
	const dispatched = new WeakMap<object, { handled: boolean }>()
	let token: unknown, events: any, failed = false
	const available = () => !failed && typeof native().NSEvent?.addLocalMonitorForEventsMatchingMaskHandler === 'function' &&
		typeof native().NSEvent?.removeMonitor === 'function'
	const dispatch = (event: any) => {
		const previous = dispatched.get(event)
		if (previous) {return previous}
		const result = { handled: false }; dispatched.set(event, result)
		const type = Number(event.type), flags = Number(event.modifierFlags ?? 0)
		if (![1, 3, 25].includes(type)) {return result}
		for (const notify of [...observers]) {
			if (!observers.has(notify)) {continue}
			try { notify({ type, modifierFlags: flags }) }
			catch (error) { console.error('[macos-context] pointer observer failed', error) }
		}
		const controlPrimary = type === 1 && Boolean(flags & (1 << 18)) && !(flags & ((1 << 17) | (1 << 19) | (1 << 20)))
		if ((type !== 3 && !controlPrimary) || !owners.size || !event.window) {return result}
		let target: View | null
		try { target = hit(event) }
		catch (error) { console.error('[macos-context] hit-test failed', error); return result }
		if (!target) {return result}
		for (let view: PointerView | null = target; view && view.window === event.window; view = view.superview ?? null) {
			const owned = owners.get(view)
			for (const handler of [...(owned ?? [])]) {
				if (owners.get(view) !== owned || !owned?.has(handler)) {continue}
				try { result.handled = handler(target) === true }
				catch (error) { console.error('[macos-context] handler failed', error); result.handled = true }
				if (result.handled) {return result}
			}
		}
		return result
	}
	const release = () => {
		if (token != null) { const old = token; token = undefined; events.removeMonitor(old) }
	}
	const ensure = () => {
		if (!owners.size && !observers.size) { release(); return }
		if (token != null || !available()) {return}
		try {
			const host = native(); events = host.NSEvent
			const mask = (host.NSEventMask?.LeftMouseDown ?? 2) | (host.NSEventMask?.RightMouseDown ?? 8) | (host.NSEventMask?.OtherMouseDown ?? 33554432)
			token = events.addLocalMonitorForEventsMatchingMaskHandler(mask, (event: any) => dispatch(event).handled ? null : event)
			if (token == null) {throw new Error('AppKit pointer monitor unavailable')}
		} catch { failed = true }
	}
	return {
		available, dispatch,
		subscribe(view: View, handler: (target: View) => boolean): () => void {
			let owned = owners.get(view)
			if (!owned) { owned = new Set(); owners.set(view, owned) }
			const bucket = owned, entry = (target: View) => handler(target)
			bucket.add(entry); ensure()
			let active = true
			return () => {
				if (!active) {return}
				active = false; bucket.delete(entry)
				if (!bucket.size && owners.get(view) === bucket) {owners.delete(view)}
				ensure()
			}
		},
		observe(notify: (event: { type: number; modifierFlags: number }) => void): () => void {
			const entry = (event: { type: number; modifierFlags: number }) => notify(event)
			observers.add(entry); ensure()
			return () => { observers.delete(entry); ensure() }
		},
		dispose() { owners.clear(); observers.clear(); release() },
	}
}
