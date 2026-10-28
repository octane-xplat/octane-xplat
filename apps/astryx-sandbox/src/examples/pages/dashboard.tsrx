// Port of upstream templates/pages/dashboard/page.tsx (Astryx 0.6.4, MIT) —
// route /templates/dashboard/.
// GAPS: recharts (BarChart/LineChart/ResponsiveContainer) → app-local SVG
// helpers in ./charts.tsrx (recorded finding); the 96-point/15-min series is
// decimated to 24 hourly points with the same shape; hover tooltips and
// axis/gridline chrome are not re-created.
import { useState } from 'octane'
import {
	Button, Card, Divider, Grid, Heading, HStack, Icon, Layout,
	LayoutContent, Link, ProgressBar, Table, Text, VStack,
} from '@octane-xplat/ui'
import type { TableColumn } from '@octane-xplat/ui'
import { ChartLines, ChartSparkline, ChartStackedBar } from './charts'

const chartColors = {
	allUsers: '#3b82f6',
	desktop: '#22c55e',
	mobile: '#f59e0b',
}

// Decimated from upstream's 96-point 15-min series — same 24h shape.
const ACTIVE_USERS = {
	all: [116, 110, 100, 93, 85, 75, 69, 60, 56, 55, 52, 49, 48, 50, 54, 58, 63, 69, 78, 89, 102, 110, 114, 116],
	desktop: [79, 72, 57, 41, 34, 26, 21, 14, 14, 17, 16, 15, 15, 19, 23, 28, 34, 41, 49, 58, 67, 74, 78, 79],
	mobile: [37, 38, 43, 52, 51, 49, 48, 46, 42, 38, 36, 34, 33, 31, 31, 30, 29, 28, 29, 31, 35, 36, 36, 37],
}

const SPARKLINES = {
	sessions: [42, 45, 44, 48, 52, 49, 55, 58],
	conversion: [3.1, 3.2, 3.0, 3.4, 3.6, 3.5, 3.8, 4.0],
	revenue: [12, 13, 12.5, 14, 15, 14.5, 16, 17],
	bounce: [38, 39, 37, 36, 38, 35, 34, 33],
}

const CHANNEL_DATA = [
	{ label: 'Organic', value: 42, color: '#3b82f6' },
	{ label: 'Direct', value: 28, color: '#22c55e' },
	{ label: 'Referral', value: 18, color: '#f59e0b' },
	{ label: 'Social', value: 12, color: '#a855f7' },
]

interface Campaign extends Record<string, unknown> {
	id: string
	name: string
	status: 'active' | 'paused'
	sessions: number
	conversion: string
}

const CAMPAIGNS: Campaign[] = [
	{ id: '1', name: 'Spring Launch', status: 'active', sessions: 12480, conversion: '4.2%' },
	{ id: '2', name: 'Docs Refresh', status: 'active', sessions: 9320, conversion: '3.8%' },
	{ id: '3', name: 'Brand Awareness', status: 'paused', sessions: 5140, conversion: '2.1%' },
	{ id: '4', name: 'Retargeting', status: 'active', sessions: 4270, conversion: '5.6%' },
]

const campaignColumns: TableColumn<Campaign>[] = [
	{
		key: 'name',
		header: 'Campaign',
		renderCell: (item: Campaign) => <Text weight="semibold">{item.name}</Text>,
	},
	{
		key: 'status',
		header: 'Status',
		renderCell: (item: Campaign) => (
			<span className={item.status === 'active' ? 'sb-badge sb-badge--green' : 'sb-badge sb-badge--neutral'}>
				{item.status}
			</span>
		),
	},
	{
		key: 'sessions',
		header: 'Sessions',
		renderCell: (item: Campaign) => <Text>{item.sessions.toLocaleString()}</Text>,
	},
	{
		key: 'conversion',
		header: 'Conversion',
		renderCell: (item: Campaign) => <Text color="secondary">{item.conversion}</Text>,
	},
]

function MetricCard(props: {
	label: string
	value: string
	delta: string
	up: boolean
	data: readonly number[]
	color: string
}) @{
	<Card>
		<VStack gap={2}>
			<Heading level={4}>{props.label}</Heading>
			<HStack gap={2} vAlign="center">
				<Heading level={2}>{props.value}</Heading>
				<HStack gap={1} vAlign="center">
					<Icon
						name={props.up ? 'sandbox-arrow-up' : 'sandbox-arrow-down'}
						size={12}
						color={props.up ? 'success' : 'error'}
					/>
					<Text type="body" color="secondary">
						{props.delta}
					</Text>
				</HStack>
			</HStack>
			<ChartSparkline data={props.data} color={props.color} height={24} />
			<Text type="supporting" color="secondary">
				Last 8 days
			</Text>
		</VStack>
	</Card>
}

