// Port of upstream templates/pages/dashboard-scorecard/page.tsx (Astryx
// 0.6.4, MIT) — route /templates/dashboard-scorecard/.
// GAPS: recharts (AreaChart/LineChart/ResponsiveContainer) → app-local SVG
// helpers in ./charts.tsrx (recorded finding); responsive scorecard grid
// used stylex breakpoints — expressed here as Grid minWidth (1→2→3 cols);
// icons render via the sandbox registry (heroicon names → sandbox-*).
import { useMemo, useState } from 'octane'
import {
	Avatar, Badge, Button, Card, Divider, Grid, Heading, HStack, Icon,
	Layout, LayoutContent, LayoutHeader, LayoutPanel, ProgressBar,
	SegmentedControl, SegmentedControlItem, StackItem, Text, Timestamp,
	useMediaQuery, VStack,
} from '@octane-xplat/ui'
import { ChartLines } from './charts'

type Period = 'WoW' | 'MoM' | 'QoQ'
type Rag = 'green' | 'amber' | 'red'

const PERIOD_SUBTITLE: Record<Period, string> = {
	WoW: 'Week over week · W24 vs W23',
	MoM: 'Month over month · June vs May',
	QoQ: 'Quarter over quarter · Q2 vs Q1',
}

interface Kpi {
	key: string
	label: string
	value: string
	delta: Record<Period, number>
	higherIsBetter: boolean
}

interface Okr {
	objective: string
	owner: string
	actual: number
	target: number
	unit: string
}

const RAG_ICON: Record<Rag, 'success' | 'warning' | 'error'> = {
	green: 'success',
	amber: 'warning',
	red: 'error',
}

const RAG_PROGRESS: Record<Rag, 'success' | 'warning' | 'error'> = {
	green: 'success',
	amber: 'warning',
	red: 'error',
}

function ragFor(deltaPct: number, higherIsBetter: boolean): Rag {
	const favorable = higherIsBetter ? deltaPct >= 0 : deltaPct <= 0
	const mag = Math.abs(deltaPct)
	if (!favorable && mag >= 1.5) {return 'red'}
	if (!favorable || mag < 1) {return 'amber'}
	return 'green'
}

const KPIS: Kpi[] = [
	{ key: 'revenue', label: 'Net revenue', value: '$4.82M', delta: { WoW: 2.4, MoM: 6.1, QoQ: 14.3 }, higherIsBetter: true },
	{ key: 'arr', label: 'ARR', value: '$58.1M', delta: { WoW: 1.1, MoM: 3.8, QoQ: 11.2 }, higherIsBetter: true },
	{ key: 'nrr', label: 'Net revenue retention', value: '112%', delta: { WoW: 0.3, MoM: -0.8, QoQ: 2.1 }, higherIsBetter: true },
	{ key: 'churn', label: 'Gross churn', value: '1.9%', delta: { WoW: 0.4, MoM: 1.6, QoQ: -0.7 }, higherIsBetter: false },
	{ key: 'cac', label: 'CAC payback', value: '14.2 mo', delta: { WoW: -0.2, MoM: -3.4, QoQ: -8.1 }, higherIsBetter: false },
	{ key: 'nps', label: 'NPS', value: '48', delta: { WoW: 1.0, MoM: 4.0, QoQ: 6.0 }, higherIsBetter: true },
]

const OKRS: Okr[] = [
	{ objective: 'Reach $60M ARR', owner: 'Dana Whitfield · CRO', actual: 58.1, target: 60, unit: 'M' },
	{ objective: 'Expand into 3 new enterprise verticals', owner: 'Marcus Lin · VP Sales', actual: 2, target: 3, unit: '' },
	{ objective: 'Ship AI copilot GA', owner: 'Priya Raman · VP Product', actual: 82, target: 100, unit: '%' },
	{ objective: 'Improve gross margin to 78%', owner: 'Tom Okafor · CFO', actual: 75.4, target: 78, unit: '%' },
]

