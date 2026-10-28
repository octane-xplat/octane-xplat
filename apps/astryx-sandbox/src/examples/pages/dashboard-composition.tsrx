// Port of upstream templates/pages/dashboard-composition/page.tsx (Astryx
// 0.6.4, MIT) — route /templates/dashboard-composition/.
// GAPS: recharts (AreaChart/LineChart/ResponsiveContainer) → app-local SVG
// helpers in ./charts.tsrx (recorded finding); upstream DropdownMenu items
// {label,onClick} → {type:'action',key,label,onSelect}.
import { useState } from 'octane'
import {
	Button, Card, Divider, DropdownMenu, Grid, GridSpan, Heading, HStack,
	Icon, Layout, LayoutContent, Link, List, ListItem, Table, Text, VStack, pixel } from '@octane-xplat/ui'
import type { TableColumn } from '@octane-xplat/ui'
import { ChartLines, ChartSparkline } from './charts'

// Deterministic LCG so the sparklines are stable across renders.
function genSpark(seed: number, start: number, end: number, volatility: number, N = 48): number[] {
	let s = seed >>> 0
	const rand = () => {
		s = (Math.imul(s, 1664525) + 1013904223) >>> 0
		return s / 0x100000000
	}
	const points: number[] = []
	let drift = 0
	for (let i = 0; i < N; i++) {
		const t = i / (N - 1)
		const trend = start + (end - start) * t
		const wave =
			Math.sin(t * Math.PI * 2.3 + seed * 0.13) * volatility * 1.4 +
			Math.sin(t * Math.PI * 5.7 + seed * 0.41) * volatility * 0.9 +
			Math.sin(t * Math.PI * 13.1 + seed * 0.07) * volatility * 0.5
		drift = drift * 0.55 + (rand() - 0.5) * volatility * 2.2
		const spike = rand() < 0.04 ? (rand() - 0.5) * volatility * 4 : 0
		points.push(trend + wave + drift + spike)
	}
	return points
}

// Portfolio value anchors (months, k$) → sampled into the chart series.
const PORTFOLIO_ANCHORS: [number, number][] = [
	[0, 218], [2, 226], [4, 231], [6, 248], [8, 262], [10, 279], [12, 294],
]
const portfolioData = (() => {
	const points: number[] = []
	const totalDays = PORTFOLIO_ANCHORS[PORTFOLIO_ANCHORS.length - 1][0]
	const N = 49
	for (let i = 0; i < N; i++) {
		const day = (i / (N - 1)) * totalDays
		let j = 0
		while (j < PORTFOLIO_ANCHORS.length - 2 && PORTFOLIO_ANCHORS[j + 1][0] < day) {j++}
		const [d0, v0] = PORTFOLIO_ANCHORS[j]
		const [d1, v1] = PORTFOLIO_ANCHORS[j + 1]
		const t = (day - d0) / (d1 - d0)
		const base = v0 + (v1 - v0) * t
		const seed = Math.sin(day * 12.9898 + 78.233) * 43758.5453
		const noise = (seed - Math.floor(seed) - 0.5) * 3.6
		points.push(Number((base + noise).toFixed(1)))
	}
	return points
})()

const metrics = [
	{ value: '$294,200', change: '+14.8%', label: 'Total value' },
	{ value: '14.8%', change: '+2.1%', label: 'Annual return' },
	{ value: '2.8%', change: '$2,060/qtr', label: 'Dividend yield' },
	{ value: '23', change: '+4 YTD', label: 'Total asset holdings' },
]

const topAssets = [
	{ ticker: 'AAPL', name: 'Apple Inc.', value: '$87,200', change: '+18.4%' },
	{ ticker: 'MSFT', name: 'Microsoft Corp.', value: '$72,500', change: '+14.7%' },
	{ ticker: 'NVDA', name: 'NVIDIA Corp.', value: '$63,800', change: '+31.2%' },
	{ ticker: 'VTI', name: 'Vanguard Total Stock', value: '$58,400', change: '+11.3%' },
	{ ticker: 'BND', name: 'Vanguard Total Bond', value: '$45,600', change: '+4.2%' },
]

