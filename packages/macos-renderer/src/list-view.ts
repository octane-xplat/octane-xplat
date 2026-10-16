import {
	defineUniversalComponent,
	universalPlan,
	universalValue,
	type UniversalRenderable,
	type UniversalRoot,
} from 'octane/universal/native'

import { NSIndexSet, NSObject, NSScrollView, NSTableColumn, NSTableColumnResizingOptions, NSTableView, NSTableViewColumnAutoresizingStyle, NSTableViewDataSource, NSTableViewDelegate, NSTableViewGridLineStyle, NSView, interop } from '@octane-xplat/platform/macos'
import type { NSColor } from '@octane-xplat/platform/macos'

import { listFactory, parseListTemplate } from './list-template'

type View = NSView & Record<string, any>
type Props = Record<string, any>
let nextPortalCellId = 0

interface Cell {
	rowView?: NSView
	portalId?: number
	portalGeneration?: number
	portalItem?: any
	portalActive?: boolean
	portalNotify?: (event: any) => void
	host: View
	root: UniversalRoot | null
	factoryView: View | null
	index: number
	mode: 'render' | 'factory' | 'string' | 'default' | null
}

interface ListState {
	view: View
	table: View
	delegate: NSObject
	props: Props
	cells: Set<Cell>
	count: number
	closed: boolean
	stopItems?: () => void
	createRoot: (host: NSView) => UniversalRoot
	releaseOwnedRoot: (host: NSView) => void
	color: (value: any) => NSColor
	defaultSeparator: NSColor
}

const states = new WeakMap<object, ListState>()
const cellsByHost = new WeakMap<object, Cell>()
const factoryOwners = new WeakMap<object, Cell>()
const CellContent = defineUniversalComponent<{ render: () => UniversalRenderable }>(
	'macos',
	(props) => props.render(),
)

const defaultPlan = universalPlan('macos', { kind: 'host', type: 'label', bindings: [['text', 0]] })

function itemAt(state: ListState, index: number) {
	const source = state.props.items
	return typeof source?.getItem === 'function' ? source.getItem(index) : source?.[index]
}

function releasePortal(cell: Cell) {
	if (!cell.portalActive) return
	cell.portalActive = false
	cell.portalNotify?.({ type: 'release', id: cell.portalId, generation: cell.portalGeneration })
	cell.portalNotify = undefined
}

function clearContent(state: ListState, cell: Cell) {
	releasePortal(cell)
	cell.root?.unmount()
	cell.root = null
	if (cell.factoryView) {
		const host = cell.factoryView
		factoryOwners.delete(host)
		state.releaseOwnedRoot(host)
		host.bindingContext = undefined
		host.removeFromSuperview()
		cell.factoryView = null
	}

	cell.mode = null
}

function bind(state: ListState, cell: Cell, index: number) {
	const item = itemAt(state, index),
		props = state.props

	const factory = listFactory(props)
	const mode = props.renderItem
		? 'render'
		: factory
			? 'factory'
			: props.itemTemplate
				? 'string'
				: 'default'

	if (cell.mode !== mode || mode === 'factory') {
		clearContent(state, cell)
	}

	cell.mode = mode
	cell.index = index
	cell.host.bindingContext = item
	if (mode === 'factory') {
		const host = factory!() as View
		if (!(host instanceof NSView)) {
			throw new TypeError(
				'[macos-host] listview template factory must return an AppKit NSView host',
			)
		}

		if (factoryOwners.has(host)) {
			throw new TypeError(
				'[macos-host] listview template factory returned a host already owned by another cell',
			)
		}

		factoryOwners.set(host, cell)
		cell.factoryView = host
		host.bindingContext = item
		host.removeFromSuperview()
		host.translatesAutoresizingMaskIntoConstraints = false
		cell.host.addSubview(host)
		for (const axis of ['leading', 'trailing', 'top', 'bottom']) {
			host[axis + 'Anchor'].constraintEqualToAnchor(cell.host[axis + 'Anchor']).active = true
		}
	} else if (mode === 'render' && props.__onCellTarget) {
		if (cell.root) {
			cell.root.unmount()
			cell.root = null
		}
		const changed =
			!cell.portalActive || !Object.is(cell.portalItem, item) || cell.host.__portalIndex !== index
		cell.portalId ??= nextPortalCellId++
		if (changed) cell.portalGeneration = (cell.portalGeneration ?? 0) + 1
		cell.portalActive = true
		cell.portalItem = item
		cell.host.__portalIndex = index
		cell.portalNotify = props.__onCellTarget
		cell.portalNotify?.({
			type: 'bind',
			id: cell.portalId,
			generation: cell.portalGeneration,
			target: cell.host,
			item,
			index,
		})
	} else {
		releasePortal(cell)
		cell.root ??= state.createRoot(cell.host)
		cell.root.render(CellContent, {
			render: () =>
				mode === 'render'
					? props.renderItem(item, index)
					: mode === 'string'
						? parseListTemplate(props.itemTemplate).render(item)
						: universalValue(defaultPlan, [item == null ? '' : String(item)]),
		})
	}

	const event = Object.freeze({
		eventName: 'itemLoading',
		object: state.view,
		index,
		view: cell.host,
	})

	props.onItemLoading?.(event)
}

