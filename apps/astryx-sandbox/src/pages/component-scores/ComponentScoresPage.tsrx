// Port of upstream pages/component-scores/page.tsx (Astryx 0.6.4, MIT) —
// /pages/component-scores/. Component audit ledger: metrics, filtered
// roster table with a custom row-click plugin, and an audit detail panel.
// Adaptations (recorded): upstream's roster/ledger is generated at build
// time from the component registry and a remote wiki — the port embeds a
// representative static roster; lab `Stat` → Card + Text; lab `Drawer` →
// xplat Dialog; `MoreMenu` → DropdownMenu; clipboard via copyText.
import { useMemo, useState } from 'octane'
import {
	Button, Card, Dialog, Divider, DropdownMenu, Heading,
	HStack, IconButton, Link, MetadataList, MetadataListItem, Section,
	Selector, Table, Text, TextInput, Toolbar, VStack, copyText,
	pixel, proportional, useToast,
} from '@octane-xplat/ui'
import type { TableColumn, TablePlugin } from '@octane-xplat/ui'

interface ScoreRow extends Record<string, unknown> {
	id: string
	component: string
	package: string
	audited: boolean
	score: number | null
	grade: string | null
	blocks: number
	lastAudited: string | null
	rubricVersion: string | null
	weakest: string | null
	summary: string | null
}

const ROSTER: ScoreRow[] = [
	{ id: 'button', component: 'Button', package: 'core', audited: true, score: 9.1, grade: 'A', blocks: 5, lastAudited: '2026-03-18', rubricVersion: '2.4', weakest: 'Loading semantics', summary: 'Strong coverage; loading state needs a documented async contract.' },
	{ id: 'text', component: 'Text', package: 'core', audited: true, score: 8.7, grade: 'B', blocks: 4, lastAudited: '2026-03-11', rubricVersion: '2.4', weakest: 'Truncation', summary: 'Type scale is consistent; maxLines truncation coverage is thin.' },
	{ id: 'checkbox', component: 'Checkbox', package: 'core', audited: true, score: 8.2, grade: 'B', blocks: 6, lastAudited: '2026-02-27', rubricVersion: '2.3', weakest: 'Indeterminate', summary: 'Indeterminate state needs an explicit mixed-selection example.' },
	{ id: 'select', component: 'Select', package: 'core', audited: true, score: 7.4, grade: 'C', blocks: 7, lastAudited: '2026-02-20', rubricVersion: '2.3', weakest: 'Keyboard nav', summary: 'Listbox focus order diverges between popover and inline variants.' },
	{ id: 'dialog', component: 'Dialog', package: 'core', audited: true, score: 8.9, grade: 'B', blocks: 4, lastAudited: '2026-03-05', rubricVersion: '2.4', weakest: 'Focus return', summary: 'Focus returns correctly in single layers; nested dismissal untested.' },
	{ id: 'table', component: 'Table', package: 'core', audited: true, score: 6.8, grade: 'C', blocks: 9, lastAudited: '2026-03-22', rubricVersion: '2.4', weakest: 'Plugin pipeline', summary: 'Data mode is solid; children mode and plugins need parity coverage.' },
	{ id: 'powersearch', component: 'PowerSearch', package: 'core', audited: true, score: 7.9, grade: 'B', blocks: 5, lastAudited: '2026-03-02', rubricVersion: '2.3', weakest: 'Operator depth', summary: 'Token editing works; nested operator groups are unimplemented.' },
	{ id: 'toast', component: 'Toast', package: 'core', audited: true, score: 9.3, grade: 'A', blocks: 3, lastAudited: '2026-03-15', rubricVersion: '2.4', weakest: 'Queue ordering', summary: 'Replacement policy matches spec; concurrent stacking verified.' },
	{ id: 'badge', component: 'Badge', package: 'core', audited: false, score: null, grade: null, blocks: 0, lastAudited: null, rubricVersion: null, weakest: null, summary: null },
	{ id: 'tooltip', component: 'Tooltip', package: 'core', audited: false, score: null, grade: null, blocks: 0, lastAudited: null, rubricVersion: null, weakest: null, summary: null },
	{ id: 'calendar', component: 'Calendar', package: 'core', audited: false, score: null, grade: null, blocks: 0, lastAudited: null, rubricVersion: null, weakest: null, summary: null },
	{ id: 'grid', component: 'Grid', package: 'lab', audited: true, score: 7.1, grade: 'C', blocks: 3, lastAudited: '2026-01-30', rubricVersion: '2.2', weakest: 'Responsive cols', summary: 'Auto-fit columns work; min/max syntax is undocumented.' },
	{ id: 'stat', component: 'Stat', package: 'lab', audited: false, score: null, grade: null, blocks: 0, lastAudited: null, rubricVersion: null, weakest: null, summary: null },
	{ id: 'drawer', component: 'Drawer', package: 'lab', audited: false, score: null, grade: null, blocks: 0, lastAudited: null, rubricVersion: null, weakest: null, summary: null },
]

