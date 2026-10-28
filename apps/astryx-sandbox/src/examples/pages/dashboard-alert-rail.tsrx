// Port of upstream templates/pages/dashboard-alert-rail/page.tsx (Astryx
// 0.6.4, MIT) — route /templates/dashboard-alert-rail/.
// GAPS: recharts (latency/volume LineCharts + sparklines) → app-local helpers
// in ./charts.tsrx (recorded finding); uptime strips are div cells; the
// alerts rail is read-only in the port (upstream has no actions either).
import { useMemo, useState } from 'octane'
import {
	Badge, Card, Divider, EmptyState, Grid, Heading, HStack, Icon, Layout,
	LayoutContent, LayoutHeader, LayoutPanel, List, ListItem,
	SegmentedControl, SegmentedControlItem, Selector, StackItem, StatusDot,
	Table, Text, Timestamp, Token, useMediaQuery, VStack,
} from '@octane-xplat/ui'
import type { TableColumn } from '@octane-xplat/ui'
import { ChartLines, ChartSparkline } from './charts'

type Environment = 'production' | 'staging' | 'development'
type TimeWindow = '1h' | '1d' | '7d'
type HealthStatus = 'healthy' | 'warning' | 'critical'
type AlertState = 'firing' | 'acknowledged' | 'resolved'
type UptimeStatus = 'operational' | 'degraded' | 'down'

const STATUS_DOT: Record<HealthStatus, 'success' | 'warning' | 'error'> = {
	healthy: 'success',
	warning: 'warning',
	critical: 'error',
}

const STATUS_LABEL: Record<HealthStatus, string> = {
	healthy: 'Healthy',
	warning: 'Degraded',
	critical: 'Critical',
}

const SEVERITY_RANK: Record<HealthStatus, number> = {
	critical: 0,
	warning: 1,
	healthy: 2,
}

const ENV_OPTIONS = [
	{ value: 'production', label: 'Production' },
	{ value: 'staging', label: 'Staging' },
	{ value: 'development', label: 'Development' },
]

const REGION_OPTIONS = [
	{ value: 'all', label: 'All regions' },
	{ value: 'us-east-1', label: 'us-east-1' },
	{ value: 'us-west-2', label: 'us-west-2' },
	{ value: 'eu-west-1', label: 'eu-west-1' },
	{ value: 'ap-southeast-1', label: 'ap-southeast-1' },
]

interface Kpi {
	key: string
	label: string
	value: string
	status: HealthStatus
	statusLabel: string
	delta: string
	deltaPositive: boolean
}

const KPI_BY_ENV: Record<Environment, Kpi[]> = {
	production: [
		{ key: 'health', label: 'Overall health', value: '98.6%', status: 'healthy', statusLabel: 'Healthy', delta: '+0.3%', deltaPositive: true },
		{ key: 'error', label: 'Error rate', value: '1.84%', status: 'warning', statusLabel: 'Elevated', delta: '+0.9%', deltaPositive: false },
		{ key: 'latency', label: 'p99 latency', value: '512 ms', status: 'warning', statusLabel: 'Above target', delta: '+84 ms', deltaPositive: false },
		{ key: 'availability', label: 'Availability', value: '99.98%', status: 'healthy', statusLabel: 'Operational', delta: '+0.01%', deltaPositive: true },
	],
	staging: [
		{ key: 'health', label: 'Overall health', value: '99.4%', status: 'healthy', statusLabel: 'Healthy', delta: '+0.1%', deltaPositive: true },
		{ key: 'error', label: 'Error rate', value: '0.42%', status: 'healthy', statusLabel: 'Nominal', delta: '-0.2%', deltaPositive: true },
		{ key: 'latency', label: 'p99 latency', value: '338 ms', status: 'healthy', statusLabel: 'Within target', delta: '-12 ms', deltaPositive: true },
		{ key: 'availability', label: 'Availability', value: '99.99%', status: 'healthy', statusLabel: 'Operational', delta: '+0.00%', deltaPositive: true },
	],
	development: [
		{ key: 'health', label: 'Overall health', value: '96.2%', status: 'warning', statusLabel: 'Noisy', delta: '-1.2%', deltaPositive: false },
		{ key: 'error', label: 'Error rate', value: '4.10%', status: 'critical', statusLabel: 'Elevated', delta: '+2.4%', deltaPositive: false },
		{ key: 'latency', label: 'p99 latency', value: '890 ms', status: 'warning', statusLabel: 'Above target', delta: '+210 ms', deltaPositive: false },
		{ key: 'availability', label: 'Availability', value: '99.61%', status: 'healthy', statusLabel: 'Operational', delta: '-0.04%', deltaPositive: false },
	],
}