const marketIndices = [
	{ name: 'Dow Jones', ticker: 'DJI', price: '43,821.67', change: '+0.42%', positive: true, spark: genSpark(1337, 78, 84, 3.2) },
	{ name: 'NASDAQ', ticker: 'IXIC', price: '18,942.18', change: '-0.50%', positive: false, spark: genSpark(2718, 62, 55, 3.0) },
	{ name: 'S&P 500', ticker: 'SPX', price: '5,918.33', change: '+0.18%', positive: true, spark: genSpark(3141, 70, 73, 2.4) },
	{ name: 'NYSE Composite', ticker: 'NYA', price: '19,752.41', change: '+0.31%', positive: true, spark: genSpark(1618, 66, 70, 2.0) },
	{ name: 'NVIDIA Corp.', ticker: 'NVDA', price: '$177.39', change: '+2.94%', positive: true, spark: genSpark(4242, 58, 74, 4.4) },
	{ name: 'Intel Corp.', ticker: 'INTC', price: '$50.38', change: '-1.12%', positive: false, spark: genSpark(5555, 72, 63, 3.6) },
	{ name: 'Nokia Corp.', ticker: 'NOK', price: '$8.82', change: '+0.57%', positive: true, spark: genSpark(8888, 46, 50, 2.2) },
	{ name: 'Tesla, Inc.', ticker: 'TSLA', price: '$360.59', change: '-0.88%', positive: false, spark: genSpark(9999, 80, 71, 5.2) },
]

interface StockRow extends Record<string, unknown> {
	id: string
	ticker: string
	price: string
	dailyPts: number
	dailyPct: number
	weekChg: number
}

const trendingStocks: StockRow[] = [
	{ id: '1', ticker: 'AAPL', price: '$188.72', dailyPts: 1.35, dailyPct: 0.72, weekChg: 22.4 },
	{ id: '2', ticker: 'MSFT', price: '$415.6', dailyPts: 3.2, dailyPct: 0.78, weekChg: 18.6 },
	{ id: '3', ticker: 'NVDA', price: '$177.39', dailyPts: 1.65, dailyPct: 0.93, weekChg: 45.2 },
	{ id: '4', ticker: 'AMZN', price: '$186.5', dailyPts: -0.8, dailyPct: -0.43, weekChg: 15.3 },
	{ id: '5', ticker: 'GOOGL', price: '$155.72', dailyPts: 2.1, dailyPct: 1.37, weekChg: 12.8 },
]

function SignedCell(props: { value: number; suffix: string }) @{
	const positive = props.value >= 0
	<HStack gap={1} vAlign="center">
		<Icon
			name={positive ? 'sandbox-arrow-trending-up' : 'sandbox-arrow-trending-down'}
			size={12}
			color={positive ? 'success' : 'error'}
		/>
		<Text style={{ color: positive ? 'var(--color-text-success, #067647)' : 'var(--color-text-error, #d92d20)' }}>
			{positive ? '+' : ''}
			{props.value.toFixed(2)}
			{props.suffix}
		</Text>
	</HStack>
}

const trendingColumns: TableColumn<StockRow>[] = [
	{
		key: 'ticker',
		header: 'Ticker',
		renderCell: (row: StockRow) => <Text weight="semibold">{row.ticker}</Text>,
	},
	{
		key: 'price',
		header: 'Price',
		renderCell: (row: StockRow) => <Text>{row.price}</Text>,
	},
	{
		key: 'dailyPts',
		header: 'Daily pts',
		renderCell: (row: StockRow) => <SignedCell value={row.dailyPts} suffix="" />,
	},
	{
		key: 'dailyPct',
		header: 'Daily %',
		renderCell: (row: StockRow) => <SignedCell value={row.dailyPct} suffix="%" />,
	},
	{
		key: 'weekChg',
		header: 'Week chg',
		renderCell: (row: StockRow) => <SignedCell value={row.weekChg} suffix="%" />,
	},
]

function MetricCard(props: { value: string; change: string; label: string }) @{
	const positive = !props.change.startsWith('-')
	<Card>
		<VStack gap={2}>
			<Heading level={2}>{props.value}</Heading>
			<HStack gap={1} vAlign="center">
				<Icon
					name={positive ? 'sandbox-arrow-trending-up' : 'sandbox-arrow-trending-down'}
					size={12}
					color={positive ? 'success' : 'error'}
				/>
				<Text type="supporting" style={{ color: positive ? 'var(--color-text-success, #067647)' : 'var(--color-text-error, #d92d20)' }}>
					{props.change}
				</Text>
				<Text type="supporting" color="secondary">
					{props.label}
				</Text>
			</HStack>
		</VStack>
	</Card>
}

function AssetRow(props: { ticker: string; name: string; value: string; change: string }) @{
	<ListItem
		label={props.ticker}
		description={props.name}
		startContent={<Avatar ticker={props.ticker} size="md" />}
		endContent={
			<VStack gap={0} style={{ alignItems: 'flex-end' }}>
				<Text type="body">{props.value}</Text>
				<Text type="supporting" style={{ color: 'var(--color-text-success, #067647)' }}>
					{props.change}
				</Text>
			</VStack>
		}
	/>
}

