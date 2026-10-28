// Port of upstream templates/pages/dashboard-cohort-funnel/page.tsx (Astryx
// 0.6.4, MIT) — route /templates/dashboard-cohort-funnel/.
// GAPS: recharts (horizontal funnel BarChart, conversion LineChart) →
// app-local helpers in ./charts.tsrx + proportional-width divs here
// (recorded finding); cohort heat cells use Token variants instead of the
// upstream Cell fills.
import { useMemo, useState } from 'octane'
import {
	Button, Card, Divider, Grid, Heading, HStack, Icon, Layout,
	LayoutContent, LayoutHeader, SegmentedControl, SegmentedControlItem,
	Selector, Table, Text, Token, VStack,
} from '@octane-xplat/ui'
import type { TableColumn } from '@octane-xplat/ui'
import { ChartLines } from './charts'

type Segment = 'all' | 'web' | 'ios' | 'android'
type FunnelWindow = '7d' | '30d' | '90d'

const COLORS = {
	blue: 'var(--color-data-categorical-blue, #0171E3)',
	green: 'var(--color-data-categorical-green, #0B991F)',
	orange: 'var(--color-data-categorical-orange, #EB6E00)',
	purple: 'var(--color-data-categorical-purple, #6B1EFD)',
	teal: 'var(--color-data-categorical-teal, #08A3A3)',
}

const FUNNEL_COLORS = [COLORS.blue, COLORS.teal, COLORS.green, COLORS.orange, COLORS.purple]

const WINDOW_FACTOR: Record<FunnelWindow, number> = {
	'7d': 0.24,
	'30d': 1,
	'90d': 3.1,
}

interface FunnelStage {
	key: string
	label: string
	users: Record<Segment, number>
}

const FUNNEL_STAGES: FunnelStage[] = [
	{ key: 'visit', label: 'Visited site', users: { all: 128400, web: 82600, ios: 27300, android: 18500 } },
	{ key: 'signup', label: 'Signed up', users: { all: 41200, web: 24800, ios: 9600, android: 6800 } },
	{ key: 'activate', label: 'Activated', users: { all: 22600, web: 12900, ios: 5900, android: 3800 } },
	{ key: 'subscribe', label: 'Subscribed', users: { all: 9100, web: 5100, ios: 2600, android: 1400 } },
	{ key: 'retain', label: 'Retained 30d', users: { all: 6300, web: 3600, ios: 1850, android: 850 } },
]

const TREND = [
	{ t: 0, label: 'W1', signup: 30.1, activate: 52.4, subscribe: 38.2 },
	{ t: 1, label: 'W2', signup: 31.4, activate: 54.1, subscribe: 36.9 },
	{ t: 2, label: 'W3', signup: 29.2, activate: 51.2, subscribe: 39.8 },
	{ t: 3, label: 'W4', signup: 32.6, activate: 55.8, subscribe: 37.1 },
	{ t: 4, label: 'W5', signup: 28.4, activate: 53.6, subscribe: 40.4 },
	{ t: 5, label: 'W6', signup: 31.8, activate: 56.2, subscribe: 38.3 },
	{ t: 6, label: 'W7', signup: 33.5, activate: 54.3, subscribe: 44.6 },
	{ t: 7, label: 'W8', signup: 30.2, activate: 57.1, subscribe: 42.1 },
	{ t: 8, label: 'W9', signup: 34.1, activate: 48.9, subscribe: 37.4 },
	{ t: 9, label: 'W10', signup: 29.6, activate: 46.2, subscribe: 35.2 },
	{ t: 10, label: 'W11', signup: 32.9, activate: 50.4, subscribe: 38.9 },
	{ t: 11, label: 'W12', signup: 35.4, activate: 55.6, subscribe: 41.3 },
	{ t: 12, label: 'W13', signup: 31.1, activate: 57.3, subscribe: 39.2 },
	{ t: 13, label: 'W14', signup: 33.8, activate: 54.8, subscribe: 42.8 },
	{ t: 14, label: 'W15', signup: 41.2, activate: 49.6, subscribe: 40.1 },
	{ t: 15, label: 'W16', signup: 38.6, activate: 47.8, subscribe: 36.4 },
	{ t: 16, label: 'W17', signup: 30.4, activate: 53.2, subscribe: 39.7 },
	{ t: 17, label: 'W18', signup: 26.8, activate: 44.1, subscribe: 34.2 },
	{ t: 18, label: 'W19', signup: 31.9, activate: 51.7, subscribe: 38.1 },
	{ t: 19, label: 'W20', signup: 34.7, activate: 56.4, subscribe: 41.9 },
	{ t: 20, label: 'W21', signup: 32.2, activate: 58.2, subscribe: 44.2 },
	{ t: 21, label: 'W22', signup: 36.1, activate: 55.1, subscribe: 40.6 },
	{ t: 22, label: 'W23', signup: 33.4, activate: 59.4, subscribe: 43.8 },
	{ t: 23, label: 'W24', signup: 37.2, activate: 56.8, subscribe: 46.1 },
	{ t: 24, label: 'W25', signup: 34.9, activate: 60.1, subscribe: 42.7 },
	{ t: 25, label: 'W26', signup: 38.4, activate: 58.6, subscribe: 45.3 },
]

