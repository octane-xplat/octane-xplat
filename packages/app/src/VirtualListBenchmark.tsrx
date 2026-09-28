import { useState } from 'octane'
import { Pressable, Text, View, VirtualList } from '@octane-xplat/ui'
import {
	VIRTUAL_LIST_BENCH_ITEMS,
	type VirtualListBenchItem,
} from './virtual-list-benchmark'
import { runVirtualListBenchmark } from './platform/virtual-list-benchmark'

const keyExtractor = (item: VirtualListBenchItem) => item.id
const renderItem = (item: VirtualListBenchItem) => <BenchmarkRow item={item} />

function BenchmarkRow(props: { item: VirtualListBenchItem }) @{
	<View
		id={'vlist-bench-row-' + props.item.index}
		className="px-3"
		style={{ height: props.item.height, flexShrink: 0, justifyContent: 'center' }}
	>
		<Text className="text-sm">{'Row ' + props.item.index}</Text>
	</View>
}

/** Harness-only, opt-in Q30 profile for the shared VirtualList leaves. */
export function VirtualListBenchmark() @{
	const [status, setStatus] = useState('Ready · 5,000 variable-height rows')
	const [result, setResult] = useState('')
	const [running, setRunning] = useState(false)

	const start = () => {
		if (running) return
		setRunning(true)
		setStatus('Running a 60 Hz scroll trace with deep seeks…')
		setResult('')
		void runVirtualListBenchmark('vlist-bench-list')
			.then((metrics) => {
				const json = JSON.stringify(metrics)
				console.log('[vlist-benchmark] result ' + json)
				setResult(json)
				setStatus('Profile complete')
			})
			.catch((error) => {
				const message = error instanceof Error ? error.message : String(error)
				console.log('[vlist-benchmark] error ' + message)
				setStatus('Profile failed · ' + message)
			})
			.finally(() => setRunning(false))
	}

	<View className="flex-1 min-h-0 gap-2">
		<Pressable id="vlist-bench-run" onPress={start} className="btn btn-primary">
			<Text>{running ? 'Profiling…' : 'Start profile'}</Text>
		</Pressable>
		<Text id="vlist-bench-status" className="text-sm text-muted">{status}</Text>
		{result ? <Text className="text-xs text-muted">{'Result: ' + result}</Text> : null}
		<VirtualList
			id="vlist-bench-list"
			className="flex-1 min-h-0"
			items={VIRTUAL_LIST_BENCH_ITEMS}
			keyExtractor={keyExtractor}
			renderItem={renderItem}
		/>
	</View>
}
