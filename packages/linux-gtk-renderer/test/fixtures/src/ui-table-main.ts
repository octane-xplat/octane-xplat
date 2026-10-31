import Gtk from 'gi://Gtk?version=4.0'
import GLib from 'gi://GLib'
import Gdk from 'gi://Gdk?version=4.0'
import { createGtkRoot } from '@octane-xplat/linux-gtk'
import { TableProbe, events, state } from './ui-table.gtk'

Gtk.init()

const checks: string[] = []
const failures: string[] = []
const check = (name: string, ok: boolean | unknown) => {
	checks.push(name)
	if (!ok) { failures.push(name) }
}
const osInput = GLib.getenv('GTK_TABLE_OS') === '1'

const window = new Gtk.Window({ title: 'Octane GTK Table test', default_width: 960, default_height: 1000, decorated: false })
const host = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL })
window.set_child(host)
const { root, container } = createGtkRoot(host, {})
const loop = GLib.MainLoop.new(null, false)

const pump = (ms: number) => new Promise<void>((resolve) => {
	GLib.timeout_add(GLib.PRIORITY_DEFAULT, ms, () => { resolve(); return false })
})

const nodes = (): any[] => [...(container as any).nodes.values()]
const isUnder = (node: any, rootId: string | null): boolean => {
	if (!rootId) { return true }
	for (let cur = node; cur; cur = cur.parent) {
		if (cur?.props?.id === rootId) { return true }
	}
	return false
}
const nodeHasText = (n: any, needle: string): boolean => {
	try { return JSON.stringify(n.props).includes(needle) } catch { return false }
}
const findView = (id: string): any => nodes().find((n) => n?.props?.id === id)?.view ?? null
const hasText = (needle: string, rootId: string | null = null): boolean =>
	nodes().some((n) => nodeHasText(n, needle) && isUnder(n, rootId))
const textsUnder = (rootId: string): string[] => {
	const out: string[] = []
	for (const n of nodes()) {
		if (typeof n?.props?.text === 'string' && isUnder(n, rootId)) {
			out.push(n.props.text)
		}
	}
	return out
}
const findLabel = (text: string, rootId: string | null = null): any => {
	for (const n of nodes()) {
		if (!nodeHasText(n, text) || !isUnder(n, rootId)) { continue }
		let cur = n
		while (cur && !cur.view) { cur = cur.parent }
		if (cur?.view) { return cur.view }
	}
	return null
}
const findClass = (cls: string, rootId: string | null = null): any => {
	for (const n of nodes()) {
		try {
			if (String(n.props?.className ?? '').includes(cls) && n.view && isUnder(n, rootId)) {
				return n.view
			}
		} catch { }
	}
	return null
}
const point = (widget: any): { x: number; y: number } => {
	const native = widget.get_native()
	const [ok, rect] = widget.compute_bounds(native)
	if (!ok) { throw new Error('No native input bounds') }
	const [tx, ty] = native.get_surface_transform()
	let x = rect.origin.x - tx + rect.size.width / 2
	let y = rect.origin.y - ty + rect.size.height / 2
	for (let surface = native.get_surface(); typeof surface.get_parent === 'function'; surface = surface.get_parent()) {
		x += surface.get_position_x()
		y += surface.get_position_y()
	}
	const [wx, wy] = window.get_surface_transform()
	return { x: x + wx, y: y + wy }
}

let readyResolve: (() => void) | null = null
const ready = (payload: any) => {
	print('GTK_TABLE_READY ' + JSON.stringify(payload))
	return new Promise<void>((resolve) => { readyResolve = resolve })
}
const keyCtl = new Gtk.EventControllerKey()
window.add_controller(keyCtl)
keyCtl.connect('key-pressed', (_c, keyval) => {
	if (keyval === Gdk.KEY_F12 && readyResolve) { readyResolve(); readyResolve = null }
	return false
})

