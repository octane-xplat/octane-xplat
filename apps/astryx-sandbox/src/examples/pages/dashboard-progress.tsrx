// Port of upstream templates/pages/dashboard-progress/page.tsx (Astryx
// 0.6.4, MIT) — route /templates/dashboard-progress/.
// GAPS: recharts (PieChart donut, gantt-shaped BarChart, burndown LineChart)
// → app-local helpers in ./charts.tsrx plus an inline SVG donut here
// (recorded finding); the gantt is drawn as proportional-positioned divs —
// recharts' floating-bar trick has no public equivalent.
import { useState } from 'octane'
import {
	Badge, Card, Divider, Heading, HStack, Icon, Layout, LayoutContent,
	LayoutHeader, ProgressBar, Table, Text, useMediaQuery, VStack, pixel } from '@octane-xplat/ui'
import type { TableColumn } from '@octane-xplat/ui'
import { ChartLines } from './charts'

type Rag = 'onTrack' | 'atRisk' | 'blocked'
type ReleasePhase = 'build' | 'beta' | 'ga'

const PHASE_LABEL: Record<ReleasePhase, string> = {
	build: 'Build',
	beta: 'Beta',
	ga: 'GA',
}

const RAG_LABEL: Record<Rag, string> = {
	onTrack: 'On track',
	atRisk: 'At risk',
	blocked: 'Blocked',
}

const RAG_BADGE: Record<Rag, 'green' | 'yellow' | 'red'> = {
	onTrack: 'green',
	atRisk: 'yellow',
	blocked: 'red',
}

const RAG_ICON: Record<Rag, string> = {
	onTrack: 'sandbox-check-circle',
	atRisk: 'sandbox-exclamation-triangle',
	blocked: 'sandbox-x-circle',
}

const RAG_FILL: Record<Rag, string> = {
	onTrack: 'var(--color-data-categorical-green, #0B991F)',
	atRisk: 'var(--color-data-categorical-orange, #EB6E00)',
	blocked: 'var(--color-data-categorical-red, #F5394F)',
}

const CHART_NEUTRAL = 'var(--color-border-emphasized, #8B98A9)'

const TASK_STATUS = [
	{ key: 'closed', label: 'Closed', tasks: 86, points: 190, color: 'var(--color-data-categorical-blue, #0171E3)' },
	{ key: 'inProgress', label: 'In progress', tasks: 24, points: 58, color: 'var(--color-data-categorical-green, #0B991F)' },
	{ key: 'inReview', label: 'In review', tasks: 12, points: 24, color: 'var(--color-data-categorical-orange, #EB6E00)' },
	{ key: 'blocked', label: 'Blocked', tasks: 5, points: 22, color: 'var(--color-data-categorical-red, #F5394F)' },
	{ key: 'planned', label: 'Planned', tasks: 21, points: 26, color: CHART_NEUTRAL },
]

interface Milestone {
	id: string
	name: string
	phase: ReleasePhase
	start: number
	end: number
	status: Rag
	dateLabel: string
}

const MILESTONES: Milestone[] = [
	{ id: 'm1', name: 'Kickoff & scoping', phase: 'build', start: 0, end: 8, status: 'onTrack', dateLabel: 'Apr 1 – Apr 9' },
	{ id: 'm2', name: 'Architecture sign-off', phase: 'build', start: 8, end: 20, status: 'onTrack', dateLabel: 'Apr 9 – Apr 21' },
	{ id: 'm3', name: 'Feature complete', phase: 'build', start: 20, end: 44, status: 'atRisk', dateLabel: 'Apr 21 – May 15' },
	{ id: 'm4', name: 'Private beta', phase: 'beta', start: 44, end: 62, status: 'atRisk', dateLabel: 'May 15 – Jun 2' },
	{ id: 'm5', name: 'Bug bash & hardening', phase: 'beta', start: 58, end: 72, status: 'blocked', dateLabel: 'May 29 – Jun 12' },
	{ id: 'm6', name: 'GA readiness review', phase: 'ga', start: 72, end: 82, status: 'onTrack', dateLabel: 'Jun 12 – Jun 22' },
	{ id: 'm7', name: 'Public launch', phase: 'ga', start: 82, end: 90, status: 'onTrack', dateLabel: 'Jun 22 – Jun 30' },
]

