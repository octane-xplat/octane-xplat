/** @jsxImportSource @octane-xplat/jsx/dom */
// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, createRoot, useState } from 'octane'
import { Table } from '../Table.web.tsrx'
import { useTableGroupedRows } from './use-table-grouped-rows'
import { useTableRowIndex } from './use-table-row-index'
import { useTableRowStatus } from './use-table-row-status'
import { useTableRowExpansion } from './use-table-row-expansion'
import { useTableTreeState } from './use-table-tree-state'
import { useTableTreeData } from './use-table-tree-data'
import { proportional, pixel } from './column-utils'
import type { TableColumn } from '../props'

const roots: any[] = []
function mount(node: any) {
	const el = document.createElement('div')
	document.body.append(el)
	const root = createRoot(el)
	roots.push(root)
	act(() => root.render(node))
	return el
}

const click = (host: Element) =>
	act(() => host.dispatchEvent(new MouseEvent('click', { bubbles: true })))

afterEach(() => {
	for (const root of roots.splice(0)) {
		act(() => root.unmount())
	}

	document.body.innerHTML = ''
})

// =============================================================================
// Grouped rows
// =============================================================================

interface Person extends Record<string, unknown> {
	id: string
	name: string
	team: string
}

const people: Person[] = [
	{ id: '1', name: 'Ava', team: 'Design' },
	{ id: '2', name: 'Liam', team: 'Design' },
	{ id: '3', name: 'Max', team: 'Infra' },
]

const personCols: TableColumn<Person>[] = [{ key: 'name', header: 'Name', width: proportional(1) }]

function GroupedTable(props: {
	collapsedGroups?: Set<string>
	onToggle?: (k: string) => void
}) @{
	const grouped = useTableGroupedRows<Person>({
		data: people,
		groupBy: (p) => p.team,
		collapsedGroups: props.collapsedGroups ?? new Set(),
		onToggleGroup: props.onToggle ?? (() => {}),
		getRowKey: (p) => p.id,
	})

	<Table
		data={grouped.data}
		columns={personCols}
		idKey={grouped.idKey}
		plugins={{ grouped: grouped.plugin }}
	/>
}

describe('useTableGroupedRows', () => {
	it('flattens data into header + member rows in first-seen order', () => {
		const el = mount(<GroupedTable />)
		const rows = el.querySelectorAll('tbody tr')
		expect(rows.length).toBe(5) // header + 2 + header + 1
		const headers = el.querySelectorAll('.vx-table-row--group-header')
		expect(headers.length).toBe(2)
		expect(headers[0]!.textContent).toContain('Design')
		expect(headers[0]!.textContent).toContain('(2)')
		expect(headers[1]!.textContent).toContain('Infra')
	})

	it('header row renders one spanning cell with a chevron toggle', () => {
		const el = mount(<GroupedTable />)
		const header = el.querySelector('.vx-table-row--group-header')!
		const cells = header.querySelectorAll('td')
		expect(cells.length).toBe(1)
		expect(cells[0]!.getAttribute('colspan')).toBe('999')
		expect(header.getAttribute('aria-expanded')).toBe('true')
		const chevron = header.querySelector('button.vx-table-chevron')!
		expect(chevron.getAttribute('aria-label')).toBe('Collapse group Design')
	})

	it('chevron click toggles the group via onToggleGroup', () => {
		const onToggle = vi.fn()
		const el = mount(<GroupedTable onToggle={onToggle} />)
		click(el.querySelector('.vx-table-row--group-header button.vx-table-chevron')!)
		expect(onToggle).toHaveBeenCalledWith('Design')
	})

	it('collapsed groups keep the header and hide member rows', () => {
		const el = mount(<GroupedTable collapsedGroups={new Set(['Design'])} />)
		const rows = el.querySelectorAll('tbody tr')
		expect(rows.length).toBe(3) // Design header + Infra header + Max
		const header = el.querySelector('.vx-table-row--group-header')!
		expect(header.getAttribute('aria-expanded')).toBe('false')
		expect(header.querySelector('button')!.getAttribute('aria-label')).toBe('Expand group Design')
		expect(el.textContent).not.toContain('Ava')
	})

	it('row click toggles via htmlProps.onClick', () => {
		const onToggle = vi.fn()
		const el = mount(<GroupedTable onToggle={onToggle} />)
		click(el.querySelectorAll('.vx-table-row--group-header')[1]!)
		expect(onToggle).toHaveBeenCalledWith('Infra')
	})
})

// =============================================================================
// Row index
// =============================================================================

