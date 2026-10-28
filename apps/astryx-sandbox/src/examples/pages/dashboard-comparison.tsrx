// Port of upstream templates/pages/dashboard-comparison/page.tsx (Astryx
// 0.6.4, MIT) — route /templates/dashboard-comparison/.
// GAPS: recharts (metric sparklines, device LineChart, breakdown BarCharts)
// → app-local helpers in ./charts.tsrx (recorded finding); section-heading
// icons rendered through the sandbox registry; the metric card shows the
// four comparison deltas as a row (upstream same).
import { useState } from 'octane'
import {
	Button, Card, Divider, Grid, Heading, HStack, Icon, Layout,
	LayoutContent, LayoutHeader, ProgressBar, Selector, StackItem, Table,
	Text, VStack,
} from '@octane-xplat/ui'
import type { TableColumn } from '@octane-xplat/ui'
import { ChartBars, ChartLines, ChartSparkline } from './charts'

type DateRange = '7d' | '30d' | '90d'
type Segment = 'all' | 'new' | 'returning'
type DeviceFilter = 'all' | 'mobile' | 'desktop' | 'tablet'

const COLORS = {
	blue: 'var(--color-data-categorical-blue, #0171E3)',
	green: 'var(--color-data-categorical-green, #0B991F)',
	orange: 'var(--color-data-categorical-orange, #EB6E00)',
	purple: 'var(--color-data-categorical-purple, #6B1EFD)',
	teal: 'var(--color-data-categorical-teal, #08A3A3)',
	neutral: 'var(--color-border-emphasized, #8B98A9)',
}

const TREND_DAYS = 90

function noise(i: number, seed: number): number {
	const x = Math.sin(i * 127.1 + seed * 311.7) * 43758.5453
	return x - Math.floor(x)
}

interface SparkPoint {
	i: number
	v: number
}

function spark(seed: number, trend: number): SparkPoint[] {
	const out: SparkPoint[] = []
	let drift = 0
	for (let i = 0; i < TREND_DAYS; i++) {
		const base = 50 + (trend * i * 24) / TREND_DAYS
		const weekly = Math.sin((i * Math.PI * 2) / 7 + seed) * 2.5
		drift = drift * 0.72 + (noise(i, seed) - 0.5) * 7
		const jitter = (noise(i, seed + 17) - 0.5) * 8
		const burst = noise(i, seed + 91) > 0.9 ? (noise(i, seed + 43) - 0.4) * 20 : 0
		out.push({ i, v: Math.round(base + weekly + drift + jitter + burst) })
	}
	return out
}

interface Metric {
	key: string
	label: string
	value: string
	higherIsBetter: boolean
	deltas: { dd: number; ww: number; mm: number; yy: number }
	spark: SparkPoint[]
}

const OVERVIEW_METRICS: Metric[] = [
	{ key: 'active-users', label: 'Active users', value: '1.28M', higherIsBetter: true, deltas: { dd: 0.4, ww: 2.1, mm: 6.4, yy: 18.2 }, spark: spark(1, 1.1) },
	{ key: 'new-users', label: 'New users', value: '184.2K', higherIsBetter: true, deltas: { dd: 1.2, ww: 3.8, mm: 9.1, yy: 24.6 }, spark: spark(2, 1.4) },
	{ key: 'sessions', label: 'Sessions', value: '4.62M', higherIsBetter: true, deltas: { dd: 0.2, ww: 1.4, mm: 5.2, yy: 15.9 }, spark: spark(3, 0.9) },
	{ key: 'avg-session', label: 'Avg. session', value: '6m 42s', higherIsBetter: true, deltas: { dd: -0.3, ww: 0.8, mm: 2.1, yy: -4.3 }, spark: spark(4, 0.3) },
	{ key: 'pages-session', label: 'Pages / session', value: '5.3', higherIsBetter: true, deltas: { dd: 0.1, ww: -0.6, mm: 1.2, yy: 3.7 }, spark: spark(5, 0.4) },
	{ key: 'bounce', label: 'Bounce rate', value: '38.6%', higherIsBetter: false, deltas: { dd: -0.2, ww: -1.1, mm: -2.4, yy: -6.8 }, spark: spark(6, -0.5) },
	{ key: 'dau-mau', label: 'DAU / MAU', value: '52.1%', higherIsBetter: true, deltas: { dd: 0.3, ww: 1.0, mm: 3.2, yy: 8.4 }, spark: spark(7, 0.7) },
	{ key: 'conversion', label: 'Conversion rate', value: '3.84%', higherIsBetter: true, deltas: { dd: -0.1, ww: 0.9, mm: 2.6, yy: 11.2 }, spark: spark(8, 0.6) },
	{ key: 'activation', label: 'Activation rate', value: '61.4%', higherIsBetter: true, deltas: { dd: 0.2, ww: 1.3, mm: 4.1, yy: 12.7 }, spark: spark(9, 0.8) },
	{ key: 'retention-30', label: '30-day retention', value: '27.4%', higherIsBetter: true, deltas: { dd: 0.1, ww: -0.4, mm: 1.8, yy: 5.3 }, spark: spark(10, -0.3) },
	{ key: 'churn', label: 'Churn rate', value: '4.7%', higherIsBetter: false, deltas: { dd: -0.1, ww: -0.3, mm: -1.2, yy: -2.4 }, spark: spark(11, -0.4) },
	{ key: 'nps', label: 'NPS', value: '41', higherIsBetter: true, deltas: { dd: 0.2, ww: 0.6, mm: -2.2, yy: -8.1 }, spark: spark(12, 0.35) },
]

