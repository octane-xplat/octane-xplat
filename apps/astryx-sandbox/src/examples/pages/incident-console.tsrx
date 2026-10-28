// Port of upstream templates/pages/incident-console/page.tsx (Astryx 0.6.4,
// MIT) — route /templates/incident-console/.
// GAPS: `usePowerSearchConfig` → public `createPowerSearchConfig` (same
// config/applyFilters contract); inspector actions are inert (upstream has no
// state mutations either).
import { useMemo, useState } from 'octane'
import {
	Button, createPowerSearchConfig, Divider, EmptyState, Heading, HStack,
	Icon, Layout, LayoutContent, LayoutHeader, LayoutPanel, List, ListItem,
	MetadataList, MetadataListItem, PowerSearch, ResizeHandle,
	SegmentedControl, SegmentedControlItem, StackItem, StatusDot, Text,
	Timestamp, Token, useMediaQuery, useResizable, VStack,
} from '@octane-xplat/ui'
import type { PowerSearchFilterFor } from '@octane-xplat/ui'

type Severity = 'sev1' | 'sev2' | 'sev3'
type IncidentStatus = 'investigating' | 'mitigated' | 'resolved'

interface TimelineEvent {
	at: string
	label: string
	detail: string
}

interface Incident {
	id: string
	title: string
	service: string
	severity: Severity
	status: IncidentStatus
	commander: string
	startedAt: string
	impact: string
	timeline: TimelineEvent[]
}

const INCIDENTS: Incident[] = [
	{
		id: 'INC-2417',
		title: 'Checkout API elevated 5xx rate',
		service: 'checkout-api',
		severity: 'sev1',
		status: 'investigating',
		commander: 'Priya Raman',
		startedAt: '2026-06-30T21:14:00Z',
		impact: '12% of checkout requests failing in us-east',
		timeline: [
			{ at: '2026-06-30T21:14:00Z', label: 'Incident declared', detail: 'Paging monitor: checkout-api 5xx > 5% for 10m' },
			{ at: '2026-06-30T21:19:00Z', label: 'Commander assigned', detail: 'Priya Raman took command' },
			{ at: '2026-06-30T21:31:00Z', label: 'Suspect identified', detail: 'Deploy 8f31c2 correlates with error onset' },
		],
	},
	{
		id: 'INC-2416',
		title: 'Search indexing lag above 30 minutes',
		service: 'search-indexer',
		severity: 'sev2',
		status: 'investigating',
		commander: 'Marcus Webb',
		startedAt: '2026-06-30T19:42:00Z',
		impact: 'New listings not searchable; stale results served',
		timeline: [
			{ at: '2026-06-30T19:42:00Z', label: 'Incident declared', detail: 'Indexing lag alarm crossed 30m threshold' },
			{ at: '2026-06-30T20:05:00Z', label: 'Mitigation attempted', detail: 'Doubled indexer worker pool; lag still climbing' },
		],
	},
	{
		id: 'INC-2415',
		title: 'Webhook delivery retries exhausting queue',
		service: 'webhooks',
		severity: 'sev3',
		status: 'investigating',
		commander: 'Ana Duarte',
		startedAt: '2026-06-30T18:20:00Z',
		impact: 'Third-party webhook delivery delayed up to 15m',
		timeline: [
			{ at: '2026-06-30T18:20:00Z', label: 'Incident declared', detail: 'Queue depth alarm on webhook-delivery' },
		],
	},
	{
		id: 'INC-2414',
		title: 'Payments settlement job stalled',
		service: 'payments',
		severity: 'sev1',
		status: 'mitigated',
		commander: 'Priya Raman',
		startedAt: '2026-06-30T14:03:00Z',
		impact: 'End-of-day settlement delayed by up to 4h',
		timeline: [
			{ at: '2026-06-30T14:03:00Z', label: 'Incident declared', detail: 'Settlement job heartbeat missed twice' },
			{ at: '2026-06-30T14:40:00Z', label: 'Mitigation applied', detail: 'Job restarted with backfill window; queue draining' },
		],
	},
	{
		id: 'INC-2413',
		title: 'Edge cache misses elevated in eu-west',
		service: 'edge-cdn',
		severity: 'sev3',
		status: 'resolved',
		commander: 'Marcus Webb',
		startedAt: '2026-06-29T22:10:00Z',
		impact: 'Higher origin load; no user-facing errors',
		timeline: [
			{ at: '2026-06-29T22:10:00Z', label: 'Incident declared', detail: 'Cache-hit ratio dropped below 85%' },
			{ at: '2026-06-29T23:05:00Z', label: 'Resolved', detail: 'PoP cache warmed; ratio recovered to 96%' },
		],
	},
]

