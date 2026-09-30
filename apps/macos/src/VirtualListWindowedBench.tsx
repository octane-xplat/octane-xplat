/** AppKit-only fixed-height windowing probe; not the shared VirtualList API. */
/** @jsxImportSource @xplat/macos/renderer */
import { useState } from 'octane'
import { Pressable, Text, View, VirtualList } from '@octane-xplat/ui'

type BenchItem = { id: string; label: string }
type ScrollMetrics = { verticalOffset: number; viewportHeight: number }

const ROW_HEIGHT = 44
// `makeStack` in the AppKit renderer defaults vertical stack spacing to 0
// (web parity — no default gap; a `gap` prop or gap-* class opts in).
const STACK_GAP = 0
const ROW_STEP = ROW_HEIGHT + STACK_GAP
const OVERSCAN_ROWS = 8
const count = (globalThis as any).__xplatMacOSVirtualListCount as number
const items: BenchItem[] = Array.from({ length: count }, (_, index) => ({
	id: String(index),
	label: 'Windowed row ' + index,
}))

function BenchRow(props: { item: BenchItem }) {
	const [pressCount, setPressCount] = useState(0)
	return (
		<Pressable
			id={'bench-row-' + props.item.id}
			style={{ height: ROW_HEIGHT }}
			onPress={() => setPressCount((value) => value + 1)}
		>
			<Text>{props.item.label + ' · ' + pressCount}</Text>
		</Pressable>
	)
}

const AppKitVirtualList = VirtualList as any
const keyExtractor = (item: BenchItem) => item.id
const renderItem = (item: BenchItem) => <BenchRow item={item} />

export default function VirtualListWindowedBench() {
	const [range, setRange] = useState({ start: 0, end: 24 })
	const onScroll = ({ verticalOffset, viewportHeight }: ScrollMetrics) => {
		const firstVisible = Math.floor(Math.max(0, verticalOffset) / ROW_STEP)
		const visibleCount = Math.max(1, Math.ceil(viewportHeight / ROW_STEP) + 2)
		const start = Math.max(0, firstVisible - OVERSCAN_ROWS)
		const end = Math.min(items.length, firstVisible + visibleCount + OVERSCAN_ROWS)
		setRange((current) =>
			current.start === start && current.end === end ? current : { start, end },
		)
	}

	const renderHeader = () => <View style={{ height: range.start * ROW_STEP - STACK_GAP }} />
	const renderFooter = () => {
		const remaining = items.length - range.end
		return (
			<View
				style={{ height: remaining * ROW_HEIGHT + Math.max(0, remaining - 1) * STACK_GAP }}
			/>
		)
	}

	return (
		<AppKitVirtualList
			id="vlist-bench"
			className="list flex-1"
			items={items.slice(range.start, range.end)}
			keyExtractor={keyExtractor}
			renderItem={renderItem}
			renderHeader={range.start > 0 ? renderHeader : undefined}
			renderFooter={range.end < items.length ? renderFooter : undefined}
			onScroll={onScroll}
		/>
	)
}