const ACTIVE_TREND = (() => {
	const out: { t: number; label: string; desktop: number; mobile: number; tablet: number }[] = []
	for (let i = 0; i < TREND_DAYS; i++) {
		const weekend = i % 7 === 5 || i % 7 === 6
		const spike = noise(i, 61) > 0.88 ? 1 : 0
		out.push({
			t: i,
			label: `Day ${i + 1}`,
			desktop: Math.round(520 + (i * 90) / TREND_DAYS + (weekend ? -110 : 20) + (noise(i, 11) - 0.5) * 80),
			mobile: Math.round(680 + (i * 150) / TREND_DAYS + (weekend ? 85 : -15) + (noise(i, 23) - 0.5) * 125 + spike * 130),
			tablet: Math.round(140 + (weekend ? 24 : -5) + (noise(i, 37) - 0.5) * 40 + spike * 18),
		})
	}
	return out
})()

interface BreakdownSegment {
	label: string
	value: number
	color: string
}

const AGE_DATA: BreakdownSegment[] = [
	{ label: '18–24', value: 26, color: COLORS.blue },
	{ label: '25–34', value: 34, color: COLORS.teal },
	{ label: '35–44', value: 21, color: COLORS.green },
	{ label: '45–54', value: 12, color: COLORS.orange },
	{ label: '55+', value: 7, color: COLORS.neutral },
]

const GENDER_DATA: BreakdownSegment[] = [
	{ label: 'Female', value: 48, color: COLORS.purple },
	{ label: 'Male', value: 46, color: COLORS.blue },
	{ label: 'Other / undisclosed', value: 6, color: COLORS.neutral },
]

const DEVICE_DATA: BreakdownSegment[] = [
	{ label: 'Mobile', value: 58, color: COLORS.blue },
	{ label: 'Desktop', value: 34, color: COLORS.teal },
	{ label: 'Tablet', value: 8, color: COLORS.orange },
]

interface AcqRow extends Record<string, unknown> {
	id: string
	channel: string
	users: number
	share: number
	delta: number
}

const ACQUISITION: AcqRow[] = [
	{ id: 'a1', channel: 'Organic search', users: 486200, share: 38, delta: 4.2 },
	{ id: 'a2', channel: 'Direct', users: 295400, share: 23, delta: 1.1 },
	{ id: 'a3', channel: 'Social', users: 217800, share: 17, delta: 8.6 },
	{ id: 'a4', channel: 'Referral', users: 141900, share: 11, delta: -2.3 },
	{ id: 'a5', channel: 'Email', users: 89200, share: 7, delta: 3.4 },
	{ id: 'a6', channel: 'Paid ads', users: 51300, share: 4, delta: -1.8 },
]

const ACQ_MAX = Math.max(...ACQUISITION.map((a) => a.users))

const RANGE_OPTIONS = [
	{ value: '7d', label: 'Last 7 days' },
	{ value: '30d', label: 'Last 30 days' },
	{ value: '90d', label: 'Last 90 days' },
]
const SEGMENT_OPTIONS = [
	{ value: 'all', label: 'All users' },
	{ value: 'new', label: 'New users' },
	{ value: 'returning', label: 'Returning users' },
]
const DEVICE_OPTIONS = [
	{ value: 'all', label: 'All devices' },
	{ value: 'mobile', label: 'Mobile' },
	{ value: 'desktop', label: 'Desktop' },
	{ value: 'tablet', label: 'Tablet' },
]

const formatNumber = (n: number) => n.toLocaleString('en-US')

const labelFor = (options: { value: string; label: string }[], value: string) =>
	options.find((o) => o.value === value)?.label ?? value