interface Workstream extends Record<string, unknown> {
	id: string
	name: string
	owner: string
	phase: ReleasePhase
	percent: number
	due: string
	status: Rag
}

const WORKSTREAMS: Workstream[] = [
	{ id: 'w1', name: 'Core platform', owner: 'Priya Raman', phase: 'build', percent: 100, due: '2026-04-21', status: 'onTrack' },
	{ id: 'w2', name: 'Data pipeline', owner: 'Marcus Webb', phase: 'build', percent: 82, due: '2026-05-08', status: 'atRisk' },
	{ id: 'w3', name: 'Admin console', owner: 'Lena Fischer', phase: 'build', percent: 91, due: '2026-05-15', status: 'onTrack' },
	{ id: 'w4', name: 'Beta onboarding', owner: 'Tom Okafor', phase: 'beta', percent: 64, due: '2026-06-02', status: 'atRisk' },
	{ id: 'w5', name: 'Load & reliability', owner: 'Dana Whitfield', phase: 'beta', percent: 38, due: '2026-06-12', status: 'blocked' },
	{ id: 'w6', name: 'Docs & enablement', owner: 'Sofia Marín', phase: 'ga', percent: 55, due: '2026-06-22', status: 'onTrack' },
	{ id: 'w7', name: 'Launch marketing', owner: 'Kenji Watanabe', phase: 'ga', percent: 41, due: '2026-06-22', status: 'onTrack' },
	{ id: 'w8', name: 'Go-to-market ops', owner: 'Lena Fischer', phase: 'ga', percent: 30, due: '2026-06-30', status: 'atRisk' },
]

interface Risk {
	id: string
	title: string
	workstream: string
	phase: ReleasePhase
	severity: Rag
	owner: string
	detail: string
}

const RISKS: Risk[] = [
	{
		id: 'r1',
		title: 'Load tests failing at 3x target concurrency',
		workstream: 'Load & reliability',
		phase: 'beta',
		severity: 'blocked',
		owner: 'Dana Whitfield',
		detail:
			'p99 latency degrades past SLO above 12k concurrent sessions. Root cause traced to connection-pool saturation; fix depends on the data-pipeline retry change landing first.',
	},
	{
		id: 'r2',
		title: 'Data pipeline backfill slower than planned',
		workstream: 'Data pipeline',
		phase: 'build',
		severity: 'atRisk',
		owner: 'Marcus Webb',
		detail:
			'Historical backfill is tracking two days behind. Mitigation: parallelizing the backfill workers; feature-complete date at risk if not recovered this week.',
	},
	{
		id: 'r3',
		title: 'Beta onboarding email deliverability',
		workstream: 'Beta onboarding',
		phase: 'beta',
		severity: 'atRisk',
		owner: 'Tom Okafor',
		detail:
			'Invite emails landing in spam for two enterprise domains. Working with IT to allowlist sending IPs before the private beta opens.',
	},
]

const BURNDOWN = (() => {
	const total = 320
	const actualRemaining = [320, 300, 286, 262, 240, 226, 210, 182, 150, 132, 96, 54, 20]
	const idealStep = total / (actualRemaining.length - 1)
	return actualRemaining.map((actual, i) => ({
		week: i,
		label: `W${i + 1}`,
		ideal: Math.max(0, Math.round(total - idealStep * i)),
		actual,
	}))
})()

const PROGRAM_STATUS: Rag = WORKSTREAMS.some((w) => w.status === 'blocked')
	? 'blocked'
	: WORKSTREAMS.some((w) => w.status === 'atRisk')
		? 'atRisk'
		: 'onTrack'

