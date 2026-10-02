/** AppKit-only scale probe for the current shared VirtualList leaf. */
/** @jsxImportSource @octane-xplat/macos-renderer */
import { useState } from 'octane'
import { Pressable, Text, VirtualList } from '@octane-xplat/ui'

type BenchItem = { id: string; label: string }

const count = (globalThis as any).__xplatMacOSVirtualListCount as number
const items: BenchItem[] = Array.from({ length: count }, (_, index) => ({
	id: String(index),
	label: 'Benchmark row ' + index,
}))

function BenchRow(props: { item: BenchItem }) {
	const [pressCount, setPressCount] = useState(0)
	return (
		<Pressable
			id={'bench-row-' + props.item.id}
			style={{ height: 44 }}
			onPress={() => setPressCount((value) => value + 1)}
		>
			<Text>{props.item.label + ' · ' + pressCount}</Text>
		</Pressable>
	)
}

const keyExtractor = (item: BenchItem) => item.id
const renderItem = (item: BenchItem) => <BenchRow item={item} />

export default function VirtualListBench() {
	return (
		<VirtualList
			id="vlist-bench"
			className="list flex-1"
			items={items}
			keyExtractor={keyExtractor}
			renderItem={renderItem}
		/>
	)
}