function okrRag(pct: number): Rag {
	if (pct >= 90) {return 'green'}
	if (pct >= 70) {return 'amber'}
	return 'red'
}

const WEEK_LABELS = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10', 'W11', 'W12']

function makeTrend(base: number, growth: number, priorGap: number, wobble: number) {
	return WEEK_LABELS.map((label, i) => {
		const drift = base * (1 + (growth * i) / 11)
		const wob = Math.sin(i * 1.3) * base * wobble
		const current = Math.round(drift + wob)
		const prior = Math.round((drift + wob) * (1 - priorGap))
		return { t: i, label, current, prior }
	})
}

const COLORS = {
	current: '#3b82f6',
	prior: '#94a3b8',
}

const TRENDS = [
	{
		key: 'revenue',
		title: 'Weekly net revenue',
		unit: 'k',
		kind: 'area' as const,
		color: COLORS.current,
		data: makeTrend(420, 0.28, 0.09, 0.06),
	},
	{
		key: 'arr',
		title: 'ARR run-rate',
		unit: 'M',
		kind: 'line' as const,
		color: '#22c55e',
		data: makeTrend(56.5, 0.045, 0.015, 0.004),
	},
	{
		key: 'nrr',
		title: 'Net revenue retention',
		unit: '%',
		kind: 'line' as const,
		color: '#a855f7',
		data: makeTrend(109, 0.035, 0.006, 0.006),
	},
	{
		key: 'churn',
		title: 'Gross churn',
		unit: '%',
		kind: 'area' as const,
		color: '#ef4444',
		data: makeTrend(2.1, -0.12, 0.04, 0.08),
	},
]

type CalloutStatus = 'win' | 'risk' | 'note'

interface Callout {
	status: CalloutStatus
	title: string
	detail: string
}

const CALLOUT_ICON: Record<CalloutStatus, 'success' | 'warning' | 'info'> = {
	win: 'success',
	risk: 'warning',
	note: 'info',
}

const CALLOUT_ICON_COLOR: Record<CalloutStatus, string> = {
	win: 'success',
	risk: 'warning',
	note: 'info',
}

const CALLOUT_LABEL: Record<CalloutStatus, string> = {
	win: 'Win',
	risk: 'Risk',
	note: 'Note',
}

const NARRATIVE: Record<Period, Callout[]> = {
	WoW: [
		{
			status: 'win',
			title: 'Enterprise pipeline converted early',
			detail:
				'Two Q3-dated enterprise deals closed this week, adding $0.9M ARR ahead of plan. Sales credits the new usage-based tier for shortening procurement cycles.',
		},
		{
			status: 'risk',
			title: 'Churn ticked up in mid-market',
			detail:
				'Gross churn moved 0.4pts higher week over week, concentrated in the 50–200 seat segment. CS is contacting the eight affected accounts; watch for MoM confirmation before escalating.',
		},
		{
			status: 'note',
			title: 'Copilot GA drove a usage spike',
			detail:
				'The AI copilot launch moved weekly active usage up 31%, but paid attachment is still tracking the 82% OKR pace. Product wants a pricing prompt experiment before QoQ review.',
		},
	],
	MoM: [
		{
			status: 'win',
			title: 'Best revenue month on record',
			detail:
				'June closed at $4.82M net revenue — up 6.1% month over month — driven by the enterprise vertical expansion and the new annual billing option.',
		},
		{
			status: 'risk',
			title: 'NRR slipped under expansion pressure',
			detail:
				'Net revenue retention fell 0.8pts as a cohort of legacy-plan customers renewed flat rather than expanding. The renewals team is running a packaging review for the affected segment.',
		},
	],
	QoQ: [
		{
			status: 'win',
			title: 'All six KPIs improved year-over-year',
			detail:
				'Every scorecard metric moved favorably quarter over quarter, with CAC payback down 8.1% and NRR up 2.1pts — the cleanest coordinated improvement in six quarters.',
		},
		{
			status: 'note',
			title: 'Vertical expansion ahead of schedule',
			detail:
				'Two of three planned enterprise verticals shipped a full quarter early. The remaining vertical (regulated healthcare) is blocked on compliance review, expected Q3.',
		},
	],
}