const SPARKLINES: Record<string, number[]> = {
	health: [99.1, 99.0, 98.8, 98.9, 98.7, 98.6, 98.6],
	error: [0.8, 0.9, 1.2, 1.0, 1.5, 1.7, 1.84],
	latency: [410, 430, 455, 442, 489, 501, 512],
	availability: [99.92, 99.94, 99.95, 99.96, 99.97, 99.98, 99.98],
}

const SPARK_LEN: Record<TimeWindow, number> = { '1h': 3, '1d': 7, '7d': 7 }
const ENV_LATENCY_FACTOR: Record<Environment, number> = { production: 1, staging: 0.7, development: 1.4 }

interface HostRow extends Record<string, unknown> {
	id: string
	service: string
	environment: Environment
	region: string
	instances: number
	rpm: number
	errorRate: number
	p99: number
	status: HealthStatus
}

const HOST_ROWS: HostRow[] = [
	{ id: '1', service: 'checkout-api', environment: 'production', region: 'us-east-1', instances: 24, rpm: 9240, errorRate: 2.1, p99: 512, status: 'warning' },
	{ id: '2', service: 'checkout-api', environment: 'production', region: 'us-west-2', instances: 18, rpm: 6110, errorRate: 0.3, p99: 214, status: 'healthy' },
	{ id: '3', service: 'checkout-api', environment: 'production', region: 'eu-west-1', instances: 12, rpm: 3980, errorRate: 0.4, p99: 236, status: 'healthy' },
	{ id: '4', service: 'search-indexer', environment: 'production', region: 'us-east-1', instances: 16, rpm: 4120, errorRate: 5.8, p99: 1180, status: 'critical' },
	{ id: '5', service: 'search-indexer', environment: 'production', region: 'ap-southeast-1', instances: 8, rpm: 2040, errorRate: 0.9, p99: 342, status: 'healthy' },
	{ id: '6', service: 'payments', environment: 'production', region: 'us-east-1', instances: 14, rpm: 5480, errorRate: 0.2, p99: 188, status: 'healthy' },
	{ id: '7', service: 'checkout-api', environment: 'staging', region: 'us-east-1', instances: 4, rpm: 480, errorRate: 0.4, p99: 298, status: 'healthy' },
	{ id: '8', service: 'search-indexer', environment: 'staging', region: 'us-east-1', instances: 3, rpm: 210, errorRate: 0.1, p99: 402, status: 'healthy' },
	{ id: '9', service: 'auth', environment: 'development', region: 'us-west-2', instances: 2, rpm: 96, errorRate: 9.4, p99: 1410, status: 'critical' },
	{ id: '10', service: 'checkout-api', environment: 'development', region: 'us-west-2', instances: 2, rpm: 74, errorRate: 2.2, p99: 620, status: 'warning' },
]

interface Alert {
	id: string
	severity: HealthStatus
	title: string
	service: string
	at: string
	state: AlertState
}