function cellFor(state: ListState, index: number) {
	let cell = [...state.cells].find((entry) => entry.index === index)
	if (!cell) {
		const host = state.table.makeViewWithIdentifierOwner(
			'xplat-list-cell',
			state.delegate,
		) as View | null

		cell = host ? cellsByHost.get(host) : undefined
		if (!cell) {
			const host = NSView.alloc().initWithFrame({
				origin: { x: 0, y: 0 },
				size: { width: 200, height: 24 },
			}) as View

			host.identifier = 'xplat-list-cell'
			cell = { host, root: null, factoryView: null, index: -1, mode: null }
			state.cells.add(cell)
			cellsByHost.set(host, cell)
		}
	}

	bind(state, cell, index)
	return cell
}

const ListDelegate = NSObject.extend(
	{
		// AppKit validates this selector even when the delegate supplies row views.
		['tableView:objectValueForTableColumn:row:'](
			_table: NSView,
			_column: unknown,
			_row: number,
		): any {
			return null
		},
		['numberOfRowsInTableView:'](table: NSView): number {
			return states.get(table)?.count ?? 0
		},
		['tableView:viewForTableColumn:row:'](table: NSView, _column: unknown, row: number): NSView {
			const state = states.get(table)!
			if (state.closed || row < 0 || row >= state.count) {
				return NSView.alloc().init()
			}

			return cellFor(state, row).host
		},
		['tableView:didAddRowView:forRow:'](table: NSView, rowView: NSView, row: number) {
			const host = (rowView as any).viewAtColumn?.(0)
			const cell = host && cellsByHost.get(host)
			if (cell) cell.rowView = rowView
			const state = states.get(table)
			if (state && !state.closed && row >= 0 && row === state.count - 1) {
				state.props.onLoadMoreItems?.({ eventName: 'loadMoreItems', object: state.view })
			}
		},
		['tableView:didRemoveRowView:forRow:'](table: NSView, rowView: any, row: number) {
			const state = states.get(table),
				host = rowView.viewAtColumn(0)

			const cell = host && cellsByHost.get(host)
			if (state && cell && cell.index === row && (!cell.rowView || cell.rowView === rowView)) {
				cell.rowView = undefined
				// renderItem roots retain their tree for the next recycled binding.
				// Callable templates own an independent root; release it immediately.
				if (cell.mode === 'factory') {
					clearContent(state, cell)
				}

				releasePortal(cell)
				cell.index = -1
				cell.host.bindingContext = undefined
			}
		},
		['itemClicked:'](table: any) {
			const state = states.get(table)
			const index =
				Number(table.clickedRow) >= 0 ? Number(table.clickedRow) : Number(table.selectedRow)

			if (!state || state.closed || index < 0 || index >= state.count) {
				return
			}

			const cell = [...state.cells].find((cell) => cell.index === index)
			if (cell) {
				state.props.onItemTap?.(
					Object.freeze({ eventName: 'itemTap', object: state.view, index, view: cell.host }),
				)
			}
		},
	},
	{
		name: 'XplatRawListViewDelegate',
		protocols: [NSTableViewDataSource, NSTableViewDelegate],
		exposedMethods: {
			'itemClicked:': { returns: interop.types.void, params: [NSObject] },
			'numberOfRowsInTableView:': { returns: interop.types.int64, params: [NSObject] },
			'tableView:objectValueForTableColumn:row:': {
				returns: interop.types.id,
				params: [NSObject, NSObject, interop.types.int64],
			},
			'tableView:viewForTableColumn:row:': {
				returns: interop.types.id,
				params: [NSObject, NSObject, interop.types.int64],
			},
			'tableView:didAddRowView:forRow:': {
				returns: interop.types.void,
				params: [NSObject, NSObject, interop.types.int64],
			},
			'tableView:didRemoveRowView:forRow:': {
				returns: interop.types.void,
				params: [NSObject, NSObject, interop.types.int64],
			},
		},
	},
)