function RowIndexTable(props: { data: Person[] }) @{
	const rowIndex = useTableRowIndex<Person>({ data: props.data })

	<Table data={props.data} columns={personCols} idKey="id" plugins={{ rowIndex }} />
}

describe('useTableRowIndex', () => {
	it('prepends a monospaced ordinal column following data order', () => {
		const data = [...people].reverse()
		const el = mount(<RowIndexTable data={data} />)
		const indexCells = el.querySelectorAll('tbody .vx-table-rowindex')
		expect(indexCells.length).toBe(3)
		expect([...indexCells].map((c) => c.textContent)).toEqual(['1', '2', '3'])
		expect(el.querySelector('thead th')!.textContent).toContain('#')
	})
})

// =============================================================================
// Row status
// =============================================================================

interface Job extends Record<string, unknown> {
	id: string
	name: string
	state: string
}

const jobs: Job[] = [
	{ id: 'j1', name: 'build', state: 'failed' },
	{ id: 'j2', name: 'lint', state: 'running' },
	{ id: 'j3', name: 'tests', state: 'succeeded' },
	{ id: 'j4', name: 'deploy', state: 'queued' },
]

const jobCols: TableColumn<Job>[] = [{ key: 'name', header: 'Job', width: proportional(1) }]

function statusFor(job: Job) {
	switch (job.state) {
		case 'failed':
			return { status: 'error', label: 'Failed' } as const
		case 'running':
			return { color: 'warning', icon: 'clock', label: 'Running' } as const
		case 'queued':
			return { color: 'gray', label: 'Queued' } as const
		case 'succeeded':
			return { status: 'success', label: 'Succeeded' } as const
	}

	return null
}

function RowStatusTable() @{
	const rowStatus = useTableRowStatus<Job>({ getStatus: statusFor })

	<Table data={jobs} columns={jobCols} idKey="id" plugins={{ rowStatus }} />
}

describe('useTableRowStatus', () => {
	it('renders labelled markers for semantic, icon+color, and dot statuses', () => {
		const el = mount(<RowStatusTable />)
		const markers = el.querySelectorAll('[role="image"][aria-label]')
		expect(markers.length).toBe(4)
		expect(markers[0]!.getAttribute('aria-label')).toBe('Failed')
		expect(markers[1]!.getAttribute('aria-label')).toBe('Running')
		expect(markers[2]!.getAttribute('aria-label')).toBe('Succeeded')
		// color-only → 8px dot
		expect(markers[3]!.querySelector('.vx-table-status-dot')).not.toBeNull()
		// semantic + icon → svg glyph
		expect(markers[0]!.querySelector('svg')).not.toBeNull()
		expect(markers[1]!.querySelector('svg')).not.toBeNull()
	})
})

// =============================================================================
// Row expansion
// =============================================================================

interface Order extends Record<string, unknown> {
	id: string
	customer: string
	detail: string
}

const orders: Order[] = [
	{ id: 'ord-1', customer: 'Ada', detail: 'keyboard' },
	{ id: 'ord-2', customer: 'Alan', detail: 'cable' },
]

const orderCols: TableColumn<Order>[] = [
	{ key: 'customer', header: 'Customer', width: proportional(1) },
]

function ExpansionTable() @{
	const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set(['ord-1']))
	const expansion = useTableRowExpansion<Order>({
		expandedKeys,
		onToggle: (key) =>
			setExpandedKeys((prev: Set<string>) => {
				const next = new Set(prev)
				if (next.has(key)) {
					next.delete(key)
				} else {
					next.add(key)
				}

				return next
			}),
		getRowKey: (o) => o.id,
		renderExpanded: (o) => <span class="detail">{o.detail}</span>,
	})

	<Table data={orders} columns={orderCols} idKey="id" plugins={{ expansion }} />
}

describe('useTableRowExpansion', () => {
	it('renders the detail panel after an expanded row and toggles', () => {
		const el = mount(<ExpansionTable />)
		const panel = el.querySelector('tr.vx-table-expanded-row')
		expect(panel).not.toBeNull()
		expect(panel!.textContent).toContain('keyboard')
		// panel sits directly after its row in the body
		const rows = [...el.querySelectorAll('tbody tr')]
		expect(rows.indexOf(panel as Element)).toBe(1)
		expect(rows[0]!.textContent).toContain('Ada')

		// collapse ord-1 via its chevron
		click(el.querySelector('button.vx-table-expander')!)
		expect(el.querySelector('tr.vx-table-expanded-row')).toBeNull()

		// expand ord-2 via the second row's chevron
		click(el.querySelectorAll('button.vx-table-expander')[1]!)
		expect(el.querySelector('tr.vx-table-expanded-row')!.textContent).toContain('cable')
	})
})