const clickAt = async (widget: any, tag = '?') => {
	const c = point(widget)
	if (c.x === 0 && c.y === 0) { failures.push('degenerate-bounds:' + tag) }
	await Promise.race([ready({ x: c.x, y: c.y }), pump(2500)])
	await pump(220)
	return c
}
const yOf = (widget: any): number => {
	try {
		const [ok, rect] = widget.compute_bounds(widget.get_native())
		return ok ? rect.origin.y : Number.NaN
	} catch { return Number.NaN }
}
const clickPoint = async (c: { x: number; y: number }) => {
	await Promise.race([ready({ x: c.x, y: c.y }), pump(2500)])
	await pump(220)
}
const typeText = async (text: string) => {
	await Promise.race([ready({ type: text }), pump(2500)])
	await pump(250)
}


async function run() {
	root.render(TableProbe, {})
	await pump(50)
	window.present()
	await pump(700)

	check('Table data mode mounts', !!findView('main-table'))
	check('Table children parts mount', !!findView('parts-table'))
	check('Grouped table mounts', !!findView('group-table'))
	check('Tree table mounts', !!findView('tree-table'))
	check('Paged table mounts', !!findView('paged-table'))
	check('Settings table mounts', !!findView('settings-table'))
	check('Table parts render header/body/footer cells',
		hasText('PART H1', 'parts-table') &&
			hasText('PART A1', 'parts-table') &&
			hasText('PART F1', 'parts-table'))
	check('TableContext carries density + dividers',
		state.tableCtx?.density === 'compact' && state.tableCtx?.dividers === 'grid')
	check('Selection toolbar hidden without selection', !findLabel('Unselect All'))
	check('Row index column renders', hasText('1', 'main-table'))
	check('Row status marker renders', !!findClass('vx-table-status', 'main-table'))

	// Row expansion — chevron tap mounts the detail panel.
	const expander = findClass('vx-table-expander', 'main-table')
	if (expander) {
		const expanderPoint = point(expander)
		await clickAt(expander, 'expander')
		await pump(200)
		check('Row expansion mounts detail panel',
			hasText('DETAIL ', 'main-table') &&
				Array.isArray(state.expanded) &&
				state.expanded.length === 1)
		// Re-click the exact same spot: the detail row mounts below, so the
		// expander keeps its position while findClass ordering shifts.
		await clickPoint(expanderPoint)
		await pump(200)
		check('Row expansion collapses', !hasText('DETAIL ', 'main-table'))
	}

	// Sortable — header tap cycles asc → desc; rows reorder.
	const sortBtn = findClass('vx-table-sort-button', 'main-table')
	if (sortBtn) {
		await clickAt(sortBtn, 'sort-asc')
		await pump(250)
		check('Sort click applies ascending',
			String(state.sortChange ?? '').includes('ascending'))
		// Positional order: compare cell bounds — the nodes map does not
		// track visual row order across re-sorts.
		const yAscA = yOf(findLabel('Alfred', 'main-table'))
		const yAscZ = yOf(findLabel('Zeta', 'main-table'))
		check('Rows reorder ascending', yAscA >= 0 && yAscA < yAscZ)
		const sortBtn2 = findClass('vx-table-sort-button', 'main-table')
		if (sortBtn2) {
			await clickAt(sortBtn2, 'sort-desc')
			await pump(250)
			check('Second sort click applies descending',
				String(state.sortChange ?? '').includes('descending'))
			const yDescA = yOf(findLabel('Alfred', 'main-table'))
			const yDescZ = yOf(findLabel('Zeta', 'main-table'))
			check('Rows reorder descending', yDescZ >= 0 && yDescZ < yDescA)
		}
	}

	// Selection — row checkbox selects; toolbar reflects count; select-all
	// covers all rows; 'Unselect All' clears.
	const rowCheckbox = findLabel('Select row', 'main-table')
	if (rowCheckbox) {
		await clickAt(rowCheckbox, 'row-check')
		await pump(250)
		check('Row checkbox selects one row',
			state.selectionCount === 1 && hasText('1 selected'))
		check('Selection toolbar appears with selection', !!findLabel('Unselect All'))
	}
	const selectAll = findLabel('Select all rows', 'main-table')
	if (selectAll) {
		await clickAt(selectAll, 'select-all')
		await pump(250)
		check('Header checkbox selects all rows', state.selectionCount === 4)
		check('Selected row gains class',
			!!findClass('vx-table-row--selected', 'main-table'))
	}
	const unselectAll = findLabel('Unselect All')
	if (unselectAll) {
		await clickAt(unselectAll, 'unselect-all')
		await pump(250)
		check('Toolbar Unselect All clears selection',
			state.selectionCount === 0 && !findLabel('Unselect All'))
	}

	// Grouped rows — header row toggles the section.
	check('Group headers render', hasText('eng (2)', 'group-table'))
	const engHeader = findLabel('eng (2)', 'group-table')
	if (engHeader) {
		await clickAt(engHeader, 'group-eng')
		await pump(250)
		check('Group header toggles collapse',
			Array.isArray(state.collapsedGroups) && state.collapsedGroups.includes('eng'))
		check('Collapsed group hides rows', !hasText('Zeta', 'group-table'))
		await clickAt(findLabel('eng (2)', 'group-table') ?? engHeader, 'group-eng-2')
		await pump(250)
		check('Group expands again', hasText('Zeta', 'group-table'))
	}

	// Tree rows — expander tap mounts child rows.
	const treeExpander = findClass('vx-table-expander', 'tree-table')
	if (treeExpander) {
		await clickAt(treeExpander, 'tree-expander')
		await pump(250)
		check('Tree expander mounts child rows',
			hasText('CHILD ROW A', 'tree-table') &&
				hasText('CHILD ROW B', 'tree-table') &&
				Array.isArray(state.treeExpanded) &&
				state.treeExpanded.includes('r1'))
	}

	// Pagination — clicking page 2 swaps the page slice.
	const pageTwo = findLabel('2', 'paged-table')
	if (pageTwo) {
		await clickAt(pageTwo, 'page-2')
		await pump(250)
		check('Pagination swaps page data',
			state.page === 2 && hasText('Mira', 'paged-table') && !hasText('Zeta', 'paged-table'))
	}

	// Column settings — toggle hides/shows the team column.
	const colToggle = findView('col-toggle')
	if (colToggle) {
		await clickAt(colToggle, 'col-toggle')
		await pump(250)
		check('Column settings toggle hides column',
			!hasText('STEAM', 'settings-table') &&
				Array.isArray(state.columnKeys) &&
				!state.columnKeys.includes('team'))
		await clickAt(findView('col-toggle') ?? colToggle, 'col-toggle-2')
		await pump(250)
		check('Column settings toggle restores column',
			hasText('STEAM', 'settings-table') && state.columnKeys.includes('team'))
	}

	// Filtering — popover trigger opens the editor; typing + Apply filters rows.
	const filterTrigger = findLabel('Filter NAME', 'main-table')
	if (filterTrigger) {
		await clickAt(filterTrigger, 'filter-open')
		await pump(300)
		check('Filter popover opens', hasText('Apply'))
		const field = findLabel('Filter…')
		if (field) {
			await clickAt(field, 'filter-field')
			await typeText('al')
			const apply = findLabel('Apply')
			if (apply) {
				await clickAt(apply, 'filter-apply')
				await pump(300)
				check('Applied filter narrows rows',
					String(state.filterApplied ?? '').includes('al') &&
						hasText('Alfred', 'main-table') &&
						!hasText('Zeta', 'main-table'))
			}
		}
		// Reset clears the filter again.
		const trigger2 = findLabel('Filter NAME', 'main-table')
		if (trigger2) {
			await clickAt(trigger2, 'filter-reopen')
			await pump(300)
			const reset = findLabel('Reset')
			if (reset) {
				await clickAt(reset, 'filter-reset')
				await pump(300)
				check('Filter reset restores rows', hasText('Zeta', 'main-table'))
			}
		}
	}

	const result = {
		checks: checks.length,
		failures,
		osInput,
		gtk: Gtk.get_major_version() + '.' + Gtk.get_minor_version(),
		events: events.slice(0, 40),
	}
	print('GTK_TABLE ' + JSON.stringify(result))
	loop.quit()
}

run().catch((e) => {
	print('GTK_TABLE_FATAL ' + String(e?.message ?? e) + ' | ' + String(e?.stack ?? ''))
	loop.quit()
})
loop.run()
