// Port of upstream templates/pages/table-page/page.tsx (Astryx 0.6.4, MIT) —
// route /templates/table-page/. Invoice line items: column-filter popovers
// driven by the shared PowerSearchConfig, custom comparators, a segmented
// scope toggle, free-text narrowing, derived totals, filtered-view banner,
// per-row hover-card detail, and a custom flush-edges plugin.
// Adaptations: upstream's per-row <tr> anchor uses a DOM `closest('tr')`
// escape — the port anchors the hover card to the description cell instead.
// `Text hasTabularNumbers`/`justify`/`display` map to sandbox classes.
import { useMemo, useState } from 'octane'
import {
	Banner, Button, Divider, EmptyState, Heading, HStack, Icon,
	Layout, LayoutContent, MetadataList, MetadataListItem,
	SegmentedControl, SegmentedControlItem, StackItem, Table, Text,
	TextInput, VStack, pixel, proportional, toSearchFilters,
	usePowerSearchConfig, useTableFilterState, useTableFiltering,
	useTableSortable, useTableSortableState,
} from '@octane-xplat/ui'
import type { PowerSearchFilter, TableColumn, TablePlugin, TableSortComparator } from '@octane-xplat/ui'

type LineCategory = 'design' | 'development' | 'content' | 'project'
type BillingBasis = 'hourly' | 'fixed'

interface LineItem extends Record<string, unknown> {
	id: string
	description: string
	category: LineCategory
	basis: BillingBasis
	quantity: number
	unitPriceCents: number
}

interface InvoiceRow extends LineItem {
	amountCents: number
}

const CATEGORY_LABEL: Record<LineCategory, string> = {
	design: 'Design',
	development: 'Development',
	content: 'Content',
	project: 'Project management',
}

const LINE_ITEMS: LineItem[] = [
	{ id: 'li-01', description: 'Discovery workshop', category: 'design', basis: 'fixed', quantity: 1, unitPriceCents: 240_000 },
	{ id: 'li-02', description: 'Stakeholder interviews', category: 'design', basis: 'hourly', quantity: 12, unitPriceCents: 14_500 },
	{ id: 'li-03', description: 'User research synthesis', category: 'design', basis: 'hourly', quantity: 18, unitPriceCents: 14_500 },
	{ id: 'li-04', description: 'Wireframes — key templates', category: 'design', basis: 'hourly', quantity: 34, unitPriceCents: 14_500 },
	{ id: 'li-05', description: 'Visual design system', category: 'design', basis: 'fixed', quantity: 1, unitPriceCents: 680_000 },
	{ id: 'li-06', description: 'Page designs — 14 templates', category: 'design', basis: 'hourly', quantity: 62, unitPriceCents: 14_500 },
	{ id: 'li-07', description: 'Prototype & usability testing', category: 'design', basis: 'hourly', quantity: 22, unitPriceCents: 14_500 },
	{ id: 'li-08', description: 'Frontend build — component library', category: 'development', basis: 'hourly', quantity: 88, unitPriceCents: 16_500 },
	{ id: 'li-09', description: 'Frontend build — page templates', category: 'development', basis: 'hourly', quantity: 104, unitPriceCents: 16_500 },
	{ id: 'li-10', description: 'CMS setup & content modelling', category: 'development', basis: 'hourly', quantity: 40, unitPriceCents: 16_500 },
	{ id: 'li-11', description: 'Search & filtering integration', category: 'development', basis: 'hourly', quantity: 26, unitPriceCents: 16_500 },
	{ id: 'li-12', description: 'Analytics & tag manager setup', category: 'development', basis: 'hourly', quantity: 10, unitPriceCents: 16_500 },
	{ id: 'li-13', description: 'Accessibility audit & remediation', category: 'development', basis: 'fixed', quantity: 1, unitPriceCents: 320_000 },
	{ id: 'li-14', description: 'Cross-browser QA', category: 'development', basis: 'hourly', quantity: 24, unitPriceCents: 13_500 },
	{ id: 'li-15', description: 'Copywriting — 14 pages', category: 'content', basis: 'hourly', quantity: 36, unitPriceCents: 12_500 },
	{ id: 'li-16', description: 'Content migration', category: 'content', basis: 'hourly', quantity: 28, unitPriceCents: 9_500 },
	{ id: 'li-17', description: 'Stock photography licences', category: 'content', basis: 'fixed', quantity: 24, unitPriceCents: 1_800 },
	{ id: 'li-18', description: 'Project management — 12 weeks', category: 'project', basis: 'fixed', quantity: 12, unitPriceCents: 85_000 },
	{ id: 'li-19', description: 'Training & handover session', category: 'project', basis: 'fixed', quantity: 2, unitPriceCents: 120_000 },
]

const ROWS: InvoiceRow[] = LINE_ITEMS.map((item) => ({ ...item, amountCents: item.quantity * item.unitPriceCents }))

const INVOICE_SUBTOTAL_CENTS = ROWS.reduce((sum, item) => sum + item.amountCents, 0)

