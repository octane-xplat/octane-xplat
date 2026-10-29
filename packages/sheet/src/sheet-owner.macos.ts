import type { AppKitSheetProps } from './macos/types'

export interface SheetHandle {
	target: unknown
	readonly presented: boolean
	present(): boolean
	close(): void
}
export type SheetPrepare = (view: object, options: { onDismissed(): void; onUnavailable(): void }) => SheetHandle | null
export type SheetStatus = 'idle' | 'ready' | 'unavailable'

/** The declaring tree owns the portal; only its current native session may end it. */
export function createSheetOwner(deps: {
	props(): AppKitSheetProps
	prepare(): SheetPrepare | undefined
	changed(): void
}) {
	type Session = { view: object; scope: string | undefined; handle?: SheetHandle; committed: boolean }
	let view: object | null = null, session: Session | null = null, disposed = false
	let completed = false, scope = deps.props().id, status: SheetStatus = 'idle'
	const report = (next: SheetStatus) => { status = next; if (!disposed) deps.changed() }
	const retire = () => {
		const old = session; session = null
		const didPresent = old?.handle?.presented ?? false
		try { old?.handle?.close() } catch {}
		return didPresent
	}
	const update = () => {
		if (disposed) return
		const props = deps.props()
		if (scope !== props.id) { scope = props.id; completed = false; retire() }
		if (!props.open) {
			completed = false
			const didPresent = retire()
			if (status !== 'idle') report('idle')
			if (didPresent) deps.props().onDismissed?.()
			return
		}
		if (!view || completed || session) return
		const current: Session = { view, scope, committed: false }; session = current
		const terminal = (failed: boolean) => {
			if (disposed || session !== current || !current.handle) return
			completed = true; retire(); report(failed ? 'unavailable' : 'idle')
			if (!failed && deps.props().id === current.scope) deps.props().onDismissed?.()
		}
		try {
			const handle = deps.prepare()?.(view, { onDismissed: () => terminal(false), onUnavailable: () => terminal(true) })
			if (disposed || session !== current) { handle?.close(); return }
			if (!handle?.target) { handle?.close(); session = null; completed = true; report('unavailable'); return }
			current.handle = handle; report('ready')
		} catch { if (session === current) { completed = true; retire(); report('unavailable') } }
	}
	return {
		update,
		bind(next: object | null) {
			if (disposed || view === next) return
			retire(); view = next; completed = false
			if (view) update()
		},
		commit(target: unknown) {
			const current = session, props = deps.props()
			if (!current?.handle || current.committed || current.handle.target !== target) return
			if (!props.open || props.id !== current.scope) { update(); return }
			current.committed = true
			try { if (current.handle.present()) return } catch {}
			if (session === current) { completed = true; retire(); report('unavailable') }
		},
		getTarget: () => session?.handle?.target ?? null,
		getStatus: () => status,
		dispose() { if (!disposed) { disposed = true; retire(); view = null } },
	}
}
