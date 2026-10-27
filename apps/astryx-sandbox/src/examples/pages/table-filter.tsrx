// Astryx 0.6.4 service-job table (MIT): public filtering/grouping/selection/sticky contracts.
import { useMemo, useState } from 'octane'
import {
	Button,
	Token,
	Slider,
	ResizeHandle,
	useResizable,
	CheckboxInput,
	Collapsible,
	Heading,
	PowerSearch,
	HStack,
	RadioList,
	RadioListItem,
	Table,
	Text,
	TextInput,
	VStack,
	pixel,
	proportional,
	usePowerSearchConfig,
	useTableColumnSettings,
	useTableFilterState,
	useTableFiltering,
	useTableGroupedRows,
	useTableSelection,
	useTableSelectionState,
	useTableSortable,
	useTableSortableState,
	useTableStickyColumns,
	toSearchFilters,
} from '@octane-xplat/ui'

import type { PowerSearchFilter, TableFilterState, TableColumn } from '@octane-xplat/ui'
import { useJobBatches } from './use-job-batches.web'
import { allJobs, STATUS_META } from './job-data'
import type { ServiceJob } from './job-data'

type SavedJobView = {
	name: string
	query: string
	headerFilters: TableFilterState
	quoteRange: [number, number]
	filters: ReadonlyArray<PowerSearchFilter>
	groupBy: string
	columnKeys: ReadonlyArray<string>
	density: 'compact' | 'balanced' | 'spacious'
	stickyEnd: boolean
}

const fields = [
	{ key: 'summary', type: 'string', label: 'Job' },
	{
		key: 'customer',
		type: 'enum',
		label: 'Customer',
		enumValues: [...new Set(allJobs.map((job) => job.customer))].map((value) => ({
			value,
			label: value,
		})),
	},
	{
		key: 'status',
		type: 'enum',
		label: 'Status',
		enumValues: Object.entries(STATUS_META).map(([value, meta]) => ({ value, label: meta.label })),
	},
	{
		key: 'technician',
		type: 'enum',
		label: 'Technician',
		enumValues: [...new Set(allJobs.map((job) => job.technician))].map((value) => ({
			value,
			label: value,
		})),
	},
	{ key: 'scheduledOn', type: 'date', label: 'Scheduled' },
	{ key: 'quoted', type: 'number', label: 'Quote' },
	{
		key: 'priority',
		type: 'enum',
		label: 'Priority',
		enumValues: ['urgent', 'high', 'normal'].map((value) => ({ value, label: value })),
	},
] as const

const columns: TableColumn<ServiceJob>[] = [
	{ key: 'priority', header: 'Priority', width: pixel(100), filter: 'priority', sortable: true },
	{ key: 'summary', header: 'Job', width: proportional(3), sortable: true, filter: 'summary' },
	{ key: 'customer', header: 'Customer', width: pixel(200), sortable: true, filter: 'customer' },
	{
		key: 'status',
		filter: 'status',
		header: 'Status',
		width: pixel(140),
		sortable: true,
		renderCell: (item) => <Text>{STATUS_META[item.status].label}</Text>,
	},
	{
		key: 'technician',
		header: 'Technician',
		width: pixel(160),
		sortable: true,
		filter: 'technician',
	},
	{
		key: 'scheduledAt',
		filter: 'scheduledOn',
		header: 'Scheduled',
		width: pixel(160),
		sortable: true,
		renderCell: (item) => item.scheduledOn.toLocaleDateString('en-US'),
	},
	{
		key: 'quoted',
		header: 'Quote',
		width: pixel(110),
		sortable: true,
		filter: 'quoted',
		renderCell: (item) => `$${item.quoted}`,
	},
]