const ALERTS: Alert[] = [
	{ id: 'AL-8842', severity: 'critical', title: 'search-indexer 5xx rate above 5%', service: 'search-indexer · us-east-1', at: '2026-06-30T21:14:00+00:00', state: 'firing' },
	{ id: 'AL-8841', severity: 'warning', title: 'checkout-api p99 latency above 500ms', service: 'checkout-api · us-east-1', at: '2026-06-30T21:02:00+00:00', state: 'firing' },
	{ id: 'AL-8840', severity: 'warning', title: 'edge-cdn cache hit ratio degraded', service: 'edge-cdn · eu-west-1', at: '2026-06-30T20:41:00+00:00', state: 'acknowledged' },
	{ id: 'AL-8839', severity: 'critical', title: 'auth error rate spike in dev cluster', service: 'auth · us-west-2', at: '2026-06-30T20:18:00+00:00', state: 'acknowledged' },
	{ id: 'AL-8838', severity: 'warning', title: 'notifications queue depth climbing', service: 'notifications · ap-southeast-1', at: '2026-06-30T19:55:00+00:00', state: 'firing' },
	{ id: 'AL-8837', severity: 'warning', title: 'payments settlement job heartbeat missed', service: 'payments · us-east-1', at: '2026-06-30T18:30:00+00:00', state: 'resolved' },
]

const ALERT_ORDER: AlertState[] = ['firing', 'acknowledged', 'resolved']

const ALERT_STATE_TOKEN: Record<AlertState, { color: 'red' | 'yellow' | 'green'; label: string }> = {
	firing: { color: 'red', label: 'Firing' },
	acknowledged: { color: 'yellow', label: 'Acknowledged' },
	resolved: { color: 'green', label: 'Resolved' },
}

const LATENCY_LINES = [
	{ name: 'p50', color: 'var(--color-data-categorical-blue, #0171E3)', base: 190, noise: 24 },
	{ name: 'p95', color: 'var(--color-data-categorical-orange, #EB6E00)', base: 360, noise: 44 },
	{ name: 'p99', color: 'var(--color-data-categorical-red, #F5394F)', base: 480, noise: 72 },
]

const TRAFFIC_LINES = [
	{ name: 'us-east-1', color: 'var(--color-data-categorical-blue, #0171E3)', base: 9800, noise: 900 },
	{ name: 'us-west-2', color: 'var(--color-data-categorical-green, #0B991F)', base: 6400, noise: 720 },
	{ name: 'eu-west-1', color: 'var(--color-data-categorical-purple, #6B1EFD)', base: 4200, noise: 560 },
	{ name: 'ap-southeast-1', color: 'var(--color-data-categorical-teal, #08A3A3)', base: 2600, noise: 420 },
]

const UPTIME_DAYS = 30

const UPTIME_COLOR: Record<UptimeStatus, string> = {
	operational: 'var(--color-data-categorical-green, #0B991F)',
	degraded: 'var(--color-data-categorical-orange, #EB6E00)',
	down: 'var(--color-data-categorical-red, #F5394F)',
}

const UPTIME_LABEL: Record<UptimeStatus, string> = {
	operational: 'Operational',
	degraded: 'Degraded',
	down: 'Down',
}

const UPTIME_ENV_RISK: Record<Environment, number> = { production: 1, staging: 0.6, development: 2.2 }
const UPTIME_STATUS_RISK: Record<HealthStatus, number> = { healthy: 1, warning: 3, critical: 6 }
const DAY_UPTIME: Record<UptimeStatus, number> = { operational: 1, degraded: 0.965, down: 0.82 }
const UPTIME_TODAY: Record<HealthStatus, UptimeStatus> = { healthy: 'operational', warning: 'degraded', critical: 'down' }

function hashNoise(i: number, seed: number): number {
	const s = Math.sin(i * 127.1 + seed * 311.7) * 43758.5453
	return s - Math.floor(s)
}

interface ServiceUptime {
	service: string
	status: HealthStatus
	days: UptimeStatus[]
	uptime: number
	degradedDays: number
	downDays: number
}

function seedForService(service: string): number {
	let h = 7
	for (let i = 0; i < service.length; i++) {
		h = (h * 31 + service.charCodeAt(i)) % 9973
	}
	return h
}