function LegendDot(props: { color: string; label: string }) @{
	<HStack gap={2} vAlign="center">
		<Icon name="sandbox-stop" size={12} color={props.color} />
		<Text type="supporting" color="secondary">
			{props.label}
		</Text>
	</HStack>
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

/** SVG donut — recharts PieChart substitute, same ring + center-total contract. */
function TaskProgressDonut() @{
	const total = TASK_STATUS.reduce((sum, s) => sum + s.tasks, 0)
	const R = 70
	const C = 2 * Math.PI * R
	let offset = 0
	const segs = TASK_STATUS.map((s) => {
		const frac = s.tasks / total
		const seg = { color: s.color, dash: frac * C, off: offset }
		offset += seg.dash
		return seg
	})

	<HStack gap={8} vAlign="center" wrap="wrap">
		<div style={{ position: 'relative', width: 200, height: 200 }}>
			<svg width={200} height={200} viewBox="0 0 200 200">
				<g transform="rotate(-90 100 100)">
					{segs.map((s, i) => (
						<circle
							key={i}
							cx={100}
							cy={100}
							r={R}
							fill="none"
							stroke={s.color}
							stroke-width={28}
							stroke-dasharray={`${s.dash} ${C - s.dash}`}
							stroke-dashoffset={-s.off}
						/>
					))}
				</g>
			</svg>
			<div
				style={{
					position: 'absolute',
					inset: 0,
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					justifyContent: 'center',
				}}
			>
				<Heading level={1}>{total}</Heading>
				<Text type="supporting" color="secondary">
					tasks
				</Text>
			</div>
		</div>
		<VStack gap={2}>
			{TASK_STATUS.map((s) => (
				<HStack key={s.key} gap={2} vAlign="center">
					<Icon name="sandbox-stop" size={12} color={s.color} />
					<Text type="supporting">
						{s.label}
					</Text>
					<Text type="supporting" color="secondary">
						{s.tasks} tasks · {s.points} pts
					</Text>
				</HStack>
			))}
		</VStack>
	</HStack>
}

/** Gantt — recharts floating-bar substitute: positioned divs on a 90-day track. */
function GanttChart(props: { milestones: Milestone[] }) @{
	<VStack gap={3}>
		<VStack gap={2}>
			{props.milestones.map((m) => (
				<HStack key={m.id} gap={3} vAlign="center">
					<div style={{ width: 160, flexShrink: 0 }}>
						<Text type="supporting" maxLines={1}>
							{m.name}
						</Text>
					</div>
					<div style={{ flex: 1, position: 'relative', height: 16 }}>
						<div
							style={{
								position: 'absolute',
								left: `${(m.start / 90) * 100}%`,
								width: `${((m.end - m.start) / 90) * 100}%`,
								height: '100%',
								borderRadius: 4,
								backgroundColor: RAG_FILL[m.status],
							}}
						/>
					</div>
					<div style={{ width: 110, flexShrink: 0 }}>
						<Text type="supporting" color="secondary">
							{m.dateLabel}
						</Text>
					</div>
				</HStack>
			))}
		</VStack>
		<HStack gap={4} vAlign="center" wrap="wrap">
			{(Object.keys(RAG_LABEL) as Rag[]).map((r) => (
				<LegendDot key={r} color={RAG_FILL[r]} label={RAG_LABEL[r]} />
			))}
		</HStack>
	</VStack>
}

const workstreamColumns: TableColumn<Workstream>[] = [
	{
		key: 'name',
		header: 'Workstream',
		renderCell: (w: Workstream) => <Text weight="semibold">{w.name}</Text>,
	},
	{
		key: 'owner',
		header: 'Owner',
		renderCell: (w: Workstream) => <Text>{w.owner}</Text>,
	},
	{
		key: 'phase',
		header: 'Phase',
		renderCell: (w: Workstream) => <Text color="secondary">{PHASE_LABEL[w.phase]}</Text>,
	},
	{
		key: 'progress',
		header: 'Progress',
		renderCell: (w: Workstream) => (
			<HStack gap={2} vAlign="center" style={{ minWidth: 140 }}>
				<ProgressBar label={w.name} isLabelHidden value={w.percent} />
				<Text type="supporting" color="secondary">
					{w.percent}%
				</Text>
			</HStack>
		),
	},
	{
		key: 'due',
		header: 'Due',
		renderCell: (w: Workstream) => <Text color="secondary">{w.due}</Text>,
	},
	{
		key: 'status',
		header: 'Status',
		renderCell: (w: Workstream) => (
			<Badge label={RAG_LABEL[w.status]} variant={RAG_BADGE[w.status]} />
		),
	},
]

function RiskCard(props: { risk: Risk }) @{
	<Card>
		<VStack gap={2}>
			<HStack hAlign="between" vAlign="start" gap={3}>
				<Heading level={4}>{props.risk.title}</Heading>
				<Badge label={RAG_LABEL[props.risk.severity]} variant={RAG_BADGE[props.risk.severity]} />
			</HStack>
			<Text type="supporting" color="secondary">
				{props.risk.workstream} · {PHASE_LABEL[props.risk.phase]} · {props.risk.owner}
			</Text>
			<Text type="body" color="secondary">
				{props.risk.detail}
			</Text>
		</VStack>
	</Card>
}

export function DashboardProgressTemplate() @{
	const [phase] = useState<ReleasePhase>('beta')
	const isNarrow = useMediaQuery('(max-width: 900px)')

	<Layout
		height="fill"
		contentWidth={1400}
		header={
			<LayoutHeader padding={6} hasDivider>
				<HStack gap={3} vAlign="center" hAlign="between" wrap="wrap">
					<VStack gap={1}>
						<Heading level={1}>Aurora Launch</Heading>
						<HStack gap={2} vAlign="center">
							<Text type="body" color="secondary">
								Program status · {PHASE_LABEL[phase]} phase
							</Text>
							<Badge
								label={RAG_LABEL[PROGRAM_STATUS]}
								variant={RAG_BADGE[PROGRAM_STATUS]}
							/>
						</HStack>
					</VStack>
					<HStack gap={2}>
						<Icon name={RAG_ICON[PROGRAM_STATUS]} size={20} color="secondary" />
					</HStack>
				</HStack>
			</LayoutHeader>
		}
		content={
			<LayoutContent padding={6}>
				<VStack gap={10}>
					<VStack gap={6}>
						<SectionHeading title="Task status" hint="148 tasks · 320 points" />
						<Card padding={6}>
							<TaskProgressDonut />
						</Card>
					</VStack>
					<VStack gap={6}>
						<SectionHeading title="Timeline" hint="Apr 1 – Jun 30" />
						<Card padding={6}>
							<GanttChart milestones={MILESTONES} />
						</Card>
					</VStack>
					<VStack gap={6}>
						<SectionHeading title="Burndown" hint="Points remaining by week" />
						<Card padding={6}>
							<ChartLines
								height={240}
								series={[
									{ name: 'Ideal', data: BURNDOWN.map((b) => b.ideal), color: CHART_NEUTRAL },
									{ name: 'Actual', data: BURNDOWN.map((b) => b.actual), color: 'var(--color-data-categorical-blue, #0171E3)' },
								]}
							/>
							<HStack gap={5} vAlign="center">
								<LegendDot color={CHART_NEUTRAL} label="Ideal" />
								<LegendDot color="var(--color-data-categorical-blue, #0171E3)" label="Actual" />
							</HStack>
						</Card>
					</VStack>
					<VStack gap={6}>
						<SectionHeading title="Workstreams" hint={`${WORKSTREAMS.length} active`} />
						<Card>
							<Table<Workstream>
								data={WORKSTREAMS}
								columns={workstreamColumns}
								idKey="id"
								hasHover
								dividers="rows"
							/>
						</Card>
					</VStack>
					<VStack gap={6}>
						<SectionHeading title="Open risks" hint={`${RISKS.length} tracked`} />
						<VStack gap={4}>
							{RISKS.map((risk) => (
								<RiskCard key={risk.id} risk={risk} />
							))}
						</VStack>
					</VStack>
					<Divider />
				</VStack>
			</LayoutContent>
		}
	/>
}