export function TableFilterTemplate() @{
	const detailPanel = useResizable({
		defaultSize: pixel(360),
		minSize: pixel(280),
		maxSize: pixel(500),
	})

	const [query, setQuery] = useState('')
	const [groupBy, setGroupBy] = useState('customer')
	const [powerFilters, setPowerFilters] = useState<ReadonlyArray<PowerSearchFilter>>([
		{ field: 'status', operator: 'is_not', value: { type: 'enum', value: 'completed' } },
	])

	const [isPowerSearch, setIsPowerSearch] = useState(false)
	const [quoteRange, setQuoteRange] = useState<[number, number]>([
		0,
		Math.ceil(Math.max(...allJobs.map((job) => job.quoted)) / 100) * 100,
	])

	const [columnKeys, setColumnKeys] = useState<ReadonlyArray<string>>(
		columns.map((column) => column.key),
	)

	const [density, setDensity] = useState<'compact' | 'balanced' | 'spacious'>('balanced')
	const [stickyEnd, setStickyEnd] = useState(false)
	const [viewName, setViewName] = useState('')
	const [editingView, setEditingView] = useState<number | null>(null)
	const [savedViews, setSavedViews] = useState<SavedJobView[]>(
		() =>
			[
				{
					name: 'Needs dispatch',
					filters: [
						{ field: 'status', operator: 'is', value: { type: 'enum', value: 'scheduled' } },
					],
					groupBy: 'customer',
					stickyEnd: false,
				},
				{
					name: "Luis's jobs",
					filters: [
						{
							field: 'technician',
							operator: 'is',
							value: { type: 'enum', value: 'Luis Camarena' },
						},
					],
					groupBy: 'status',
					stickyEnd: false,
				},
				{
					name: 'High value',
					filters: [
						{
							field: 'quoted',
							operator: 'greater_than_or_equal',
							value: { type: 'integer', value: 1000 },
						},
					],
					groupBy: 'customer',
					stickyEnd: true,
				},
			].map((saved) => ({
				...saved,
				query: '',
				headerFilters: {},
				quoteRange: [0, Math.ceil(Math.max(...allJobs.map((job) => job.quoted)) / 100) * 100],
				columnKeys: columns.map((column) => column.key),
				density: 'balanced',
			})) as SavedJobView[],
	)

	const columnSettings = useTableColumnSettings<ServiceJob>({
		columns: columns.map((column) => ({ key: column.key, label: String(column.header) })),
		activeColumnKeys: columnKeys,
		onChangeActiveColumnKeys: setColumnKeys,
	})

	const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set())
	const [activeJob, setActiveJob] = useState<ServiceJob | null>(null)
	const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
	const { config, applyFilters } = usePowerSearchConfig(fields as any)
	const { filters, onFilterChange, clearAll } = useTableFilterState()
	const filter = useTableFiltering<ServiceJob>({
		filters,
		onFilterChange,
		searchConfig: config,
		variant: 'popover',
	})

	const matched = useMemo(
		() =>
			applyFilters([...toSearchFilters(filters, columns, config), ...powerFilters], allJobs).filter(
				(item) =>
					item.quoted >= quoteRange[0] &&
					item.quoted <= quoteRange[1] &&
					[item.summary, item.customer, item.id].some((value) =>
						value.toLowerCase().includes(query.toLowerCase().trim()),
					),
			),
		[applyFilters, filters, powerFilters, config, query, quoteRange],
	)

	const batches = useJobBatches(
		matched.length,
		JSON.stringify([filters, powerFilters, query, quoteRange]),
	)

	const sortable = useTableSortableState({ data: matched })
	const loaded = sortable.sortedData.slice(0, batches.limit)
	const sort = useTableSortable<ServiceJob>(sortable.sortConfig)
	const { selectionConfig } = useTableSelectionState({
		data: loaded,
		idKey: 'id',
		selectedKeys,
		setSelectedKeys,
	})

	const selection = useTableSelection(selectionConfig)
	const sticky = useTableStickyColumns<ServiceJob>({
		startKeys: ['summary'],
		endKeys: stickyEnd ? ['quoted'] : [],
	})

	const grouped = useTableGroupedRows({
		data: loaded,
		groupBy: (item) => String(item[groupBy]),
		collapsedGroups,
		onToggleGroup: (key) =>
			setCollapsedGroups((previous) => {
				const next = new Set(previous)
				if (next.has(key)) {
					next.delete(key)
				} else {
					next.add(key)
				}

				return next
			}),
		getRowKey: (item) => item.id,
	})

	const detail = {
		transformBodyRow: (props: any, item: ServiceJob) => ({
			...props,
			htmlProps: { ...props.htmlProps, onClick: () => setActiveJob(item) },
		}),
	}

	<VStack gap={4} padding={4}>
		<Heading level={1}>Service jobs</Heading>
		<Button label="Power search" clickAction={() => setIsPowerSearch(!isPowerSearch)} />
		{isPowerSearch && (
			<PowerSearch
				config={config}
				filters={powerFilters}
				onChange={setPowerFilters}
				placeholder="Filter jobs..."
			/>
		)}
		{!isPowerSearch && (
			<HStack gap={2} wrap="wrap">
				{powerFilters.map((filter, index) => (
					<Token
						key={index}
						label={`${filter.field} ${filter.operator} ${'value' in filter.value ? String(filter.value.value) : ''}`}
						onRemove={() => setPowerFilters((previous) => previous.filter((_, i) => i !== index))}
					/>
				))}
			</HStack>
		)}
		<TextInput label="Search jobs" value={query} onChange={setQuery} />
		<Slider
			label="Quote range"
			value={quoteRange}
			min={0}
			max={Math.ceil(Math.max(...allJobs.map((job) => job.quoted)) / 100) * 100}
			step={100}
			valueDisplay="text"
			onValueChange={(value) => {
				if (Array.isArray(value)) {
					setQuoteRange(value)
				}
			}}
		/>
		<RadioList label="Grouping" value={groupBy} onValueChange={setGroupBy}>
			{['none', 'status', 'technician', 'customer'].map((value) => (
				<RadioListItem key={value} value={value} label={value} />
			))}
		</RadioList>
		<Collapsible trigger={<Text>View options</Text>}>
			<VStack gap={3}>
				<HStack gap={2} wrap="wrap">
					{columns.map((column) => (
						<CheckboxInput
							key={column.key}
							label={String(column.header)}
							value={columnKeys.includes(column.key)}
							isDisabled={column.key === 'summary'}
							onChange={(checked) =>
								setColumnKeys((previous) =>
									checked
										? [...previous, column.key]
										: previous.filter((key) => key !== column.key),
								)
							}
						/>
					))}
				</HStack>
				<VStack gap={2}>
					{columnKeys.map((key, index) => (
						<HStack key={key} gap={2}>
							<Text>{columns.find((column) => column.key === key)?.header}</Text>
							<Button
								label={`Move ${key} earlier`}
								isDisabled={index === 0}
								clickAction={() =>
									setColumnKeys((previous) => {
										const next = [...previous]

										;[next[index - 1], next[index]] = [next[index]!, next[index - 1]!]
										return next
									})
								}
							/>
							<Button
								label={`Move ${key} later`}
								isDisabled={index === columnKeys.length - 1}
								clickAction={() =>
									setColumnKeys((previous) => {
										const next = [...previous]

										;[next[index], next[index + 1]] = [next[index + 1]!, next[index]!]
										return next
									})
								}
							/>
						</HStack>
					))}
				</VStack>
				<RadioList
					label="Density"
					value={density}
					onValueChange={(value) => setDensity(value as typeof density)}
				>
					{['compact', 'balanced', 'spacious'].map((value) => (
						<RadioListItem key={value} value={value} label={value} />
					))}
				</RadioList>
				<CheckboxInput label="Freeze quote column" value={stickyEnd} onChange={setStickyEnd} />
			</VStack>
		</Collapsible>
		<Collapsible trigger={<Text>Saved views</Text>}>
			<VStack gap={3}>
				<TextInput label="View name" value={viewName} onChange={setViewName} />
				<Button
					label={editingView === null ? 'Create saved view' : 'Save view'}
					isDisabled={!viewName.trim()}
					clickAction={() => {
						const snapshot = {
							name: viewName.trim(),
							query,
							filters: powerFilters,
							headerFilters: filters,
							quoteRange,
							groupBy,
							columnKeys,
							density,
							stickyEnd,
						}

						setSavedViews((previous) =>
							editingView === null
								? [...previous, snapshot]
								: previous.map((value, index) => (index === editingView ? snapshot : value)),
						)

						setViewName('')
						setEditingView(null)
					}}
				/>
				{savedViews.map((saved, index) => (
					<HStack key={index} gap={2}>
						<Button
							label={saved.name}
							clickAction={() => {
								clearAll()
								setQuery(saved.query)
								setPowerFilters(saved.filters)
								setQuoteRange(saved.quoteRange)
								for (const [key, value] of Object.entries(saved.headerFilters)) {
									if (value) {
										onFilterChange(key, value)
									}
								}

								setGroupBy(saved.groupBy)
								setColumnKeys(saved.columnKeys)
								setDensity(saved.density)
								setStickyEnd(saved.stickyEnd)
							}}
						/>
						<Button
							label={`Edit ${saved.name}`}
							clickAction={() => {
								setViewName(saved.name)
								setEditingView(index)
							}}
						/>
						<Button
							label={`Delete ${saved.name}`}
							clickAction={() =>
								setSavedViews((previous) => previous.filter((_, i) => i !== index))
							}
						/>
					</HStack>
				))}
			</VStack>
		</Collapsible>
		<HStack gap={3}>
			<Button
				label="Clear all"
				clickAction={() => {
					setQuery('')
					setPowerFilters([])
					setQuoteRange([0, Math.ceil(Math.max(...allJobs.map((job) => job.quoted)) / 100) * 100])
					clearAll()
				}}
			/>
			<Text>{`${matched.length} jobs · ${selectedKeys.size} selected`}</Text>
		</HStack>
		<Table
			data={groupBy === 'none' ? loaded : grouped.data}
			columns={columns}
			idKey={groupBy === 'none' ? 'id' : grouped.idKey}
			density={density}
			plugins={
				groupBy === 'none'
					? { columnSettings, detail, sort, selection, filter, sticky }
					: { columnSettings, detail, sort, selection, filter, sticky, grouped: grouped.plugin }
			}
			hasHover
		/>
		{batches.loading && <Text>Loading jobs…</Text>}
		{batches.sentinel}
		{activeJob && (
			<HStack>
				<ResizeHandle label="Resize details" resizable={detailPanel.props} />
				<VStack width={detailPanel.size} gap={3} padding={4}>
					<Heading level={2}>{activeJob.summary}</Heading>
					<Text>{activeJob.customer}</Text>
					<Text>{activeJob.address}</Text>
					<Text>{activeJob.technician}</Text>
					<Text>{activeJob.equipment}</Text>
					<Button label="Close details" clickAction={() => setActiveJob(null)} />
				</VStack>
			</HStack>
		)}
	</VStack>
}