function buildUptime(service: string, environment: Environment, status: HealthStatus): ServiceUptime {
	const seed = seedForService(service)
	const risk = UPTIME_ENV_RISK[environment] * UPTIME_STATUS_RISK[status]
	const downWobble = 0.6 + 0.8 * hashNoise(seed, 3.7)
	const degradedWobble = 0.6 + 0.8 * hashNoise(seed, 5.9)
	const downCount = Math.round(UPTIME_DAYS * Math.min(0.09, 0.005 * risk) * downWobble)
	const degradedCount = Math.round(UPTIME_DAYS * Math.min(0.32, 0.02 * risk) * degradedWobble)
	const ranked = [...Array(UPTIME_DAYS).keys()].sort(
		(a, b) => hashNoise(b, seed) - hashNoise(a, seed),
	)
	const days: UptimeStatus[] = new Array(UPTIME_DAYS).fill('operational')
	for (let k = 0; k < downCount; k++) {days[ranked[k]] = 'down'}
	for (let k = downCount; k < downCount + degradedCount; k++) {days[ranked[k]] = 'degraded'}
	days[UPTIME_DAYS - 1] = UPTIME_TODAY[status]
	const cleanDay = DAY_UPTIME.operational - 0.02 - hashNoise(seed, 11.3) * 0.06
	let served = 0
	let degradedDays = 0
	let downDays = 0
	for (let i = 0; i < UPTIME_DAYS; i++) {
		const day = days[i]
		if (day === 'operational') {
			served += cleanDay - hashNoise(i, seed + 1) * 0.02
		} else {
			served += DAY_UPTIME[day]
			if (day === 'degraded') {degradedDays++} else {downDays++}
		}
	}
	return { service, status, days, uptime: served / UPTIME_DAYS, degradedDays, downDays }
}

function dayLabel(i: number): string {
	const ago = UPTIME_DAYS - 1 - i
	if (ago === 0) {return 'Today'}
	return ago === 1 ? 'Yesterday' : `${ago} days ago`
}

function genSeries(base: number, noise: number, seed: number, n = 24): number[] {
	return Array.from({ length: n }, (_, i) =>
		Math.round(base + Math.sin(i * 0.7 + seed) * noise + (hashNoise(i, seed) - 0.5) * noise),
	)
}

function LegendDot(props: { color: string; label: string }) @{
	<HStack gap={2} vAlign="center">
		<Icon name="sandbox-stop" size={12} color={props.color} />
		<Text type="supporting" color="secondary">
			{props.label}
		</Text>
	</HStack>
}

function KpiTile(props: { kpi: Kpi; spark: number[] }) @{
	<Card padding={4}>
		<VStack gap={2}>
			<HStack hAlign="between" vAlign="center">
				<Text type="label" color="secondary">
					{props.kpi.label}
				</Text>
				<StatusDot
					variant={STATUS_DOT[props.kpi.status]}
					label={props.kpi.statusLabel}
					isPulsing={props.kpi.status === 'critical'}
				/>
			</HStack>
			<HStack gap={3} vAlign="center">
				<Heading level={2}>{props.kpi.value}</Heading>
				<HStack gap={1} vAlign="center">
					<Icon
						name={props.kpi.deltaPositive ? 'sandbox-arrow-trending-up' : 'sandbox-arrow-trending-down'}
						size={12}
						color={props.kpi.deltaPositive ? 'success' : 'error'}
					/>
					<Text type="supporting" style={{ color: props.kpi.deltaPositive ? 'var(--color-text-success, #067647)' : 'var(--color-text-error, #d92d20)' }}>
						{props.kpi.delta}
					</Text>
				</HStack>
			</HStack>
			<ChartSparkline
				data={props.spark}
				color={props.kpi.status === 'healthy' ? '#22c55e' : props.kpi.status === 'warning' ? '#f59e0b' : '#ef4444'}
				height={24}
			/>
		</VStack>
	</Card>
}

