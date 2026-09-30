import { useState } from 'octane'
import { Pressable, Text, View, VirtualList } from '@octane-xplat/ui'
import {
	VIRTUAL_LIST_BENCH_FIXED_ITEMS,
	VIRTUAL_LIST_BENCH_ITEMS,
	type VirtualListBenchItem,
} from './virtual-list-benchmark'

import { runVirtualListBenchmark, runVirtualListInputBenchmark } from './platform/virtual-list-benchmark'

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
export function VirtualListBenchmark(props: { fixed?: boolean } = {}) @{
	const [fixedMode, setFixedMode] = useState(props.fixed ?? false)
	const [status, setStatus] = useState(
		props.fixed ? 'Ready · 5,000 fixed-height rows' : 'Ready · 5,000 variable-height rows',
	)

	const [result, setResult] = useState('')
	const [running, setRunning] = useState(false)
	const [inputRunning, setInputRunning] = useState(false)
	const items = fixedMode ? VIRTUAL_LIST_BENCH_FIXED_ITEMS : VIRTUAL_LIST_BENCH_ITEMS

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

	const startInput = () => {
		if (inputRunning) return
		setInputRunning(true)
		setStatus('Capturing real scroll input for 20 seconds…')
		void runVirtualListInputBenchmark('vlist-bench-list')
			.then((metrics) => {
				console.log('[vlist-input] result ' + JSON.stringify(metrics))
				setStatus(`Capture complete · ${metrics.scroll.movementSamples} offset changes`)
			})
			.catch((error) => {
				const message = error instanceof Error ? error.message : String(error)
				console.log('[vlist-input] error ' + message)
				setStatus('Capture failed · ' + message)
			})
			.finally(() => setInputRunning(false))
	}

	<View className="flex-1 min-h-0 gap-2">
		<Pressable
			id="vlist-bench-height-mode"
			onPress={() => setFixedMode(!fixedMode)}
			className="btn btn-secondary"
		>
			<Text>{fixedMode ? 'Use variable row heights' : 'Use fixed 48-unit rows'}</Text>
		</Pressable>
		<Pressable id="vlist-bench-run" onPress={start} className="btn btn-primary">
			<Text>{running ? 'Profiling…' : 'Start profile'}</Text>
		</Pressable>
		<Pressable id="vlist-bench-input-run" onPress={startInput} className="btn btn-secondary">
			<Text>{inputRunning ? 'Capturing input…' : 'Capture wheel / touch input'}</Text>
		</Pressable>
		<Text id="vlist-bench-status" className="text-sm text-muted">{status}</Text>
		{result ? <Text className="text-xs text-muted">{'Result: ' + result}</Text> : null}
		<VirtualList
			id="vlist-bench-list"
			className="flex-1 min-h-0"
			items={items}
			keyExtractor={keyExtractor}
			renderItem={renderItem}
		/>
	</View>
}

export function VirtualListBenchmarkFixed() @{
	<VirtualListBenchmark fixed />
}
