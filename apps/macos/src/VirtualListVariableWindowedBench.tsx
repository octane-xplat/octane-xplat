/** AppKit-only variable-height windowing probe; not the shared VirtualList API. */
/** @jsxImportSource @xplat/macos/renderer */
import { useEffect, useState } from 'octane'
import { Pressable, Text, View, VirtualList } from '@octane-xplat/ui'

type BenchItem = { id: string; label: string; height: number }
type ScrollMetrics = { verticalOffset: number; viewportHeight: number }
type WindowRange = { start: number; end: number }

const OVERSCAN_ROWS = 8
const HEIGHTS = [32, 48, 64]
// `makeStack` in the AppKit renderer defaults vertical stack spacing to 0
// (web parity — no default gap; a `gap` prop or gap-* class opts in).
const STACK_GAP = 0
const now = () => (globalThis as any).performance.now()
const count = (globalThis as any).__xplatMacOSVirtualListCount as number
const items: BenchItem[] = Array.from({ length: count }, (_, index) => ({
	id: String(index),
	label: 'Variable row ' + index,
	height: HEIGHTS[index % HEIGHTS.length],
}))

const offsets = new Array<number>(items.length + 1)
offsets[0] = 0
for (let index = 0; index < items.length; index += 1) {
	offsets[index + 1] = offsets[index] + items[index].height
}

const rowStart = (index: number) => offsets[index] + index * STACK_GAP

const scrollProbe = {
	rangeCommitMs: [] as number[],
	pendingRangeAt: 0,
	totalContentHeight: offsets[items.length] + Math.max(0, items.length - 1) * STACK_GAP,
}

;(globalThis as any).__xplatMacOSVirtualListScrollProbe = scrollProbe

function rowAtOffset(offset: number) {
	let low = 0
	let high = items.length
	const boundedOffset = Math.max(0, Math.min(offset, scrollProbe.totalContentHeight - 1))
	while (low < high) {
		const middle = Math.floor((low + high) / 2)
		if (rowStart(middle + 1) <= boundedOffset) {
			low = middle + 1
		} else {
			high = middle
		}
	}

	return Math.min(low, Math.max(0, items.length - 1))
}

function BenchRow(props: { item: BenchItem }) {
	const [pressCount, setPressCount] = useState(0)
	return (
		<Pressable
			id={'bench-row-' + props.item.id}
			style={{ height: props.item.height }}
			onPress={() => setPressCount((value) => value + 1)}
		>
			<Text>{props.item.label + ' · ' + pressCount}</Text>
		</Pressable>
	)
}

const AppKitVirtualList = VirtualList as any
const keyExtractor = (item: BenchItem) => item.id
const renderItem = (item: BenchItem) => <BenchRow item={item} />

export default function VirtualListVariableWindowedBench() {
	const [range, setRange] = useState<WindowRange>({ start: 0, end: 24 })
	const onScroll = ({ verticalOffset, viewportHeight }: ScrollMetrics) => {
		const firstVisible = rowAtOffset(verticalOffset)
		const lastVisible = rowAtOffset(verticalOffset + Math.max(1, viewportHeight) - 1)
		const start = Math.max(0, firstVisible - OVERSCAN_ROWS)
		const end = Math.min(items.length, lastVisible + 1 + OVERSCAN_ROWS)
		setRange((current) => {
			if (current.start === start && current.end === end) {
				return current
			}

			scrollProbe.pendingRangeAt = now()
			return { start, end }
		})
	}

	useEffect(() => {
		if (scrollProbe.pendingRangeAt === 0) {
			return
		}

		scrollProbe.rangeCommitMs.push(now() - scrollProbe.pendingRangeAt)
		scrollProbe.pendingRangeAt = 0
	}, [range.start, range.end])

	const renderHeader = () => <View style={{ height: rowStart(range.start) - STACK_GAP }} />
	const renderFooter = () => (
		<View
			style={{
				height:
					offsets[items.length] -
					offsets[range.end] +
					Math.max(0, items.length - range.end - 1) * STACK_GAP,
			}}
		/>
	)

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