const STATUS_ORDER: IncidentStatus[] = ['investigating', 'mitigated', 'resolved']
const STATUS_LABEL: Record<IncidentStatus, string> = {
	investigating: 'Investigating',
	mitigated: 'Mitigated',
	resolved: 'Resolved',
}
const STATUS_TOKEN_COLOR: Record<IncidentStatus, 'red' | 'yellow' | 'green'> = {
	investigating: 'red',
	mitigated: 'yellow',
	resolved: 'green',
}
const SEVERITY_DOT: Record<Severity, 'error' | 'warning' | 'neutral'> = {
	sev1: 'error',
	sev2: 'warning',
	sev3: 'neutral',
}

const SERVICE_VALUES = [
	{ value: 'checkout-api', label: 'checkout-api' },
	{ value: 'search-indexer', label: 'search-indexer' },
	{ value: 'webhooks', label: 'webhooks' },
	{ value: 'payments', label: 'payments' },
	{ value: 'edge-cdn', label: 'edge-cdn' },
	{ value: 'notifications', label: 'notifications' },
]

const SEVERITY_VALUES = [
	{ value: 'sev1', label: 'SEV1' },
	{ value: 'sev2', label: 'SEV2' },
	{ value: 'sev3', label: 'SEV3' },
]

const { config, applyFilters } = createPowerSearchConfig(
	[
		{ key: 'title', type: 'string', label: 'Title' },
		{ key: 'service', type: 'enum', label: 'Service', enumValues: SERVICE_VALUES },
		{ key: 'severity', type: 'enum', label: 'Severity', enumValues: SEVERITY_VALUES },
		{ key: 'commander', type: 'string', label: 'Commander' },
	],
	'Incidents',
)

const styles: Record<string, any> = {
	searchRow: { paddingInline: 'var(--spacing-4)', paddingBlock: 'var(--spacing-3)' },
	groupHeader: {
		paddingInline: 'var(--spacing-3)',
		paddingTop: 'var(--spacing-3)',
		paddingBottom: 'var(--spacing-1)',
	},
	inspector: { padding: 'var(--spacing-4)' },
}

function IncidentRows(props: {
	incidents: Incident[]
	selectedId: string | null
	onSelect: (id: string) => void
}) @{
	const groups = STATUS_ORDER.map((status) => ({
		status,
		items: props.incidents.filter((incident) => incident.status === status),
	})).filter((group) => group.items.length > 0)

	if (groups.length === 0) {
		return (
			<EmptyState
				title="No matching incidents"
				description="Adjust the status filter or clear search filters."
				icon={<Icon name="sandbox-bell-alert" size={24} />}
			/>
		)
	}

	<VStack gap={0}>
		{groups.map((group) => (
			<VStack gap={0} key={group.status}>
				<HStack gap={2} vAlign="center" style={styles.groupHeader}>
					<Text type="label" color="secondary">
						{STATUS_LABEL[group.status]}
					</Text>
					<Text type="supporting" color="secondary">
						{group.items.length}
					</Text>
				</HStack>
				<List density="compact" hasDividers>
					{group.items.map((incident) => (
						<ListItem
							key={incident.id}
							label={incident.title}
							description={`${incident.id} · ${incident.service} · ${incident.impact}`}
							startContent={
								<StatusDot
									variant={SEVERITY_DOT[incident.severity]}
									label={incident.severity.toUpperCase()}
									isPulsing={incident.severity === 'sev1' && incident.status === 'investigating'}
								/>
							}
							endContent={
								<HStack gap={3} vAlign="center">
									<Token
										size="sm"
										color={STATUS_TOKEN_COLOR[incident.status]}
										label={STATUS_LABEL[incident.status]}
									/>
									<Timestamp value={Date.parse(incident.startedAt)} valueUnit="unix-milliseconds" format="relative" color="secondary" />
								</HStack>
							}
							onPress={() => props.onSelect(incident.id)}
							isSelected={incident.id === props.selectedId}
						/>
					))}
				</List>
			</VStack>
		))}
	</VStack>
}