function MetricChart(props: {
	title: string
	subtitle: string
	lines: { name: string; color: string; base: number; noise: number }[]
	scale: number
	seed: number
}) @{
	<Card padding={6}>
		<VStack gap={4}>
			<VStack gap={1}>
				<Heading level={3}>{props.title}</Heading>
				<Text type="supporting" color="secondary">
					{props.subtitle}
				</Text>
			</VStack>
			<ChartLines
				height={220}
				series={props.lines.map((l, i) => ({
					name: l.name,
					data: genSeries(Math.round(l.base * props.scale), l.noise, props.seed + i),
					color: l.color,
				}))}
			/>
			<HStack gap={6} vAlign="center" wrap="wrap">
				{props.lines.map((l) => (
					<LegendDot key={l.name} color={l.color} label={l.name} />
				))}
			</HStack>
		</VStack>
	</Card>
}

function RailSection(props: {
	icon: string
	iconColor?: string
	title: string
	subtitle: string
	badge?: unknown
	children?: unknown
}) @{
	<VStack gap={0}>
		<VStack gap={1} style={{ padding: 'var(--spacing-4)' }}>
			<HStack gap={2} vAlign="center">
				<Icon name={props.icon} size={16} color={props.iconColor ?? 'secondary'} />
				<StackItem size="fill">
					<Heading level={3}>{props.title}</Heading>
				</StackItem>
				{props.badge}
			</HStack>
			<Text type="supporting" color="secondary">
				{props.subtitle}
			</Text>
		</VStack>
		<Divider />
		{props.children}
	</VStack>
}

function AlertsFeed() @{
	const groups = ALERT_ORDER.map((state) => ({
		state,
		items: ALERTS.filter((a) => a.state === state),
	})).filter((g) => g.items.length > 0)

	const firing = ALERTS.filter((a) => a.state === 'firing').length

	<RailSection
		icon="sandbox-bell-alert"
		iconColor={firing > 0 ? 'error' : 'secondary'}
		title="Active alerts"
		subtitle={`${ALERTS.length} in the last 24h · newest first`}
		badge={
			<Badge label={`${firing} firing`} variant={firing > 0 ? 'error' : 'neutral'} />
		}
	>
		{groups.length === 0 ? (
			<EmptyState
				title="All clear"
				description="No active alerts across the selected environment."
				icon={<Icon name="sandbox-check-circle" size={24} color={'var(--color-text-success, #067647)'} />}
				isCompact
			/>
		) : (
			groups.map((group) => (
				<List key={group.state} density="compact" hasDividers>
					{group.items.map((alert) => (
						<ListItem
							key={alert.id}
							label={alert.title}
							description={alert.service}
							startContent={
								<StatusDot
									variant={STATUS_DOT[alert.severity]}
									label={alert.severity}
									isPulsing={alert.state === 'firing' && alert.severity === 'critical'}
								/>
							}
							endContent={
								<VStack gap={1} hAlign="end">
									<Token
										size="sm"
										color={ALERT_STATE_TOKEN[alert.state].color}
										label={ALERT_STATE_TOKEN[alert.state].label}
									/>
									<Timestamp
										value={Date.parse(alert.at)} valueUnit="unix-milliseconds"
										format="relative"
										color="secondary"
									/>
								</VStack>
							}
						/>
					))}
				</List>
			))
		)}
	</RailSection>
}

function errorColor(rate: number): 'red' | 'yellow' | 'green' {
	if (rate >= 5) {return 'red'}
	return rate >= 1.5 ? 'yellow' : 'green'
}

function formatRpm(rpm: number): string {
	return rpm >= 1000 ? `${(rpm / 1000).toFixed(1)}k rpm` : `${rpm} rpm`
}

const hostColumns: TableColumn<HostRow>[] = [
	{
		key: 'service',
		header: 'Service',
		renderCell: (row: HostRow) => <Text weight="semibold">{row.service}</Text>,
	},
	{
		key: 'region',
		header: 'Region',
		renderCell: (row: HostRow) => <Text>{row.region}</Text>,
	},
	{
		key: 'instances',
		header: 'Instances',
		renderCell: (row: HostRow) => <Text>{row.instances}</Text>,
	},
	{
		key: 'rpm',
		header: 'Traffic',
		renderCell: (row: HostRow) => <Text>{formatRpm(row.rpm)}</Text>,
	},
	{
		key: 'errorRate',
		header: 'Errors',
		renderCell: (row: HostRow) => (
			<Token size="sm" color={errorColor(row.errorRate)} label={`${row.errorRate.toFixed(1)}%`} />
		),
	},
	{
		key: 'p99',
		header: 'p99',
		renderCell: (row: HostRow) => <Text color="secondary">{row.p99} ms</Text>,
	},
	{
		key: 'status',
		header: 'Status',
		renderCell: (row: HostRow) => (
			<StatusDot variant={STATUS_DOT[row.status]} label={STATUS_LABEL[row.status]} />
		),
	},
]

