/** @jsxImportSource @octane-xplat/macos-renderer */
import { useState } from 'octane'
import { Pressable, ScrollableArea, Text, View } from '@octane-xplat/ui'

/** App-owned refresh: a named action outside the viewport, pending state,
 * and readable completion/error feedback. Replace loadRows with app data. */
export function ScrollBoxDemo() @{
	const [rows, setRows] = useState(Array.from({ length: 24 }, (_, i) => `Row ${i + 1}`))
	const [refreshing, setRefreshing] = useState(false)
	const [status, setStatus] = useState('Ready')
	async function refresh() {
		if (refreshing) {
			return
		}

		setRefreshing(true)
		setStatus('Refreshing rows')
		try {
			const next = await Promise.resolve(
				Array.from({ length: 24 }, (_, i) => `Updated row ${i + 1}`),
			)

			setRows(next)
			setStatus('Rows updated')
		} catch {
			setStatus('Could not refresh. Try again.')
		} finally {
			setRefreshing(false)
		}
	}

	<View className="vx-app flex-1 gap-4">
		<Pressable disabled={refreshing} accessibilityLabel="Refresh rows" onPress={refresh}>
			<Text>{refreshing ? 'Refreshing…' : 'Refresh rows'}</Text>
		</Pressable>
		<Text accessibilityLabel={status}>{status}</Text>
		<ScrollableArea id="scrollbox-demo" label="Rows" className="flex-1">
			<View className="gap-2">
				{rows.map((row) => (
					<Text key={row} className="cell">
						{row}
					</Text>
				))}
			</View>
		</ScrollableArea>
	</View>
}