/** Create the raw scroll/table host; weak native delegate edges have a retained JS owner. */
export function makeListView(
	deps: Pick<ListState, 'createRoot' | 'releaseOwnedRoot' | 'color'>,
): NSView {
	const view = NSScrollView.alloc().initWithFrame({
		origin: { x: 0, y: 0 },
		size: { width: 200, height: 200 },
	}) as View

	view.translatesAutoresizingMaskIntoConstraints = false
	view.hasVerticalScroller = true
	view.hasHorizontalScroller = false
	view.borderType = 0
	const table = NSTableView.alloc().initWithFrame({
		origin: { x: 0, y: 0 },
		size: { width: 200, height: 200 },
	}) as View

	table.headerView = null
	table.columnAutoresizingStyle = NSTableViewColumnAutoresizingStyle.LastColumnOnlyAutoresizingStyle
	table.gridStyleMask = NSTableViewGridLineStyle.SolidHorizontalGridLineMask
	table.intercellSpacing = { width: 0, height: 1 }
	table.usesAutomaticRowHeights = true
	table.rowHeight = 24
	const column = NSTableColumn.alloc().initWithIdentifier('default')
	column.width = 200
	column.resizingMask = NSTableColumnResizingOptions.AutoresizingMask
	table.addTableColumn(column)
	const delegate = ListDelegate.alloc().init()
	const state: ListState = {
		...deps,
		view,
		table,
		delegate,
		props: {},
		cells: new Set(),
		count: 0,
		closed: false,
		defaultSeparator: table.gridColor,
	}

	states.set(table, state)
	states.set(view, state)
	table.dataSource = delegate
	table.delegate = delegate
	table.target = delegate
	table.action = 'itemClicked:'
	view.documentView = table
	return view
}

/** Complete next props, including explicit clears from the renderer. */
export function updateListView(view: NSView, props: Props) {
	const state = states.get(view)!
	const previous = state.props
	state.props = props
	state.table.gridColor =
		props.separatorColor == null ? state.defaultSeparator : state.color(props.separatorColor)

	if (previous.items !== props.items) {
		state.stopItems?.()
		state.stopItems = undefined
		const source = props.items
		if (typeof source?.on === 'function' && typeof source.off === 'function') {
			const changed = () => {
				if (!state.closed) {
					refreshList(state)
				}
			}

			source.on('change', changed)
			state.stopItems = () => source.off('change', changed)
		}
	}

	refreshList(state)
}

function refreshList(state: ListState) {
	const count = Number(state.props.items?.length ?? 0),
		previousCount = state.count

	state.count = count
	for (const cell of state.cells) {
		if (cell.index >= count) {
			clearContent(state, cell)
			cell.index = -1
			cell.host.bindingContext = undefined
		} else if (cell.index >= 0) {
			bind(state, cell, cell.index)
		}
	}

	// Same-count rebinds preserve the native cell and its root. Structural item
	// changes ask AppKit to recycle cells and recompute row geometry.
	if (count !== previousCount) {
		state.table.reloadData()
	} else {
		state.table.noteHeightOfRowsWithIndexesChanged(
			NSIndexSet.indexSetWithIndexesInRange({ location: 0, length: count }),
		)
	}
}

export function disposeListView(view: NSView) {
	const state = states.get(view)
	if (!state || state.closed) {
		return
	}

	state.closed = true
	state.stopItems?.()
	state.stopItems = undefined
	state.table.delegate = null
	state.table.dataSource = null
	state.table.target = null
	state.table.action = null
	states.delete(state.table)
	states.delete(view)
	for (const cell of state.cells) {
		clearContent(state, cell)
		cell.host.bindingContext = undefined
		cell.host.removeFromSuperview()
		cellsByHost.delete(cell.host)
	}

	state.cells.clear()
	state.props = {}
	state.count = 0
	state.table.reloadData()
	state.view.documentView = null
}