// =============================================================================
// Tree
// =============================================================================

interface FileNode extends Record<string, unknown> {
	id: string
	name: string
	children?: FileNode[]
}

const fileTree: FileNode[] = [
	{
		id: 'src',
		name: 'src',
		children: [
			{
				id: 'src/components',
				name: 'components',
				children: [{ id: 'src/components/Button.tsx', name: 'Button.tsx' }],
			},
			{ id: 'src/index.ts', name: 'index.ts' },
		],
	},
	{ id: 'package.json', name: 'package.json' },
]

const fileCols: TableColumn<FileNode>[] = [{ key: 'name', header: 'Name', width: proportional(2) }]

function TreeTable(props: { expandAllControl?: boolean }) @{
	const { visibleData, treeConfig } = useTableTreeState<FileNode>({
		data: fileTree,
		idKey: 'id',
		defaultExpandedIds: ['src'],
	})

	const tree = useTableTreeData({
		...treeConfig,
		hasExpandAllControl: props.expandAllControl ?? true,
	})

	<Table data={visibleData} columns={fileCols} idKey="id" plugins={{ tree }} />
}

describe('useTableTreeState + useTableTreeData', () => {
	it('flattens visible rows with aria-level and parent aria-expanded', () => {
		const el = mount(<TreeTable />)
		const rows = [...el.querySelectorAll('tbody tr')]
		// src expanded initially: src, components, index.ts, package.json
		expect(rows.map((r) => r.textContent)).toEqual([
			expect.stringContaining('src'),
			expect.stringContaining('components'),
			expect.stringContaining('index.ts'),
			expect.stringContaining('package.json'),
		])

		const levelOf = (name: string) =>
			rows.find((r) => r.textContent!.includes(name))!.getAttribute('aria-level')

		expect(levelOf('src')).toBe('1')
		expect(levelOf('components')).toBe('2')
		expect(levelOf('index.ts')).toBe('2')
		expect(levelOf('package.json')).toBe('1')
		const srcRow = rows.find((r) => r.textContent!.includes('src'))!
		expect(srcRow.getAttribute('aria-expanded')).toBe('true')
		// leaf rows carry no aria-expanded
		const pkgRow = rows.find((r) => r.textContent!.includes('package.json'))!
		expect(pkgRow.getAttribute('aria-expanded')).toBeNull()
	})

	it('chevron expands a collapsed branch; expand-all then collapse-all', () => {
		const el = mount(<TreeTable />)
		// expand components → Button.tsx at level 3
		const componentsRow = [...el.querySelectorAll('tbody tr')].find((r) =>
			r.textContent!.includes('components'),
		)!

		click(componentsRow.querySelector('button.vx-table-expander')!)
		let names = [...el.querySelectorAll('tbody tr')].map((r) => r.textContent)
		expect(names.some((n) => n!.includes('Button.tsx'))).toBe(true)

		// header expand-all toggle
		const toggle = el.querySelector('thead button.vx-table-expander')!
		expect(toggle.getAttribute('aria-label')).toBe('Collapse all rows')
		click(toggle) // collapse all
		expect([...el.querySelectorAll('tbody tr')].map((r) => r.textContent)).toEqual([
			expect.stringContaining('src'),
			expect.stringContaining('package.json'),
		])

		click(el.querySelector('thead button.vx-table-expander')!) // expand all
		names = [...el.querySelectorAll('tbody tr')].map((r) => r.textContent)
		expect(names.some((n) => n!.includes('Button.tsx'))).toBe(true)
	})

	it('cycle guard: a row that is its own ancestor is skipped', () => {
		const cyclic: FileNode[] = []
		const a: FileNode = { id: 'a', name: 'a' }
		const b: FileNode = { id: 'b', name: 'b', children: [a] }
		a.children = [b]
		cyclic.push(a)
		function CyclicTree() @{
			const { visibleData, treeConfig } = useTableTreeState<FileNode>({
				data: cyclic,
				idKey: 'id',
				defaultExpandedIds: ['a', 'b'],
			})

			const tree = useTableTreeData(treeConfig)

			<Table data={visibleData} columns={fileCols} idKey="id" plugins={{ tree }} />
		}

		const el = mount(<CyclicTree />)
		expect(el.querySelectorAll('tbody tr').length).toBe(2)
	})
})
