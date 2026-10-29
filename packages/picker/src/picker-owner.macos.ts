import type { AppKitPickerOption, AppKitPickerProps } from './macos/types'

export interface PickerPlan {
	options: readonly AppKitPickerOption[]
	selection?: string
	enabled: boolean
	accessibilityLabel: string
}
export type PickerAttach = (view: object, options: PickerPlan, selected: (id: string) => void) => { update(options: PickerPlan): void; detach(): void } | null
export type PickerStatus = 'ready' | 'empty' | 'invalid' | 'unavailable'

const sameOptions = (a: readonly AppKitPickerOption[], b: readonly AppKitPickerOption[]) => a.length === b.length && a.every((item, i) => item.id === b[i].id && item.title === b[i].title && item.disabled === b[i].disabled)
function snapshot(props: AppKitPickerProps): AppKitPickerOption[] | null {
	try {
		if (typeof props.label !== 'string' || !Array.isArray(props.options)) return null
		const ids = new Set<string>()
		return props.options.map((item) => {
			if (typeof item.id !== 'string' || typeof item.title !== 'string' || ids.has(item.id)) throw Error('invalid options')
			ids.add(item.id); return { id: item.id, title: item.title, disabled: !!item.disabled }
		})
	} catch { return null }
}

/** Retain selection IDs rather than indices; old controls cannot select new records. */
export function createPickerOwner(deps: {
	props(): AppKitPickerProps
	attach(): PickerAttach | undefined
	status?(status: PickerStatus): void
}) {
	type Session = { view: object; scope: string | undefined; applied: PickerPlan; writing: number; selecting: boolean; handle: ReturnType<PickerAttach> }
	let view: object | null = null, session: Session | null = null, disposed = false
	let scope = deps.props().id, retained = deps.props().defaultSelection, status: PickerStatus = 'empty'
	const report = (next: PickerStatus) => { if (!disposed && status !== next) { status = next; deps.status?.(next) } }
	const detach = () => { const old = session; session = null; try { old?.handle?.detach() } catch {} }
	const plan = (): PickerPlan | null => {
		const props = deps.props(), options = snapshot(props)
		const controlled = props.selection !== undefined
		if (!options || (controlled && typeof props.selection !== 'string') || (!controlled && retained !== undefined && typeof retained !== 'string')) return null
		let selection = controlled ? props.selection : retained
		if (options.length && selection !== undefined && !options.some((item) => item.id === selection)) {
			if (controlled) return null
			selection = undefined
		}
		if (!controlled && selection === undefined) selection = options.find((item) => !item.disabled)?.id
		return { options, selection: options.length ? selection : undefined, enabled: !props.disabled,
			accessibilityLabel: props.accessibilityLabel ?? props.label }
	}
	const update = () => {
		if (disposed || !view) return
		const props = deps.props()
		if (scope !== props.id) { detach(); scope = props.id; retained = props.defaultSelection }
		const options = plan()
		if (!options) { detach(); report('invalid'); return }
		if (props.selection !== undefined) retained = props.selection
		else if (options.options.length) retained = options.selection
		const nextStatus = options.options.length ? 'ready' : 'empty'
		const handle = session?.handle
		if (session && handle) {
			const owner = session; owner.writing++
			try { handle.update(options); owner.applied = options; if (session === owner) report(nextStatus) }
			catch { if (session === owner) { detach(); report('unavailable') } }
			finally { owner.writing-- }
			return
		}
		const attach = deps.attach()
		if (!attach) { report('unavailable'); return }
		const owner: Session = { view, scope, applied: options, writing: 1, selecting: false, handle: null }; session = owner
		try {
			const handle = attach(view, options, (id) => {
				if (disposed || session !== owner || owner.writing || owner.selecting || !owner.handle) return
				const current = plan()
				if (!current || deps.props().id !== owner.scope || !current.enabled || !sameOptions(owner.applied.options, current.options) || owner.applied.selection !== current.selection) { update(); return }
				const item = current.options.find((item) => item.id === id)
				if (!item || item.disabled) { update(); return }
				if (id === current.selection) return
				owner.selecting = true
				if (deps.props().selection === undefined) retained = id
				try { deps.props().onSelectionChange?.(id) }
				finally { try { update() } finally { owner.selecting = false } }
			})
			if (disposed || session !== owner) { handle?.detach(); return }
			owner.handle = handle
			if (!handle) { session = null; report('unavailable') } else report(nextStatus)
		} catch { if (session === owner) { detach(); report('unavailable') } }
		finally { owner.writing-- }
	}
	return {
		update,
		bind(next: object | null) { if (!disposed && next !== view) { detach(); view = next; if (view) update() } },
		getStatus: () => status,
		dispose() { if (!disposed) { disposed = true; detach(); view = null } },
	}
}