const GRADE_CLASS: Record<string, string> = {
	A: 'sb-badge sb-badge--green',
	B: 'sb-badge sb-badge--green',
	C: 'sb-badge sb-badge--warning',
	D: 'sb-badge sb-badge--warning',
	F: 'sb-badge sb-badge--error',
}

const AUDIT_FILTERS = [
	{ value: 'audited', label: 'Audited' },
	{ value: 'tbd', label: 'Not started' },
]

const PACKAGES = [
	{ value: 'core', label: 'core' },
	{ value: 'lab', label: 'lab' },
]

const LEDGER_WIKI_URL = 'https://github.com/facebook/astryx'
const RUBRIC_URL = 'https://github.com/facebook/astryx'
const AUDIT_PROMPT = 'Audit this component against the published rubric: read its implementation, examples, and tests; score each rubric section 0–10; record evidence links and caveats.'

function Stat(props: { label: string; value: string; description?: string }) @{
	<Card>
		<VStack gap={1} padding={3}>
			<Text type="label" color="secondary">{props.label}</Text>
			<Text type="large" weight="semibold" className="sb-tabular">{props.value}</Text>
			{props.description ? <Text color="secondary">{props.description}</Text> : null}
		</VStack>
	</Card>
}

function RowActions(props: { row: ScoreRow; onViewAudit: (row: ScoreRow) => void }) @{
	const toast = useToast()
	const copyPrompt = () => {
		copyText(`${AUDIT_PROMPT}\n\nComponent: ${props.row.component}`)
		;(toast as any)?.('Audit prompt copied')
	}
	<DropdownMenu
		button={{ icon: <IconButton icon="xplat-more-horizontal" label={`${props.row.component} actions`} variant="ghost" size="sm" /> as any, isIconOnly: true, label: `${props.row.component} actions`, variant: 'ghost', size: 'sm' }}
		label={`${props.row.component} actions`}
		items={[
			{ type: 'action', key: 'copy-prompt', label: 'Copy audit prompt', onSelect: copyPrompt },
			{ type: 'action', key: 'view-audit', label: 'View audit details', onSelect: () => props.onViewAudit(props.row), isDisabled: !props.row.audited },
		]}
	/>
}