function UptimeStrip(props: { entry: ServiceUptime }) @{
	const summary = `${UPTIME_DAYS}-day uptime for ${props.entry.service}: ${props.entry.degradedDays} degraded ${
		props.entry.degradedDays === 1 ? 'day' : 'days'
	}, ${props.entry.downDays} with downtime.`

	<div
		style={{ display: 'flex', gap: 2, width: '100%' }}
		role="img"
		aria-label={summary}
	>
		{props.entry.days.map((day, i) => (
			<div
				key={i}
				style={{
					flex: 1,
					height: 24,
					borderRadius: 3,
					backgroundColor: UPTIME_COLOR[day],
				}}
				title={`${dayLabel(i)} — ${UPTIME_LABEL[day]}`}
			/>
		))}
	</div>
}

function UptimeRow(props: { entry: ServiceUptime }) @{
	<VStack gap={2}>
		<HStack gap={3} vAlign="center" hAlign="between">
			<HStack gap={2} vAlign="center">
				<StatusDot
					variant={STATUS_DOT[props.entry.status]}
					label={STATUS_LABEL[props.entry.status]}
					isPulsing={props.entry.status === 'critical'}
				/>
				<Heading level={4}>{props.entry.service}</Heading>
			</HStack>
			<Text type="supporting" color="secondary">
				{props.entry.uptime.toFixed(2)}% uptime
			</Text>
		</HStack>
		<UptimeStrip entry={props.entry} />
	</VStack>
}