const TREND_SERIES = [
	{ key: 'signup', name: 'Visit → signup', color: COLORS.blue },
	{ key: 'activate', name: 'Signup → activation', color: COLORS.green },
	{ key: 'subscribe', name: 'Activation → paid', color: COLORS.orange },
] as const

interface Cohort {
	label: string
	size: number
	retention: number[]
}

const COHORTS: Cohort[] = [
	{ label: 'Apr 6 – Apr 12', size: 4820, retention: [100, 62, 48, 41, 37, 34, 32, 31] },
	{ label: 'Apr 13 – Apr 19', size: 5140, retention: [100, 64, 50, 43, 39, 36, 34] },
	{ label: 'Apr 20 – Apr 26', size: 5390, retention: [100, 66, 52, 45, 41, 38] },
	{ label: 'Apr 27 – May 3', size: 5610, retention: [100, 63, 49, 42, 38] },
	{ label: 'May 4 – May 10', size: 5980, retention: [100, 67, 54, 47] },
	{ label: 'May 11 – May 17', size: 6240, retention: [100, 69, 56] },
	{ label: 'May 18 – May 24', size: 6510, retention: [100, 71] },
	{ label: 'May 25 – May 31', size: 6720, retention: [100] },
]

const MAX_WEEKS = 8

function retentionColor(pct: number): 'green' | 'teal' | 'yellow' | 'orange' | 'red' {
	if (pct >= 70) {return 'green'}
	if (pct >= 50) {return 'teal'}
	if (pct >= 40) {return 'yellow'}
	if (pct >= 32) {return 'orange'}
	return 'red'
}

interface Kpi {
	key: string
	label: string
	value: string
	delta: number
	higherIsBetter: boolean
}

const KPIS: Record<Segment, Kpi[]> = {
	all: [
		{ key: 'v2s', label: 'Visit → signup', value: '32.1%', delta: 1.8, higherIsBetter: true },
		{ key: 's2a', label: 'Signup → activation', value: '54.9%', delta: 2.4, higherIsBetter: true },
		{ key: 'a2s', label: 'Activation → paid', value: '40.3%', delta: -1.1, higherIsBetter: true },
		{ key: 'w4', label: 'Week-4 retention', value: '43.2%', delta: 3.6, higherIsBetter: true },
	],
	web: [
		{ key: 'v2s', label: 'Visit → signup', value: '30.0%', delta: 1.2, higherIsBetter: true },
		{ key: 's2a', label: 'Signup → activation', value: '52.0%', delta: 1.9, higherIsBetter: true },
		{ key: 'a2s', label: 'Activation → paid', value: '39.5%', delta: -0.6, higherIsBetter: true },
		{ key: 'w4', label: 'Week-4 retention', value: '41.8%', delta: 2.9, higherIsBetter: true },
	],
	ios: [
		{ key: 'v2s', label: 'Visit → signup', value: '35.2%', delta: 2.6, higherIsBetter: true },
		{ key: 's2a', label: 'Signup → activation', value: '61.5%', delta: 3.1, higherIsBetter: true },
		{ key: 'a2s', label: 'Activation → paid', value: '44.1%', delta: 0.8, higherIsBetter: true },
		{ key: 'w4', label: 'Week-4 retention', value: '47.5%', delta: 4.2, higherIsBetter: true },
	],
	android: [
		{ key: 'v2s', label: 'Visit → signup', value: '36.8%', delta: 2.1, higherIsBetter: true },
		{ key: 's2a', label: 'Signup → activation', value: '55.9%', delta: 1.4, higherIsBetter: true },
		{ key: 'a2s', label: 'Activation → paid', value: '36.8%', delta: -2.3, higherIsBetter: true },
		{ key: 'w4', label: 'Week-4 retention', value: '38.4%', delta: -0.9, higherIsBetter: true },
	],
}