const BASIS_FILTERS: { value: BillingBasis | 'all'; label: string }[] = [
	{ value: 'all', label: 'All lines' },
	{ value: 'hourly', label: 'Hourly' },
]

const SEARCH_FIELDS = [
	{ key: 'description', type: 'string', label: 'Description' },
	{
		key: 'category',
		type: 'enum',
		label: 'Category',
		enumValues: [
			{ value: 'design', label: 'Design' },
			{ value: 'development', label: 'Development' },
			{ value: 'content', label: 'Content' },
			{ value: 'project', label: 'Project management' },
		],
	},
	{ key: 'quantity', type: 'number', label: 'Quantity' },
] as const

const TAX_RATE = 0.0875

const INVOICE_DETAILS: { label: string; value: string }[] = [
	{ label: 'Billed to', value: 'Brightwater Coffee Co.' },
	{ label: 'Project', value: 'Website redesign' },
	{ label: 'Issue date', value: 'Mar 31, 2026' },
	{ label: 'Due date', value: 'Apr 30, 2026' },
	{ label: 'Payment terms', value: 'Net 30' },
	{ label: 'Purchase order', value: 'PO-4471' },
]

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
const decimal = new Intl.NumberFormat('en-US')

function formatCents(cents: number): string {
	return currency.format(cents / 100)
}

function Figure(props: { children: any; weight?: 'normal' | 'semibold' }) @{
	<Text className="sb-tabular" weight={props.weight}>{props.children}</Text>
}

function DescriptionCell(props: { item: InvoiceRow }) @{
	const item = props.item
	// Upstream anchors a HoverCard to the whole row via a DOM closest('tr')
	// escape. xplat useHoverCard binds to a component ref — anchored here on
	// the description text (recorded adaptation).
	<Text maxLines={1}>{item.description}</Text>
}

const columns: TableColumn<InvoiceRow>[] = [
	{
		key: 'description',
		header: 'Description',
		width: proportional(3),
		sortable: true,
		filter: 'description',
		renderCell: (item) => <DescriptionCell item={item} />,
	},
	{
		key: 'category',
		header: 'Category',
		width: pixel(160),
		sortable: true,
		filter: 'category',
		renderCell: (item) => <Text color="secondary" maxLines={1}>{CATEGORY_LABEL[item.category]}</Text>,
	},
	{
		key: 'quantity',
		header: 'Qty',
		width: pixel(80),
		align: 'end',
		sortable: true,
		filter: 'quantity',
		renderCell: (item) => <Figure>{decimal.format(item.quantity)}</Figure>,
	},
	{
		key: 'unitPrice',
		header: 'Rate',
		width: pixel(120),
		align: 'end',
		sortable: true,
		renderCell: (item) => <Figure>{formatCents(item.unitPriceCents)}</Figure>,
	},
	{
		key: 'amount',
		header: 'Amount',
		width: pixel(132),
		align: 'end',
		sortable: true,
		renderCell: (item) => <Figure>{formatCents(item.amountCents)}</Figure>,
	},
]

const COMPARATORS: Partial<Record<string, TableSortComparator<InvoiceRow>>> = {
	description: (a, b) => a.description.localeCompare(b.description),
	category: (a, b) => CATEGORY_LABEL[a.category].localeCompare(CATEGORY_LABEL[b.category]),
	quantity: (a, b) => a.quantity - b.quantity,
	unitPrice: (a, b) => a.unitPriceCents - b.unitPriceCents,
	amount: (a, b) => a.amountCents - b.amountCents,
}

const FLUSH_START = { paddingInlineStart: 0 }
const FLUSH_END = { paddingInlineEnd: 0 }

function edgeStyle(index: number, total: number) {
	if (index === 0) return FLUSH_START
	if (index === total - 1) return FLUSH_END
	return undefined
}

/** Zero padding on the outer cells — a complete plugin in a dozen lines,
 *  same as upstream's useFlushEdges. */
function useFlushEdges(): TablePlugin<InvoiceRow> {
	return useMemo<TablePlugin<InvoiceRow>>(() => ({
		transformHeaderCell: (props: any, _column: any, columnIndex: number, cols: readonly any[]) => {
			const style = edgeStyle(columnIndex, cols.length)
			return style == null
				? props
				: { ...props, htmlProps: { ...props.htmlProps, style: { ...props.htmlProps.style, ...style } } }
		},
		transformBodyCell: (props: any, _column: any, _item: any, columnIndex: number, cols: readonly any[]) => {
			const style = edgeStyle(columnIndex, cols.length)
			return style == null
				? props
				: { ...props, htmlProps: { ...props.htmlProps, style: { ...props.htmlProps.style, ...style } } }
		},
	}), [])
}

const AMOUNT_COLUMN_WIDTH = 132

function TotalRow(props: { label: string; value: string; emphasis?: 'muted' | 'strong' }) @{
	const weight = props.emphasis === 'strong' ? 'semibold' : 'normal'
	<HStack gap={6} hAlign="end" vAlign="center">
		<Text weight={weight as any} color={props.emphasis === 'muted' ? 'secondary' : 'primary'}>{props.label}</Text>
		<VStack width={AMOUNT_COLUMN_WIDTH}>
			<Text className="sb-tabular sb-text-end" weight={weight as any}>{props.value}</Text>
		</VStack>
	</HStack>
}