const DELTA_ICON = {
	up: 'sandbox-arrow-up',
	down: 'sandbox-arrow-down',
	flat: 'sandbox-arrow-right',
} as const

function DeltaIndicator(props: { deltaPct: number; rag: Rag }) @{
	const sign = props.deltaPct > 0 ? '+' : ''
	const direction = props.deltaPct === 0 ? 'flat' : props.deltaPct < 0 ? 'down' : 'up'
	<HStack gap={2} vAlign="center">
		<Text type="body" color="secondary">
			{sign}
			{props.deltaPct.toFixed(1)}%
		</Text>
		<Icon name={DELTA_ICON[direction]} size={12} color={RAG_ICON[props.rag]} />
	</HStack>
}

function ScorecardTile(props: { kpi: Kpi; period: Period }) @{
	const deltaPct = props.kpi.delta[props.period]
	const rag = ragFor(deltaPct, props.kpi.higherIsBetter)
	<Card padding={5}>
		<VStack gap={1}>
			<Text type="label" color="secondary">
				{props.kpi.label}
			</Text>
			<HStack gap={4} vAlign="center">
				<Heading level={2}>{props.kpi.value}</Heading>
				<DeltaIndicator deltaPct={deltaPct} rag={rag} />
			</HStack>
		</VStack>
	</Card>
}

function OkrRow(props: { okr: Okr }) @{
	const pct = Math.round((props.okr.actual / props.okr.target) * 100)
	const rag = okrRag(pct)
	// `owner` is "Name · Title"; the avatar wants the person, not the title.
	const ownerName = props.okr.owner.split('·')[0].trim()
	<VStack gap={2}>
		<HStack hAlign="between" vAlign="center" gap={3}>
			<StackItem size="fill">
				<Heading level={4}>{props.okr.objective}</Heading>
			</StackItem>
			<Text type="supporting" color="secondary">
				{pct}%
			</Text>
		</HStack>
		<ProgressBar
			value={props.okr.actual}
			max={props.okr.target}
			variant={RAG_PROGRESS[rag]}
			label={props.okr.objective}
			isLabelHidden
		/>
		<HStack hAlign="between" vAlign="center" gap={4}>
			<HStack gap={2} vAlign="center">
				<Avatar size="sm" name={ownerName} />
				<Text type="supporting" color="secondary">
					{props.okr.owner}
				</Text>
			</HStack>
			<Text type="supporting" color="secondary">
				{props.okr.actual}
				{props.okr.unit} / {props.okr.target}
				{props.okr.unit} target
			</Text>
		</HStack>
	</VStack>
}

function TrendChart(props: { trend: (typeof TRENDS)[number] }) @{
	const latest = props.trend.data[props.trend.data.length - 1]
	const deltaPct = Math.round(((latest.current - latest.prior) / latest.prior) * 100)
	<Card padding={5}>
		<VStack gap={6}>
			<HStack hAlign="between" vAlign="center">
				<HStack gap={2}>
					<Heading level={3}>{props.trend.title}</Heading>
					<Heading level={3} color="secondary">
						{latest.current.toLocaleString()}
						{props.trend.unit}
					</Heading>
				</HStack>
				<Text type="supporting" color="secondary">
					{deltaPct >= 0 ? '+' : ''}
					{deltaPct}% vs prior
				</Text>
			</HStack>
			<ChartLines
				height={200}
				series={[
					{
						name: 'Current',
						data: props.trend.data.map((d) => d.current),
						color: props.trend.color,
						area: props.trend.kind === 'area',
					},
					{
						name: 'Prior',
						data: props.trend.data.map((d) => d.prior),
						color: COLORS.prior,
					},
				]}
			/>
			<HStack gap={5} vAlign="center">
				<HStack gap={2} vAlign="center">
					<Icon name="sandbox-stop" size={12} color={props.trend.color} />
					<Text type="supporting" color="secondary">Current period</Text>
				</HStack>
				<HStack gap={2} vAlign="center">
					<Icon name="sandbox-stop" size={12} color={COLORS.prior} />
					<Text type="supporting" color="secondary">Prior period</Text>
				</HStack>
			</HStack>
		</VStack>
	</Card>
}