const SEGMENT_OPTIONS = [
	{ value: 'all', label: 'All platforms' },
	{ value: 'web', label: 'Web' },
	{ value: 'ios', label: 'iOS' },
	{ value: 'android', label: 'Android' },
]

const nf = (n: number) => n.toLocaleString('en-US')

interface CohortRow extends Record<string, string | number> {
	id: string
	cohort: string
	size: number
}

const cohortRows: CohortRow[] = COHORTS.map((c, i) => ({
	id: String(i),
	cohort: c.label,
	size: c.size,
	...Object.fromEntries(c.retention.map((pct, w) => [`w${w}`, pct])),
}))

function RetentionCell(props: { value: string | number }) @{
	const pct = typeof props.value === 'number' ? props.value : NaN
	if (Number.isNaN(pct)) {
		return <Text color="secondary">—</Text>
	}
	<Token size="sm" color={retentionColor(pct)} label={`${pct}%`} />
}

function KpiTile(props: { kpi: Kpi }) @{
	const positive = props.kpi.delta >= 0
	const good = props.kpi.higherIsBetter === positive
	<Card padding={4}>
		<VStack gap={1}>
			<Text type="label" color="secondary">
				{props.kpi.label}
			</Text>
			<HStack gap={3} vAlign="center">
				<Heading level={1}>{props.kpi.value}</Heading>
				<HStack gap={1} vAlign="center">
					<Icon
						name={positive ? 'sandbox-arrow-up' : 'sandbox-arrow-down'}
						size={12}
						color={good ? 'success' : 'error'}
					/>
					<Text type="body" style={{ color: good ? 'var(--color-text-success, #067647)' : 'var(--color-text-error, #d92d20)' }}>
						{positive ? '+' : ''}
						{props.kpi.delta.toFixed(1)}%
					</Text>
				</HStack>
			</HStack>
		</VStack>
	</Card>
}

function ConversionFunnel(props: { segment: Segment }) @{
	const bars = FUNNEL_STAGES.map((stage, i) => ({
		key: stage.key,
		label: stage.label,
		users: stage.users[props.segment],
		color: FUNNEL_COLORS[i],
	}))
	const top = bars[0].users
	<VStack gap={4}>
		{bars.map((bar) => (
			<VStack key={bar.key} gap={1}>
				<HStack hAlign="between" vAlign="center">
					<Text type="body">{bar.label}</Text>
					<Text type="body" color="secondary">
						{nf(bar.users)} · {((bar.users / top) * 100).toFixed(1)}%
					</Text>
				</HStack>
				<div
					style={{
						height: 20,
						borderRadius: 4,
						backgroundColor: bar.color,
						width: `${(bar.users / top) * 100}%`,
						minWidth: 4,
					}}
				/>
			</VStack>
		))}
	</VStack>
}

function FunnelSteps(props: { segment: Segment }) @{
	const steps = FUNNEL_STAGES.slice(1).map((stage, i) => {
		const prev = FUNNEL_STAGES[i]
		const to = stage.users[props.segment]
		const from = prev.users[props.segment]
		const conv = (to / from) * 100
		const drop = 100 - conv
		return {
			key: stage.key,
			label: `${prev.label} → ${stage.label}`,
			conv,
			drop,
		}
	})
	<Grid columns={{ minWidth: 180, repeat: 'fit' }} style={{ gap: 'var(--spacing-3)' }}>
		{steps.map((step) => (
			<Card key={step.key} padding={3}>
				<VStack gap={1}>
					<Text type="supporting" color="secondary" maxLines={1}>
						{step.label}
					</Text>
					<Heading level={2}>{step.conv.toFixed(1)}%</Heading>
					<HStack gap={1} vAlign="center">
						<Icon name="sandbox-arrow-trending-down" size={12} color="secondary" />
						<Text type="supporting" color="secondary">
							{step.drop.toFixed(1)}% drop
						</Text>
					</HStack>
				</VStack>
			</Card>
		))}
	</Grid>
}

function SectionHeading(props: { title: string; hint?: string }) @{
	<HStack hAlign="between" vAlign="center" gap={3}>
		<Heading level={2}>{props.title}</Heading>
		{props.hint ? (
			<Text type="supporting" color="secondary">
				{props.hint}
			</Text>
		) : null}
	</HStack>
}