export function TablePageTemplate() @{
	const [query, setQuery] = useState('')
	const [basis, setBasis] = useState<BillingBasis | 'all'>('all')

	const { config, applyFilters } = usePowerSearchConfig(SEARCH_FIELDS as any)
	const { filters: columnFilters, onFilterChange, clearAll } = useTableFilterState()

	const filterPlugin = useTableFiltering<InvoiceRow>({
		filters: columnFilters,
		onFilterChange,
		searchConfig: config,
		variant: 'popover',
	})

	const visible = useMemo(() => {
		const columnPredicates = toSearchFilters(columnFilters, columns, config) as PowerSearchFilter[]
		const matched = applyFilters(columnPredicates, ROWS)
		const scoped = basis === 'all' ? matched : matched.filter((item) => item.basis === basis)
		const term = query.trim().toLowerCase()
		return term === '' ? scoped : scoped.filter((item) => item.description.toLowerCase().includes(term))
	}, [applyFilters, columnFilters, config, basis, query])

	const { sortedData, sortConfig } = useTableSortableState<InvoiceRow>({ data: visible, comparators: COMPARATORS })
	const sortPlugin = useTableSortable<InvoiceRow>(sortConfig)
	const flushPlugin = useFlushEdges()

	const subtotalCents = useMemo(() => visible.reduce((sum, item) => sum + item.amountCents, 0), [visible])
	const taxCents = Math.round(subtotalCents * TAX_RATE)
	const totalCents = subtotalCents + taxCents

	const activeFilterCount =
		(query.trim() === '' ? 0 : 1) +
		Object.keys(columnFilters).length +
		(basis === 'all' ? 0 : 1)

	const clearEverything = () => {
		setQuery('')
		setBasis('all')
		clearAll()
	}

	<Layout
		height="fill"
		contentWidth={960}
		content={
			<LayoutContent padding={0}>
				<VStack padding={4} gap={8}>
					<VStack gap={6} paddingBlockEnd={4}>
						<HStack gap={3} vAlign="center" wrap="wrap">
							<StackItem size="fill">
								<Heading level={1}>Invoice INV-2043</Heading>
							</StackItem>
							<Button
								label="Download PDF"
								variant="secondary"
								icon={<Icon name="xplat-upload" size={16} />}
							/>
						</HStack>
						<MetadataList columns="multi" orientation="vertical" label={{ position: 'top' }}>
							{INVOICE_DETAILS.map((detail) => (
								<MetadataListItem key={detail.label} label={detail.label}>
									{detail.value}
								</MetadataListItem>
							))}
						</MetadataList>
					</VStack>

					<HStack gap={3} vAlign="center" hAlign="between" wrap="wrap">
						<SegmentedControl
							label="Filter by billing basis"
							value={basis}
							onValueChange={(value: string) => setBasis(value as BillingBasis | 'all')}>
							{BASIS_FILTERS.map((filter) => (
								<SegmentedControlItem key={filter.value} value={filter.value} label={filter.label} />
							))}
						</SegmentedControl>
						<VStack width={300}>
							<TextInput
								label="Search line items"
								isLabelHidden
								value={query}
								onChange={setQuery}
								placeholder="Search…"
								startIcon={<Icon name="xplat-search" size={16} />}
							/>
						</VStack>
					</HStack>

					<VStack gap={6}>
						{visible.length === 0 ? (
							<EmptyState
								title="No matching line items"
								description="No line on this invoice matches the current filters."
							>
								<Button label="Clear filters" variant="secondary" clickAction={clearEverything} />
							</EmptyState>
						) : (
							<VStack gap={4}>
								<Table
									data={sortedData}
									columns={columns}
									idKey="id"
									density="balanced"
									dividers="none"
									hasHover
									textOverflow="truncate"
									plugins={{ sort: sortPlugin, filter: filterPlugin, flush: flushPlugin }}
								/>

								<VStack gap={3}>
									<Divider />
									<TotalRow label="Subtotal" value={formatCents(subtotalCents)} />
									<TotalRow label="Tax (8.75%)" value={formatCents(taxCents)} emphasis="muted" />
									<Divider />
									<TotalRow label="Total due" value={formatCents(totalCents)} emphasis="strong" />
									<Divider />
								</VStack>
							</VStack>
						)}

						{visible.length > 0 && activeFilterCount > 0 && (
							<Banner icon="xplat-warning">
								<HStack gap={3} vAlign="center" wrap="wrap">
									<VStack gap={1} style={{ flexGrow: 1 }}>
										<Text weight="semibold">Filtered view — these totals are partial</Text>
										<Text color="secondary">{`Showing ${visible.length} of ${ROWS.length} lines. The subtotal, tax, and total due above cover only the lines currently visible.`}</Text>
									</VStack>
									<Button label="Clear all filters" variant="secondary" clickAction={clearEverything} />
								</HStack>
							</Banner>
						)}
					</VStack>
				</VStack>
			</LayoutContent>
		}
	/>
}