export function DashboardTemplate() @{
	const [reloadCount, setReloadCount] = useState(0)

	<Layout
		height="fill"
		contentWidth={1400}
		content={
			<LayoutContent padding={6}>
				<VStack gap={6}>
					<VStack gap={6}>
						<HStack hAlign="between" vAlign="center">
							<Heading level={3}>Active users</Heading>
							<Button
								label="Reload"
								variant="secondary"
								icon={<Icon name="sandbox-arrow-path" size={16} />}
								clickAction={() => setReloadCount((c) => c + 1)}
							/>
						</HStack>
						<Card>
							<VStack gap={3}>
								<ChartLines
									height={300}
									series={[
										{ name: 'All Users', data: ACTIVE_USERS.all, color: chartColors.allUsers },
										{ name: 'Desktop', data: ACTIVE_USERS.desktop, color: chartColors.desktop },
										{ name: 'Mobile', data: ACTIVE_USERS.mobile, color: chartColors.mobile },
									]}
								/>
								<HStack gap={6} vAlign="center">
									<HStack gap={2} vAlign="center">
										<Icon name="sandbox-stop" size={12} color={chartColors.allUsers} />
										<Text type="supporting" color="secondary">All Users</Text>
									</HStack>
									<HStack gap={2} vAlign="center">
										<Icon name="sandbox-stop" size={12} color={chartColors.desktop} />
										<Text type="supporting" color="secondary">Desktop</Text>
									</HStack>
									<HStack gap={2} vAlign="center">
										<Icon name="sandbox-stop" size={12} color={chartColors.mobile} />
										<Text type="supporting" color="secondary">Mobile</Text>
									</HStack>
								</HStack>
							</VStack>
						</Card>
						<Grid columns={{ minWidth: 260 }} style={{ gap: 'var(--spacing-4)' }}>
							<MetricCard
								label="Sessions"
								value="128.4k"
								delta="+12.4%"
								up
								data={SPARKLINES.sessions}
								color="#3b82f6"
							/>
							<MetricCard
								label="Conversion"
								value="4.02%"
								delta="+0.6%"
								up
								data={SPARKLINES.conversion}
								color="#22c55e"
							/>
							<MetricCard
								label="Revenue"
								value="$86.2k"
								delta="+9.1%"
								up
								data={SPARKLINES.revenue}
								color="#f59e0b"
							/>
							<MetricCard
								label="Bounce rate"
								value="32.8%"
								delta="-1.9%"
								up={false}
								data={SPARKLINES.bounce}
								color="#ef4444"
							/>
						</Grid>
						<Grid columns={{ minWidth: 320 }} style={{ gap: 'var(--spacing-4)' }}>
							<Card>
								<VStack gap={4}>
									<Heading level={4}>Traffic channels</Heading>
									<ChartStackedBar segments={CHANNEL_DATA} height={24} />
									<HStack gap={4} wrap="wrap">
										{CHANNEL_DATA.map((d) => (
											<VStack key={d.label} gap={0}>
												<HStack gap={2} vAlign="center">
													<Icon name="sandbox-stop" size={12} color={d.color} />
													<Text type="supporting">{d.label}</Text>
												</HStack>
												<Text type="supporting" color="secondary">
													{d.value}%
												</Text>
											</VStack>
										))}
									</HStack>
								</VStack>
							</Card>
							<Card>
								<VStack gap={6}>
									<HStack hAlign="between" vAlign="center">
										<Heading level={4}>Campaigns</Heading>
										<Link href="#">View all</Link>
									</HStack>
									<Table<Campaign>
										data={CAMPAIGNS}
										columns={campaignColumns}
									/>
								</VStack>
							</Card>
						</Grid>
						<Card>
							<VStack gap={3}>
								<Heading level={4}>Weekly goals</Heading>
								<Divider />
								<VStack gap={2}>
									<HStack hAlign="between">
										<Text type="body">Deploy pipeline migration</Text>
										<Text type="body" color="secondary">72%</Text>
									</HStack>
									<ProgressBar label="Deploy pipeline migration" isLabelHidden value={72} />
								</VStack>
								<VStack gap={2}>
									<HStack hAlign="between">
										<Text type="body">Template coverage</Text>
										<Text type="body" color="secondary">48%</Text>
									</HStack>
									<ProgressBar label="Template coverage" isLabelHidden value={48} />
								</VStack>
							</VStack>
						</Card>
					</VStack>
				</VStack>
			</LayoutContent>
		}
	/>
}