function NarrativeCard(props: { callout: Callout }) @{
	<Card padding={5}>
		<HStack gap={3} vAlign="start">
			<Badge
				variant="blue"
				label={CALLOUT_LABEL[props.callout.status]}
			/>
			<VStack gap={1}>
				<Heading level={4}>{props.callout.title}</Heading>
				<Text type="body" color="secondary">
					{props.callout.detail}
				</Text>
			</VStack>
		</HStack>
	</Card>
}

function NarrativeBlock(props: { period: Period }) @{
	<VStack gap={2}>
		{NARRATIVE[props.period].map((callout) => (
			<NarrativeCard key={callout.title} callout={callout} />
		))}
	</VStack>
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

export function DashboardScorecardTemplate() @{
	const [period, setPeriod] = useState<Period>('WoW')
	// The narrative rail needs ~400px of its own; below that it folds inline.
	const isNarrow = useMediaQuery('(max-width: 1024px)')

	const okrSummary = useMemo(() => {
		const pcts = OKRS.map((o) => (o.actual / o.target) * 100)
		const onTrack = pcts.filter((p) => p >= 90).length
		return `${onTrack} of ${OKRS.length} on track`
	}, [])

	<Layout
		height="fill"
		contentWidth={1440}
		header={
			<LayoutHeader padding={6} hasDivider>
				<HStack gap={3} vAlign="center" hAlign="between" wrap="wrap">
					<VStack gap={1}>
						<Heading level={1}>Weekly Business Review</Heading>
						<HStack gap={2} vAlign="center">
							<Text type="body" color="secondary">
								{PERIOD_SUBTITLE[period]}
							</Text>
							<Text type="body" color="secondary">· Generated</Text>
							<Timestamp
								value="2026-06-30T08:00:00+00:00"
								format="date"
								type="body"
								color="secondary"
							/>
						</HStack>
					</VStack>
					<HStack gap={3}>
						<SegmentedControl
							label="Comparison period"
							value={period}
							onValueChange={(value) => setPeriod(value as Period)}
						>
							<SegmentedControlItem label="WoW" value="WoW" />
							<SegmentedControlItem label="MoM" value="MoM" />
							<SegmentedControlItem label="QoQ" value="QoQ" />
						</SegmentedControl>
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
					{isNarrow ? <NarrativeBlock period={period} /> : null}
					<VStack gap={6}>
						<SectionHeading title="Scorecard" hint={PERIOD_SUBTITLE[period]} />
						<Grid columns={{ minWidth: 340 }} style={{ gap: 'var(--spacing-4)' }}>
							{KPIS.map((kpi) => (
								<ScorecardTile key={kpi.key} kpi={kpi} period={period} />
							))}
						</Grid>
					</VStack>
					<VStack gap={6}>
						<SectionHeading title="OKR attainment" hint={okrSummary} />
						<VStack gap={6}>
							{OKRS.map((okr) => (
								<OkrRow key={okr.objective} okr={okr} />
							))}
						</VStack>
					</VStack>
					<VStack gap={6}>
						<SectionHeading title="Trends" hint="Current vs prior period" />
						<Grid columns={{ minWidth: 480 }} style={{ gap: 'var(--spacing-4)' }}>
							{TRENDS.map((trend) => (
								<TrendChart key={trend.key} trend={trend} />
							))}
						</Grid>
					</VStack>
					<Divider />
				</VStack>
			</LayoutContent>
		}
		end={
			isNarrow ? undefined : (
				<LayoutPanel width={400} padding={6}>
					<VStack gap={6}>
						<SectionHeading title="Narrative" hint={PERIOD_SUBTITLE[period]} />
						<NarrativeBlock period={period} />
					</VStack>
				</LayoutPanel>
			)
		}
	/>
}
