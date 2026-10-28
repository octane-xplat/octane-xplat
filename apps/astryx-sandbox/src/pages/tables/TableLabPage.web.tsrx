/** @jsxImportSource @octane-xplat/jsx/dom */
// Astryx 0.6.4 Table Lab (MIT). Public plugins share one deterministic dataset.
import { useMemo, useRef, useState } from 'octane'
import {
	Button,
	CheckboxInput,
	Heading,
	HStack,
	SegmentedControl,
	SegmentedControlItem,
	Table,
	Text,
	VStack,
	paginateData,
	useTableColumnResize,
	useTableGroupedRows,
	useTablePagination,
	useTableRowExpansion,
	useTableRowIndex,
	useTableRowStatus,
	useTableSelection,
	useTableSelectionState,
	useTableSortable,
	useTableSortableState,
	useTableStickyColumns,
} from '@octane-xplat/ui'

import type { TablePlugin } from '@octane-xplat/ui'
import { generateRows, labColumns } from './lab-data'
import type { LabRow } from './lab-data'
import { useScrollMetrics } from './use-scroll-metrics.web'

const pluginLabels = {
	selection: 'Selection',
	sortable: 'Sortable',
	pagination: 'Pagination',
	columnResize: 'Column resize',
	stickyColumns: 'Sticky columns',
	rowExpansion: 'Row expansion',
	groupedRows: 'Grouped rows',
	rowIndex: 'Row index',
	rowStatus: 'Row status',
}

type PluginId = keyof typeof pluginLabels

function toggled(values: Set<string>, key: string): Set<string> {
	const next = new Set(values)
	if (next.has(key)) {
		next.delete(key)
	} else {
		next.add(key)
	}

	return next
}

export function TableLabPage() @{
	const scroller = useRef<HTMLDivElement | null>(null)
	const metrics = useScrollMetrics()
	const [rowCount, setRowCount] = useState(500)
	const [enabled, setEnabled] = useState<Partial<Record<PluginId, boolean>>>({ sortable: true })
	const baseData = useMemo(() => generateRows(rowCount), [rowCount])
	const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set())
	const { selectionConfig } = useTableSelectionState({
		data: baseData,
		idKey: 'id',
		selectedKeys,
		setSelectedKeys,
	})

	const selection = useTableSelection(selectionConfig)
	const { sortedData, sortConfig } = useTableSortableState({ data: baseData })
	const sort = useTableSortable<LabRow>(sortConfig)
	const sorted = enabled.sortable ? sortedData : baseData
	const [page, setPage] = useState(1)
	const pagination = useTablePagination<LabRow>({
		page,
		onPageChange: setPage,
		totalItems: sorted.length,
		pageSize: 25,
	})

	const paged = enabled.pagination ? paginateData(sorted, page, 25) : sorted
	const [columnWidths, setColumnWidths] = useState<Record<string, number>>({})
	const resize = useTableColumnResize<LabRow>({ columnWidths, onColumnResizeEnd: setColumnWidths })
	const sticky = useTableStickyColumns<LabRow>({ startKeys: ['name'], endKeys: ['joined'] })
	const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set())
	const expansion = useTableRowExpansion<LabRow>({
		expandedKeys,
		onToggle: (key) => setExpandedKeys((previous) => toggled(previous, key)),
		getRowKey: (item) => item.id,
		renderExpanded: (item) => <Text>{`Details for ${item.name}`}</Text>,
	})

	const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
	const grouped = useTableGroupedRows({
		data: paged,
		groupBy: (item) => item.team,
		collapsedGroups,
		onToggleGroup: (key) => setCollapsedGroups((previous) => toggled(previous, key)),
		getRowKey: (item) => item.id,
	})

	const index = useTableRowIndex({ data: paged, getRowKey: (item) => item.id })
	const status = useTableRowStatus<LabRow>({
		getStatus: (item) =>
			item.status === 'Offline'
				? null
				: { status: item.status === 'Active' ? 'success' : 'warning', label: item.status },
	})

	const plugins: Record<string, TablePlugin<LabRow>> = {}
	if (enabled.groupedRows) {
		plugins.grouped = grouped.plugin
	}

	if (enabled.rowIndex) {
		plugins.rowIndex = index
	}

	if (enabled.rowStatus) {
		plugins.rowStatus = status
	}

	if (enabled.sortable) {
		plugins.sort = sort
	}

	if (enabled.selection) {
		plugins.selection = selection
	}

	if (enabled.rowExpansion) {
		plugins.expansion = expansion
	}

	if (enabled.stickyColumns) {
		plugins.sticky = sticky
	}

	if (enabled.columnResize) {
		plugins.resize = resize
	}

	if (enabled.pagination) {
		plugins.pagination = pagination
	}

	const data = enabled.groupedRows ? grouped.data : paged

	<VStack gap={4} padding={4}>
		<Heading level={2}>Table Lab</Heading>
		<Text>Toggle plugins and dataset sizes to exercise their composition.</Text>
		<SegmentedControl
			label="Row count"
			value={String(rowCount)}
			onValueChange={(value) => {
				setRowCount(Number(value))
				setPage(1)
			}}
		>
			{[50, 500, 2000, 10000].map((count) => (
				<SegmentedControlItem
					key={count}
					value={String(count)}
					label={count < 1000 ? String(count) : `${count / 1000}k`}
				/>
			))}
		</SegmentedControl>
		<HStack gap={3} wrap="wrap">
			{(Object.keys(pluginLabels) as PluginId[]).map((id) => (
				<CheckboxInput
					key={id}
					label={pluginLabels[id]}
					value={enabled[id] ?? false}
					onChange={(value) => setEnabled((previous) => ({ ...previous, [id]: value }))}
				/>
			))}
		</HStack>
		<Text>{`${Object.values(enabled).filter(Boolean).length} active · ${data.length} rendered rows · ${selectedKeys.size} selected · ${expandedKeys.size} expanded`}</Text>
		<Button
			label={metrics.running ? 'Scrolling…' : 'Run scroll test'}
			isDisabled={metrics.running}
			clickAction={() => metrics.run(scroller.current)}
		/>
		<Text>{`Scroll FPS: ${metrics.fps || '—'} · Frame drops: ${metrics.drops} · Frames sampled: ${metrics.frames}`}</Text>
		<Text color="secondary">Renderer commit timing is unavailable.</Text>
		<div ref={scroller} className="sb-table-lab-scroll">
			<Table
				data={data}
				columns={labColumns}
				idKey={enabled.groupedRows ? grouped.idKey : 'id'}
				plugins={plugins}
				hasHover
			/>
		</div>
	</VStack>
}