export function DashboardCohortFunnelTemplate() @{
	const [segment, setSegment] = useState<Segment>('all')
	const [funnelWindow, setFunnelWindow] = useState<FunnelWindow>('30d')

	const kpis = KPIS[segment]
	const topOfFunnel = useMemo(() => {
		const base = FUNNEL_STAGES[0].users[segment]
		return Math.round(base * WINDOW_FACTOR[funnelWindow])
	}, [segment, funnelWindow])

	const overallConversion = useMemo(() => {
		const top = FUNNEL_STAGES[0].users[segment]
		const bottom = FUNNEL_STAGES[FUNNEL_STAGES.length - 1].users[segment]
		return ((bottom / top) * 100).toFixed(1)
	}, [segment])

	const cohortColumns: TableColumn<CohortRow>[] = [
		{
			key: 'cohort',
			header: 'Signup week',
			renderCell: (row: CohortRow) => <Text weight="semibold">{row.cohort}</Text>,
		},
		{
			key: 'size',
			header: 'Size',
			renderCell: (row: CohortRow) => <Text>{nf(row.size)}</Text>,
		},
		...Array.from({ length: MAX_WEEKS }, (_, w) => ({
			key: `w${w}`,
			header: `W${w}`,
			renderCell: (row: CohortRow) => <RetentionCell value={row[`w${w}`] ?? NaN} />,
		})),
	]

	<Layout
		height="fill"
		contentWidth={1440}
		header={
			<LayoutHeader hasDivider>
				<HStack gap={3} vAlign="center" hAlign="between" wrap="wrap">
					<VStack gap={0}>
						<Heading level={1}>Funnel & cohort analytics</Heading>
						<Text type="supporting" color="secondary">
							{nf(topOfFunnel)} visitors · {overallConversion}% end-to-end conversion
						</Text>
					</VStack>
					<HStack gap={2}>
						<SegmentedControl
							label="Funnel window"
							value={funnelWindow}
							onValueChange={(value) => setFunnelWindow(value as FunnelWindow)}
						>
							<SegmentedControlItem label="7d" value="7d" />
							<SegmentedControlItem label="30d" value="30d" />
							<SegmentedControlItem label="90d" value="90d" />
						</SegmentedControl>
						<Selector
							label="Segment"
							isLabelHidden
							options={SEGMENT_OPTIONS}
							value={segment}
							onValueChange={(value) => setSegment(value as Segment)}
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
			<LayoutContent>
				<VStack gap={10}>
					<VStack gap={4}>
						<Grid columns={{ minWidth: 240, repeat: 'fit' }} style={{ gap: 'var(--spacing-3)' }}>
							{kpis.map((kpi) => (
								<KpiTile key={kpi.key} kpi={kpi} />
							))}
						</Grid>
						<Card padding={6}>
							<VStack gap={6}>
								<SectionHeading
									title="Conversion funnel"
									hint={`${SEGMENT_OPTIONS.find((o) => o.value === segment)?.label} · ${funnelWindow}`}
								/>
								<ConversionFunnel segment={segment} />
								<Divider />
								<FunnelSteps segment={segment} />
							</VStack>
						</Card>
						<Card padding={6}>
							<VStack gap={6}>
								<SectionHeading
									title="Conversion over time"
									hint={`Stage conversion rates · trailing ${TREND.length} weeks`}
								/>
								<ChartLines
									height={280}
									series={TREND_SERIES.map((s) => ({
										name: s.name,
										data: TREND.map((p) => p[s.key]),
										color: s.color,
									}))}
								/>
								<HStack gap={5} vAlign="center" wrap="wrap">
									{TREND_SERIES.map((s) => (
										<HStack key={s.key} gap={2} vAlign="center">
											<Icon name="sandbox-stop" size={12} color={s.color} />
											<Text type="supporting" color="secondary">
												{s.name}
											</Text>
										</HStack>
									))}
								</HStack>
							</VStack>
						</Card>
					</VStack>
					<Divider />
					<VStack gap={6}>
						<SectionHeading
							title="Weekly retention cohorts"
							hint="Signup week × weeks since signup"
						/>
						<Card padding={6}>
							<VStack gap={8}>
								<Table<CohortRow>
									data={cohortRows}
									columns={cohortColumns}
									idKey="id"

									dividers="rows"
								/>
								<HStack gap={4} vAlign="center" wrap="wrap">
									<Text type="supporting" color="secondary">
										Retention:
									</Text>
									<HStack gap={2} vAlign="center">
										<Token size="sm" color="red" label="< 32%" />
										<Token size="sm" color="orange" label="32–40%" />
										<Token size="sm" color="yellow" label="40–50%" />
										<Token size="sm" color="teal" label="50–70%" />
										<Token size="sm" color="green" label="≥ 70%" />
									</HStack>
								</HStack>
							</VStack>
						</Card>
					</VStack>
				</VStack>
			</LayoutContent>
		}
	/>
}
