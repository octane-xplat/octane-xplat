import type { AppKitContextMenuItem, AppKitContextMenuProps } from './macos/types'

export type ContextMenuAttach = (view: object, options: { items: readonly AppKitContextMenuItem[] }, onSelect: (id: string | undefined) => void) => (() => void) | null
export type ContextMenuStatus = 'ready' | 'empty' | 'invalid' | 'unavailable'

/** Copy primitive content so in-place item changes cannot rewrite an old menu. */
function menuSnapshot(items: readonly AppKitContextMenuItem[] = []): AppKitContextMenuItem[] | null {
	const ids = new Set<string>()
	try {
		return items.map((item) => {
			if (typeof item.id !== 'string' || typeof item.title !== 'string' || ids.has(item.id)) throw Error('invalid menu')
			ids.add(item.id)
			return { id: item.id, title: item.title, disabled: !!item.disabled, divider: !!item.divider, destructive: !!item.destructive }
		})
	} catch { return null }
}
const sameMenuItems = (a: readonly AppKitContextMenuItem[], b: readonly AppKitContextMenuItem[]) => a.length === b.length && a.every((item, i) => {
	const other = b[i]
	return item.id === other.id && item.title === other.title && item.disabled === other.disabled && item.divider === other.divider && item.destructive === other.destructive
})

/** Current native menu session; callback-only renders preserve its tracking menu. */
export function createContextMenuOwner(deps: {
	props(): AppKitContextMenuProps
	attach(): ContextMenuAttach | undefined
	status?(status: ContextMenuStatus): void
}) {
	type Session = { view: object; scope: string | undefined; items: AppKitContextMenuItem[]; ready: boolean; selecting: boolean; detach?: () => void }
	let view: object | null = null, session: Session | null = null, disposed = false
	let status: ContextMenuStatus = 'empty'
	const report = (next: ContextMenuStatus) => { if (!disposed && next !== status) { status = next; deps.status?.(next) } }
	const detach = () => { const old = session; session = null; try { old?.detach?.() } catch {} }
	const update = () => {
		if (disposed || !view) return
		const props = deps.props(), items = menuSnapshot(props.items)
		if (!items) { detach(); report('invalid'); return }
		if (!items.length) { detach(); report('empty'); return }
		if (session && session.view === view && session.scope === props.id && sameMenuItems(session.items, items)) return
		detach()
		const attach = deps.attach()
		if (!attach) { report('unavailable'); return }
		const owner: Session = { view, scope: props.id, items, ready: false, selecting: false }
		session = owner
		try {
			const cleanup = attach(view, { items }, (id) => {
				if (disposed || session !== owner || !owner.ready || owner.selecting || typeof id !== 'string') return
				const current = deps.props(), currentItems = menuSnapshot(current.items)
				if (!currentItems || current.id !== owner.scope || !sameMenuItems(owner.items, currentItems)) { update(); return }
				const item = currentItems.find((item) => item.id === id)
				if (!item || item.disabled) return
				owner.selecting = true
				try { current.onItemSelected?.(id) } finally { owner.selecting = false }
			})
			if (disposed || session !== owner) { cleanup?.(); return }
			if (typeof cleanup !== 'function') { session = null; report('unavailable'); return }
			owner.detach = cleanup; owner.ready = true; report('ready')
		} catch { if (session === owner) { detach(); report('unavailable') } }
	}
	return {
		update,
		bind(next: object | null) { if (!disposed && next !== view) { detach(); view = next; if (view) update() } },
		dispose() { if (!disposed) { disposed = true; detach(); view = null } },
		getStatus: () => status,
	}
}
