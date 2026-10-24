/** @jsxImportSource @nativescript-community/octane */
import { expect, it } from 'vitest'
import { isAndroid, type View as NativeView } from '@nativescript/core'
import { Grid, Screen, Text, View } from '@octane-xplat/ui'
import { mountXplat, waitUntil } from '@octane-xplat/platform/testing'

function ForeignScreen() @{
	<Screen>
		<View id="box" style={{ width: 107, height: 200 }}>
			<Screen id="foreign" style={{ flexGrow: 1 }}>
				<Grid id="stage" rows="*" columns="*" style={{ flexGrow: 1 }}>
					<Text id="leaf" style={{ height: 80 }}>
						Intrinsic content
					</Text>
				</Grid>
			</Screen>
		</View>
	</Screen>
}

it.skipIf(!isAndroid)(
	'preserves foreign Screen flex height after child requests and parent resize (#42)',
	async () => {
		const { view } = await mountXplat(ForeignScreen)
		const box = view.getViewById<NativeView>('box')!
		const foreign = view.getViewById<NativeView>('foreign')!
		const stage = view.getViewById<NativeView>('stage')!
		const leaf = view.getViewById<NativeView>('leaf')!
		await waitUntil(() => leaf.isLoaded)
		// Screen.style targets its inner column. Constrain the foreign RootLayout
		// itself so the test exercises Mason's foreign grow/stretch frame.
		Object.assign(foreign.style, { flexGrow: 1, alignSelf: 'stretch' })
		for (const height of [200, 120, 260]) {
			box.style.height = height
			Object.assign(leaf, { text: `Height ${height}` })
			leaf.requestLayout()
			await waitUntil(() =>
				[box, foreign, stage].every((item) => Math.abs(item.getActualSize().height - height) <= 1),
			)

			// Give a pending content-height remeasurement time to overwrite the frame.
			await new Promise((resolve) => setTimeout(resolve, 400))
			for (const item of [box, foreign, stage]) {
				expect(Math.abs(item.getActualSize().height - height)).toBeLessThanOrEqual(1)
			}
		}
	},
)