function LegendDot(props: { color: string; label: string }) @{
	<HStack gap={2} vAlign="center">
		<Icon name="sandbox-stop" size={12} color={props.color} />
		<Text type="supporting" color="secondary">
			{props.label}
		</Text>
	</HStack>
}

function DeltaValue(props: { value: number; higherIsBetter: boolean; label: string }) @{
	const positive = props.value >= 0
	const good = props.higherIsBetter === positive
	<VStack gap={0}>
		<Text type="supporting" color="secondary">
			{props.label}
		</Text>
		<HStack gap={1} vAlign="center">
			<Icon
				name={positive ? 'sandbox-arrow-up' : 'sandbox-arrow-down'}
				size={12}
				color={good ? 'success' : 'error'}
			/>
			<Text type="supporting" style={{ color: good ? 'var(--color-text-success, #067647)' : 'var(--color-text-error, #d92d20)' }}>
				{positive ? '+' : ''}
				{props.value.toFixed(1)}%
			</Text>
		</HStack>
	</VStack>
}

function MetricCard(props: { metric: Metric }) @{
	const m = props.metric
	<Card padding={4}>
		<VStack gap={2}>
			<HStack hAlign="between" vAlign="center">
				<Text type="label" color="secondary">
					{m.label}
				</Text>
			</HStack>
			<Heading level={1}>{m.value}</Heading>
			<ChartSparkline data={m.spark.map((p) => p.v)} color={COLORS.blue} height={40} />
			<HStack gap={4} vAlign="center" wrap="wrap">
				<DeltaValue value={m.deltas.dd} higherIsBetter={m.higherIsBetter} label="d/d" />
				<DeltaValue value={m.deltas.ww} higherIsBetter={m.higherIsBetter} label="w/w" />
				<DeltaValue value={m.deltas.mm} higherIsBetter={m.higherIsBetter} label="m/m" />
				<DeltaValue value={m.deltas.yy} higherIsBetter={m.higherIsBetter} label="y/y" />
			</HStack>
		</VStack>
	</Card>
}

function ActiveUsersTrend() @{
	<VStack gap={4}>
		<ChartLines
			height={300}
			series={[
				{ name: 'Desktop', data: ACTIVE_TREND.map((p) => p.desktop), color: COLORS.teal },
				{ name: 'Mobile', data: ACTIVE_TREND.map((p) => p.mobile), color: COLORS.blue },
				{ name: 'Tablet', data: ACTIVE_TREND.map((p) => p.tablet), color: COLORS.orange },
			]}
		/>
		<HStack gap={6} vAlign="center" wrap="wrap">
			<LegendDot color={COLORS.teal} label="Desktop" />
			<LegendDot color={COLORS.blue} label="Mobile" />
			<LegendDot color={COLORS.orange} label="Tablet" />
		</HStack>
	</VStack>
}

function BreakdownCard(props: { title: string; data: BreakdownSegment[] }) @{
	<Card padding={5}>
		<VStack gap={4}>
			<Heading level={4}>
				{props.title}
			</Heading>
			<ChartBars
				height={160}
				bars={props.data.map((d) => ({ label: d.label, value: d.value, color: d.color }))}
			/>
			<VStack gap={1}>
				{props.data.map((d) => (
					<HStack key={d.label} hAlign="between" vAlign="center">
						<HStack gap={2} vAlign="center">
							<Icon name="sandbox-stop" size={12} color={d.color} />
							<Text type="supporting">{d.label}</Text>
						</HStack>
						<Text type="supporting" color="secondary">
							{d.value}%
						</Text>
					</HStack>
				))}
			</VStack>
		</VStack>
	</Card>
}

function DeltaBadge(props: { value: number }) @{
	const positive = props.value >= 0
	<HStack gap={1} vAlign="center">
		<Icon
			name={positive ? 'sandbox-arrow-up' : 'sandbox-arrow-down'}
			size={12}
			color={positive ? 'success' : 'error'}
		/>
		<Text type="body" style={{ color: positive ? 'var(--color-text-success, #067647)' : 'var(--color-text-error, #d92d20)' }}>
			{positive ? '+' : ''}
			{props.value.toFixed(1)}%
		</Text>
	</HStack>
}

const acquisitionColumns: TableColumn<AcqRow>[] = [
	{
		key: 'channel',
		header: 'Channel',
		renderCell: (item: AcqRow) => (
			<Text type="body" weight="semibold">
				{item.channel}
			</Text>
		),
	},
	{
		key: 'users',
		header: 'Users',
		renderCell: (item: AcqRow) => (
			<VStack gap={1}>
				<ProgressBar
					value={item.users}
					max={ACQ_MAX}
					label={`${item.channel} users`}
					isLabelHidden
				/>
				<Text type="supporting" color="secondary">
					{formatNumber(item.users)}
				</Text>
			</VStack>
		),
	},
	{
		key: 'share',
		header: 'Share',
		renderCell: (item: AcqRow) => <Text type="body">{item.share}%</Text>,
	},
	{
		key: 'delta',
		header: 'w/w',
		renderCell: (item: AcqRow) => <DeltaBadge value={item.delta} />,
	},
]