function IncidentInspector(props: { incident: Incident }) @{
	const nextAction =
		props.incident.status === 'investigating'
			? 'Mark mitigated'
			: props.incident.status === 'mitigated'
				? 'Resolve'
				: 'Reopen'

	<VStack gap={4} style={styles.inspector}>
		<VStack gap={2}>
			<HStack gap={2} vAlign="center">
				<StatusDot
					variant={SEVERITY_DOT[props.incident.severity]}
					label={props.incident.severity.toUpperCase()}
				/>
				<Text type="supporting" color="secondary">
					{props.incident.id}
				</Text>
				<Token
					size="sm"
					color={STATUS_TOKEN_COLOR[props.incident.status]}
					label={STATUS_LABEL[props.incident.status]}
				/>
			</HStack>
			<Heading level={2}>{props.incident.title}</Heading>
		</VStack>

		<HStack gap={2}>
			<Button label={nextAction} size="sm" clickAction={() => {}} />
			<Button label="Escalate" variant="secondary" size="sm" clickAction={() => {}} />
		</HStack>

		<Divider />

		<MetadataList columns="single">
			<MetadataListItem label="Service">
				<Text type="body">{props.incident.service}</Text>
			</MetadataListItem>
			<MetadataListItem label="Severity">
				<Text type="body">{props.incident.severity.toUpperCase()}</Text>
			</MetadataListItem>
			<MetadataListItem label="Commander">
				<Text type="body">{props.incident.commander}</Text>
			</MetadataListItem>
			<MetadataListItem label="Started">
				<Timestamp value={Date.parse(props.incident.startedAt)} valueUnit="unix-milliseconds" format="date_time" />
			</MetadataListItem>
			<MetadataListItem label="Impact">
				<Text type="body">{props.incident.impact}</Text>
			</MetadataListItem>
		</MetadataList>

		<Divider />

		<VStack gap={2}>
			<Heading level={3}>Timeline</Heading>
			<List density="compact">
				{props.incident.timeline.map((event) => (
					<ListItem
						key={`${event.at}-${event.label}`}
						label={event.label}
						description={event.detail}
						endContent={<Timestamp value={Date.parse(event.at)} valueUnit="unix-milliseconds" format="time" color="secondary" />}
					/>
				))}
			</List>
		</VStack>
	</VStack>
}

export function IncidentConsoleTemplate() @{
	const [statusFilter, setStatusFilter] = useState('all')
	const [filters, setFilters] = useState<ReadonlyArray<PowerSearchFilterFor<typeof config>>>([])
	const [selectedId, setSelectedId] = useState<string | null>(INCIDENTS[0].id)

	const isNarrow = useMediaQuery('(max-width: 1024px)')

	const inspectorPanel = useResizable({
		defaultSize: 380,
		minSize: 320,
		maxSize: 480,
	})

	const visible = useMemo(() => {
		const searched = applyFilters(filters, INCIDENTS)
		return statusFilter === 'all'
			? searched
			: searched.filter((incident) => incident.status === statusFilter)
	}, [filters, statusFilter])

	const selected = visible.find((incident) => incident.id === selectedId) ?? null
	const openCount = INCIDENTS.filter((incident) => incident.status === 'investigating').length

	<Layout
		height="fill"
		header={
			<LayoutHeader hasDivider>
				<HStack gap={3} vAlign="center">
					<StackItem size="fill">
						<HStack gap={2} vAlign="center">
							<Heading level={1}>Incidents</Heading>
							<Text type="supporting" color="secondary">
								{openCount} investigating
							</Text>
						</HStack>
					</StackItem>
					<SegmentedControl
						label="Status filter"
						value={statusFilter}
						onValueChange={(v) => setStatusFilter(v ?? '')}
						size="sm"
					>
						<SegmentedControlItem label="All" value="all" />
						<SegmentedControlItem label="Investigating" value="investigating" />
						<SegmentedControlItem label="Mitigated" value="mitigated" />
						<SegmentedControlItem label="Resolved" value="resolved" />
					</SegmentedControl>
				</HStack>
				<div style={styles.searchRow}>
					<PowerSearch
						config={config}
						filters={filters}
						onChange={(v) => setFilters(v ?? '')}
						placeholder="Search incidents…"
						startIcon={<Icon name="sandbox-magnifying-glass" size={16} />}
					/>
				</div>
			</LayoutHeader>
		}
		content={
			<LayoutContent padding={0}>
				<IncidentRows incidents={visible} selectedId={selectedId} onSelect={setSelectedId} />
			</LayoutContent>
		}
		end={
			isNarrow || selected == null ? undefined : (
				<>
					<ResizeHandle
						direction="horizontal"
						hasDivider
						isReversed
						isAlwaysVisible={false}
						resizable={inspectorPanel.props}
						label="Resize inspector"
					/>
					<LayoutPanel width={inspectorPanel.size} padding={0}>
						<IncidentInspector incident={selected} />
					</LayoutPanel>
				</>
			)
		}
	/>
}