export function ComponentScoresPage() @{
	const [query, setQuery] = useState('')
	const [auditFilter, setAuditFilter] = useState<string | null>(null)
	const [packageFilter, setPackageFilter] = useState<string | null>(null)
	const [selectedRowId, setSelectedRowId] = useState<string | null>(null)

	const openAudit = (row: ScoreRow) => {
		if (row.audited) setSelectedRowId(row.id)
	}

	const auditRowPlugin: TablePlugin<ScoreRow> = useMemo(() => ({
		transformBodyRow(props: any, row: ScoreRow) {
			if (!row.audited) return props
			const previousOnClick = props.htmlProps.onClick
			return {
				...props,
				htmlProps: {
					...props.htmlProps,
					onClick: (event: any) => {
						previousOnClick?.(event)
						if (event.defaultPrevented) return
						openAudit(row)
					},
				},
				classes: [...props.classes, 'sb-audit-row'],
			}
		},
	}), [])

	const visible = useMemo(() => {
		const term = query.trim().toLowerCase()
		return ROSTER.filter((row) => {
			if (auditFilter === 'audited' && !row.audited) return false
			if (auditFilter === 'tbd' && row.audited) return false
			if (packageFilter != null && row.package !== packageFilter) return false
			if (term && !row.component.toLowerCase().includes(term) && !row.package.toLowerCase().includes(term)) return false
			return true
		})
	}, [query, auditFilter, packageFilter])

	const stats = useMemo(() => {
		const audited = ROSTER.filter((r) => r.audited).length
		const scored = ROSTER.map((r) => r.score).filter((s): s is number => typeof s === 'number')
		const average = scored.length ? scored.reduce((a, b) => a + b, 0) / scored.length : null
		return { audited, notStarted: ROSTER.length - audited, average, scored: scored.length }
	}, [])

	const selectedRow = ROSTER.find((r) => r.id === selectedRowId) ?? null
	const hasActiveFilters = auditFilter != null || packageFilter != null || query.length > 0

	const columns: TableColumn<ScoreRow>[] = [
		{
			key: 'component',
			header: 'Component',
			width: proportional(3),
			renderCell: (row: ScoreRow) => (
				<VStack gap={1}>
					<Text weight="medium">{row.component}</Text>
					<Text type="supporting" color="secondary">{row.package}</Text>
				</VStack>
			),
		},
		{
			key: 'grade',
			header: 'Grade',
			width: pixel(88),
			renderCell: (row: ScoreRow) =>
				row.grade
					? <span className={GRADE_CLASS[row.grade] ?? 'sb-badge sb-badge--neutral'}>{row.grade}</span>
					: <span className="sb-badge sb-badge--neutral">TBD</span>,
		},
		{
			key: 'score',
			header: 'Score',
			width: pixel(80),
			renderCell: (row: ScoreRow) => (
				<Text className="sb-tabular">{typeof row.score === 'number' ? row.score.toFixed(1) : '—'}</Text>
			),
		},
		{
			key: 'weakest',
			header: 'Weakest rubric area',
			width: proportional(2),
			renderCell: (row: ScoreRow) => (
				<Text type="supporting" color="secondary">{row.weakest ?? '—'}</Text>
			),
		},
		{
			key: 'lastAudited',
			header: 'Last audited',
			width: pixel(136),
			renderCell: (row: ScoreRow) =>
				row.audited ? (
					<VStack gap={1}>
						<Text type="supporting">{row.lastAudited}</Text>
						<Text type="supporting" color="secondary">{`rubric v${selectedRowSafe(row.rubricVersion)}`}</Text>
					</VStack>
				) : (
					<Text type="supporting" color="secondary">never</Text>
				),
		},
		{
			key: 'actions',
			header: 'Actions',
			width: pixel(72),
			align: 'end',
			renderCell: (row: ScoreRow) => <RowActions row={row} onViewAudit={openAudit} />,
		},
	]

	<>
		<VStack gap={0} width="100%">
			<Section variant="transparent" padding={4}>
				<VStack gap={5}>
					<HStack gap={4} hAlign="between" vAlign="start" wrap="wrap">
						<VStack gap={2} style={{ maxWidth: '72ch' }}>
							<Heading level={1}>Component Audits</Heading>
							<Text>
								{'To audit a component, open its '}
								<strong>Actions</strong>
								{' menu, choose '}
								<strong>Copy audit prompt</strong>
								{', run the prompt against the component in the repository, then record and publish the completed result to the '}
								<Link href={LEDGER_WIKI_URL}>central audit ledger</Link>
								{'. Components without a recorded result remain '}
								<strong>TBD</strong>
								{'.'}
							</Text>
							<Link href={RUBRIC_URL}>How components are graded, and how to get one audited</Link>
						</VStack>
						<Text type="supporting" color="secondary">Last updated 2026-03-22 (embedded snapshot)</Text>
					</HStack>

					<Toolbar
						label="Audit filters"
						startContent={
							<HStack gap={3} vAlign="center" wrap="wrap">
								<Selector
									label="Audit status"
									isLabelHidden
									options={[{ value: '', label: 'All statuses' }, ...AUDIT_FILTERS]}
									value={auditFilter ?? ''}
									onValueChange={(v: string | null) => setAuditFilter(v || null)}
									placeholder="All statuses"
								/>
								<Selector
									label="Package"
									isLabelHidden
									options={[{ value: '', label: 'All packages' }, ...PACKAGES]}
									value={packageFilter ?? ''}
									onValueChange={(v: string | null) => setPackageFilter(v || null)}
									placeholder="All packages"
								/>
								<TextInput
									label="Filter components"
									isLabelHidden
									value={query}
									onChange={setQuery}
									placeholder="Filter components…"
									hasClear
								/>
								{hasActiveFilters && (
									<Button
										label="Clear filters"
										variant="secondary"
										clickAction={() => { setQuery(''); setAuditFilter(null); setPackageFilter(null) }}
									/>
								)}
							</HStack>
						}
					/>

					<HStack gap={4} wrap="wrap">
						<Stat label="Audited" value={String(stats.audited)} description={`Of ${ROSTER.length} components`} />
						<Stat label="Not started" value={String(stats.notStarted)} description="Awaiting a first audit" />
						<Stat
							label="Average score"
							value={stats.average == null ? '—' : stats.average.toFixed(1)}
							description={stats.scored > 0 ? `Across ${stats.scored} scored components` : 'No scored components'}
						/>
					</HStack>
				</VStack>
			</Section>

			<Section variant="transparent" padding={4}>
				<Table
					data={visible}
					columns={columns}
					plugins={{ auditDetails: auditRowPlugin }}
					idKey="id"
					density="balanced"
					dividers="rows"
					hasHover
				/>
			</Section>
		</VStack>

		{selectedRow != null && (
			<Dialog
				isOpen={true}
				onOpenChange={() => setSelectedRowId(null)}
				accessibilityLabel={`${selectedRow.component} ${selectedRow.package} audit details`}>
				<VStack gap={4} padding={4} width={520}>
					<Heading level={2}>{selectedRow.component} audit</Heading>
					<MetadataList columns="multi" label={{ position: 'top' }}>
						<MetadataListItem label="Score">{typeof selectedRow.score === 'number' ? selectedRow.score.toFixed(1) : '—'}</MetadataListItem>
						<MetadataListItem label="Grade">{selectedRow.grade ?? 'TBD'}</MetadataListItem>
						<MetadataListItem label="Rubric">{`v${selectedRow.rubricVersion ?? '—'}`}</MetadataListItem>
						<MetadataListItem label="Blocks">{String(selectedRow.blocks)}</MetadataListItem>
						<MetadataListItem label="Last audited">{selectedRow.lastAudited ?? 'never'}</MetadataListItem>
						<MetadataListItem label="Weakest area">{selectedRow.weakest ?? '—'}</MetadataListItem>
					</MetadataList>
					<Divider />
					<Text>{selectedRow.summary}</Text>
					<HStack gap={2} hAlign="end">
						<Button label="Close" variant="secondary" clickAction={() => setSelectedRowId(null)} />
					</HStack>
				</VStack>
			</Dialog>
		)}
	</>
}

function selectedRowSafe(v: string | null): string {
	return v ?? '—'
}