function SectionHeading(props: { title: string; hint?: string; icon?: string }) @{
	<HStack hAlign="between" vAlign="center" gap={3}>
		<HStack gap={3} vAlign="center">
			{props.icon ? (
				<div
					style={{
						width: 'var(--spacing-8)',
						height: 'var(--spacing-8)',
						backgroundColor: 'var(--color-background-muted)',
						borderRadius: 'var(--radius-element)',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
					}}
				>
					<Icon name={props.icon} size={16} color="secondary" />
				</div>
			) : null}
			<Heading level={2}>{props.title}</Heading>
		</HStack>
		{props.hint ? (
			<Text type="supporting" color="secondary">
				{props.hint}
			</Text>
		) : null}
	</HStack>
}

export function DashboardComparisonTemplate() @{
	const [range, setRange] = useState<DateRange>('90d')
	const [segment, setSegment] = useState<Segment>('all')
	const [device, setDevice] = useState<DeviceFilter>('all')

	const summary = [
		labelFor(SEGMENT_OPTIONS, segment),
		labelFor(DEVICE_OPTIONS, device),
		labelFor(RANGE_OPTIONS, range),
	].join(' · ')

	<Layout
		height="fill"
		contentWidth={1440}
		header={
			<LayoutHeader hasDivider>
				<HStack gap={3} vAlign="center" hAlign="between" wrap="wrap">
					<VStack gap={0}>
						<Heading level={1}>Data Dashboard</Heading>
						<Text type="supporting" color="secondary">
							User analytics overview · {summary}
						</Text>
					</VStack>
					<HStack gap={1}>
						<Selector
							label="Date range"
							isLabelHidden
							options={RANGE_OPTIONS}
							value={range}
							onValueChange={(value) => setRange(value as DateRange)}
						/>
						<Selector
							label="Segment"
							isLabelHidden
							options={SEGMENT_OPTIONS}
							value={segment}
							onValueChange={(value) => setSegment(value as Segment)}
						/>
						<Selector
							label="Device"
							isLabelHidden
							options={DEVICE_OPTIONS}
							value={device}
							onValueChange={(value) => setDevice(value as DeviceFilter)}
						/>
						<Button
							label="Export"
							variant="secondary"
							icon={<Icon name="sandbox-arrow-down-tray" size={16} />}
							clickAction={() => {}}
						/>
					</HStack>
				</HStack>
			</LayoutHeader>
		}
		content={
			<LayoutContent padding={6}>
				<VStack gap={10}>
					<VStack gap={6}>
						<SectionHeading
							title="Key metrics"
							hint="Change vs. prior day, week, month, and year"
							icon="sandbox-users"
						/>
						<Grid columns={{ minWidth: 240, repeat: 'fit' }} style={{ gap: 'var(--spacing-3)' }}>
							{OVERVIEW_METRICS.map((metric) => (
								<MetricCard key={metric.key} metric={metric} />
							))}
						</Grid>
					</VStack>
					<VStack gap={6}>
						<SectionHeading
							title="Devices"
							hint="Daily active users (thousands)"
							icon="sandbox-cursor-arrow-rays"
						/>
						<Card padding={6}>
							<VStack gap={6}>
								<Text type="label">Daily active users by device type</Text>
								<ActiveUsersTrend />
							</VStack>
						</Card>
					</VStack>
					<Divider />
					<VStack gap={6}>
						<SectionHeading
							title="Audience demographics"
							hint="Share of active users"
							icon="sandbox-users"
						/>
						<Grid columns={{ minWidth: 320, repeat: 'fit' }} style={{ gap: 'var(--spacing-4)' }}>
							<BreakdownCard title="Age" data={AGE_DATA} />
							<BreakdownCard title="Gender" data={GENDER_DATA} />
							<BreakdownCard title="Device" data={DEVICE_DATA} />
						</Grid>
					</VStack>
					<VStack gap={6}>
						<SectionHeading title="Acquisition channels" hint="How users find the product" />
						<Card>
							<Table<AcqRow>
								data={ACQUISITION}
								columns={acquisitionColumns}
								idKey="id"

								dividers="rows"
								hasHover
							/>
						</Card>
					</VStack>
				</VStack>
			</LayoutContent>
		}
	/>
}
