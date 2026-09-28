/** @jsxImportSource @xplat/macos/renderer */
import { Pressable, Text, View } from '@octane-xplat/ui'
import { useState } from 'octane/universal/native'
import { openWindow, setWindowContentResolver } from './appkit.mjs'

setWindowContentResolver((data) => (data?.view === 'details' ? DetailsView : null))

function DetailsView(props: { data: { count: number }; controller: { close(): void } }) {
	return (
		<View gap={12} style={{ padding: 24 }}>
			<Text style={{ fontSize: 16, color: '#334155' }}>
				Count when opened: {String(props.data.count)}
			</Text>
			<Pressable
				accessibilityRole="button"
				accessibilityLabel="Close details"
				onPress={() => props.controller.close()}
				style={{ padding: 10, backgroundColor: '#e2e8f0', borderRadius: 8 }}
			>
				<Text style={{ fontSize: 14, color: '#172554' }}>Close details</Text>
			</Pressable>
		</View>
	)
}

export default function App(props: { parentWindow: object }) {
	const [count, setCount] = useState(0)

	return (
		<View gap={12} style={{ padding: 24 }}>
			<Text style={{ fontSize: 24, color: '#172554' }}>Octane on macOS</Text>
			<Text style={{ fontSize: 16, color: '#334155' }}>Count: {count}</Text>
			<Pressable
				accessibilityRole="button"
				accessibilityLabel="Add one"
				onPress={() => setCount((value) => value + 1)}
				style={{ padding: 10, backgroundColor: '#2563eb', borderRadius: 8 }}
			>
				<Text style={{ fontSize: 14, color: '#ffffff' }}>Add one</Text>
			</Pressable>
			<Pressable
				accessibilityRole="button"
				accessibilityLabel="Open details window"
				onPress={() =>
					openWindow({
						kind: 'dialog',
						parent: props.parentWindow,
						title: 'Details',
						data: { view: 'details', count },
					})
				}
				style={{ padding: 10, backgroundColor: '#e2e8f0', borderRadius: 8 }}
			>
				<Text style={{ fontSize: 14, color: '#172554' }}>Open details window</Text>
			</Pressable>
		</View>
	)
}