export function DashboardAlertRailTemplate() @{
	const [timeWindow, setTimeWindow] = useState<TimeWindow>('1d')
	const [environment, setEnvironment] = useState<Environment>('production')
	const [region, setRegion] = useState('all')

	const isNarrow = useMediaQuery('(max-width: 1024px)')

	const kpis = KPI_BY_ENV[environment]
	const sparkLen = SPARK_LEN[timeWindow]

	const rows = useMemo(
		() =>
			HOST_ROWS.filter(
				(r) => r.environment === environment && (region === 'all' || r.region === region),
			),
		[environment, region],
	)

	const breakdownContext = `${ENV_OPTIONS.find((e) => e.value === environment)?.label} · ${REGION_OPTIONS.find((r) => r.value === region)?.label}`

	const uptimeEntries = useMemo(() => {
		const worst = new Map<string, HealthStatus>()
		for (const row of rows) {
			const prev = worst.get(row.service)
			if (prev === undefined || SEVERITY_RANK[row.status] < SEVERITY_RANK[prev]) {
				worst.set(row.service, row.status)
			}
		}
		return [...worst.entries()]
			.sort((a, b) => a[0].localeCompare(b[0]))
			.map(([service, status]) => buildUptime(service, environment, status))
	}, [rows, environment])

	<Layout
		height="fill"
		header={
			<LayoutHeader padding={6} hasDivider>
				<HStack gap={3} vAlign="center" hAlign="between" wrap="wrap">
					<VStack gap={0} vAlign="center">
						<Heading level={1}>Service Health Monitor</Heading>
						<HStack gap={2} vAlign="center">
							<StatusDot
								variant="success"
								label="Live"
								isPulsing
								tooltip="Auto-refreshing every 30s"
							/>
							<Text type="supporting" color="secondary">
								Updated{' '}
								<Timestamp
									value="2026-06-30T21:15:00+00:00"
									format="relative"
									type="inherit"
									color="inherit"
								/>
							</Text>
						</HStack>
					</VStack>
					<HStack gap={2} vAlign="center">
						<SegmentedControl
							label="Time window"
							value={timeWindow}
							onValueChange={(value) => setTimeWindow(value as TimeWindow)}
							size="lg"
						>
							<SegmentedControlItem label="1h" value="1h" />
							<SegmentedControlItem label="1d" value="1d" />
							<SegmentedControlItem label="7d" value="7d" />
						</SegmentedControl>
						<Selector
							label="Environment"
							isLabelHidden
							size="lg"
							options={ENV_OPTIONS}
							value={environment}
							onValueChange={(value) => setEnvironment(value as Environment)}
						/>
						<Selector
							label="Region"
							isLabelHidden
							size="lg"
							options={REGION_OPTIONS}
							value={region}
							onValueChange={(v) => setRegion(v ?? '')}
						/>
					</HStack>
				</HStack>
			</LayoutHeader>
		}
		content={
			<LayoutContent padding={6}>
				<VStack gap={10}>
					<VStack gap={6}>
						<Grid columns={{ minWidth: 240, repeat: 'fit' }} style={{ gap: 'var(--spacing-3)' }}>
							{kpis.map((kpi) => (
								<KpiTile
									key={kpi.key}
									kpi={kpi}
									spark={SPARKLINES[kpi.key].slice(-sparkLen)}
								/>
							))}
						</Grid>
						<Grid columns={{ minWidth: 320, repeat: 'fit' }} style={{ gap: 'var(--spacing-3)' }}>
							<MetricChart
								title="Response latency"
								subtitle="Percentile latency across all services (ms)"
								lines={LATENCY_LINES}
								scale={ENV_LATENCY_FACTOR[environment]}
								seed={3}
							/>
							<MetricChart
								title="Request volume by region"
								subtitle="Requests per minute (rpm)"
								lines={TRAFFIC_LINES}
								scale={1}
								seed={11}
							/>
						</Grid>
					</VStack>
					{isNarrow ? <AlertsFeed /> : null}
					<VStack gap={6}>
						<HStack gap={3} vAlign="center" hAlign="between" wrap="wrap">
							<VStack>
								<Heading level={2}>Deployments</Heading>
								<Text type="supporting" color="secondary">
									{breakdownContext}
								</Text>
							</VStack>
						</HStack>
						<Card padding={6}>
							{rows.length === 0 ? (
								<EmptyState
									title="No deployments"
									description="No services match the selected environment and region."
								/>
							) : (
								<Table<HostRow>
									data={rows}
									columns={hostColumns}
									idKey="id"

									dividers="rows"
									hasHover
								/>
							)}
						</Card>
					</VStack>
					<VStack gap={6}>
						<HStack gap={3} vAlign="center" hAlign="between" wrap="wrap">
							<VStack>
								<Heading level={2}>All services</Heading>
								<Text type="supporting" color="secondary">
									Daily uptime over the last {UPTIME_DAYS} days · {breakdownContext}
								</Text>
							</VStack>
							<HStack gap={4} vAlign="center" wrap="wrap">
								{(Object.keys(UPTIME_LABEL) as UptimeStatus[]).map((state) => (
									<LegendDot key={state} color={UPTIME_COLOR[state]} label={UPTIME_LABEL[state]} />
								))}
							</HStack>
						</HStack>
						<Card padding={6}>
							{uptimeEntries.length === 0 ? (
								<EmptyState
									title="No services"
									description="No services match the selected filters."
								/>
							) : (
								<VStack gap={6}>
									{uptimeEntries.map((entry, index) => (
										<>
											{index > 0 ? <Divider /> : null}
											<UptimeRow key={entry.service} entry={entry} />
										</>
									))}
								</VStack>
							)}
						</Card>
					</VStack>
				</VStack>
			</LayoutContent>
		}
		end={
			isNarrow ? undefined : (
				<LayoutPanel width={360} padding={0}>
					<AlertsFeed />
				</LayoutPanel>
			)
		}
	/>
}