function MarketCard(props: {
	name: string
	ticker: string
	price: string
	change: string
	positive: boolean
	spark: number[]
}) @{
	<Card>
		<VStack gap={2}>
			<HStack hAlign="between" vAlign="center">
				<Heading level={4}>{props.name}</Heading>
				<Text type="supporting" color="secondary">
					{props.ticker}
				</Text>
			</HStack>
			<HStack gap={2} vAlign="center">
				<Heading level={3}>{props.price}</Heading>
				<Text type="body" style={{ color: props.positive ? 'var(--color-text-success, #067647)' : 'var(--color-text-error, #d92d20)' }}>
					{props.change}
				</Text>
			</HStack>
			<ChartSparkline
				data={props.spark}
				color={props.positive ? '#22c55e' : '#ef4444'}
				height={40}
			/>
		</VStack>
	</Card>
}

function Avatar(props: { ticker: string; size: string }) @{
	// Letter-avatar for tickers — the public Avatar `name` field renders
	// initials already.
	<div
		style={{
			width: 32,
			height: 32,
			borderRadius: '50%',
			backgroundColor: 'var(--color-background-subtle)',
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			fontSize: 11,
			fontWeight: 600,
		}}
	>
		{props.ticker.slice(0, 4)}
	</div>
}

export function DashboardCompositionTemplate() @{
	const [timeRange, setTimeRange] = useState('1 year')

	<Layout
		height="fill"
		content={
			<LayoutContent padding={6}>
				<VStack gap={6}>
					<HStack hAlign="between" vAlign="center">
						<Heading level={1}>My Portfolio</Heading>
						<DropdownMenu
							button={{
								label: timeRange,
								variant: 'secondary',
								size: 'lg',
							}}
							hasChevron
							items={[
								{ type: 'action', key: '1m', label: '1 month', onSelect: () => setTimeRange('1 month') },
								{ type: 'action', key: '3m', label: '3 months', onSelect: () => setTimeRange('3 months') },
								{ type: 'action', key: '6m', label: '6 months', onSelect: () => setTimeRange('6 months') },
								{ type: 'action', key: '1y', label: '1 year', onSelect: () => setTimeRange('1 year') },
								{ type: 'action', key: '5y', label: '5 years', onSelect: () => setTimeRange('5 years') },
								{ type: 'action', key: 'all', label: 'All time', onSelect: () => setTimeRange('All time') },
							]}
						/>
					</HStack>

					<Grid columns={{ minWidth: 280, repeat: 'fit' }} style={{ gap: 'var(--spacing-4)' }}>
						{metrics.map((m) => (
							<MetricCard key={m.label} {...m} />
						))}
					</Grid>

					<Grid columns={{ minWidth: 280, max: 4 }} style={{ gap: 'var(--spacing-4)' }}>
						<GridSpan columns={3}>
							<Card>
								<VStack gap={4}>
									<HStack hAlign="between" vAlign="center">
										<Heading level={3}>Portfolio Value</Heading>
										<Link href="#">View details</Link>
									</HStack>
									<ChartLines
										height={340}
										series={[{ data: portfolioData, color: '#3b82f6', area: true }]}
									/>
								</VStack>
							</Card>
						</GridSpan>
						<GridSpan columns={1}>
							<Card>
								<VStack gap={4}>
									<HStack hAlign="between" vAlign="center">
										<Heading level={3}>Top Assets</Heading>
										<Link href="#">View all</Link>
									</HStack>
									<List density="spacious">
										{topAssets.map((asset) => (
											<AssetRow key={asset.ticker} {...asset} />
										))}
									</List>
								</VStack>
							</Card>
						</GridSpan>
					</Grid>

					<Divider />

					<HStack hAlign="between" vAlign="start">
						<VStack gap={1}>
							<Heading level={1}>Market Today</Heading>
							<Text type="body" color="secondary">
								Past 24 hours
							</Text>
						</VStack>
						<Button label="View more" variant="secondary" size="lg" clickAction={() => {}} />
					</HStack>

					<Grid columns={{ minWidth: 320, repeat: 'fit' }} style={{ gap: 'var(--spacing-4)' }}>
						{marketIndices.map((m) => (
							<MarketCard key={m.ticker} {...m} />
						))}
					</Grid>

					<Card>
						<VStack gap={4}>
							<Heading level={3}>Trending Stocks</Heading>
							<Table<StockRow>
								data={trendingStocks}
								columns={trendingColumns}
								idKey="id"
								hasHover
								dividers="rows"
							/>
						</VStack>
					</Card>
				</VStack>
			</LayoutContent>
		}
	/>
}
