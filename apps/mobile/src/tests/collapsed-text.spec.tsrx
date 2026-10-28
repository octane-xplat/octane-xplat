/** @jsxImportSource @octane-xplat/jsx */
import { expect, it } from 'vitest'
import { isIOS, type View as NativeView } from '@nativescript/core'
import { Grid, Screen, Text, View } from '@octane-xplat/ui'
import { mountXplat, waitUntil } from '@octane-xplat/platform/testing'

function CollapsedText() @{
	<Screen>
		<Grid rows="*" columns="*,*">
			<Text id="collapsed-leaf" style={{ visibility: 'collapse' }}>
				x
			</Text>
		</Grid>
	</Screen>
}

// The consumer player is a Screen layered in the same grid cell as its
// library. Its RootLayout is a foreign leaf of the surrounding Mason View.
function LayeredCollapsedText() @{
	<Screen>
		<Grid rows="*" columns="*">
			<View row={0} col={0}>
				<Text>Library</Text>
			</View>
			<View row={0} col={0} style={{ flexGrow: 1 }}>
				<Screen>
					<Grid id="player-stage" rows="*" columns="*,*">
						<Text id="collapsed-leaf" style={{ visibility: 'collapse' }}>
							Player layout probe
						</Text>
					</Grid>
				</Screen>
			</View>
		</Grid>
	</Screen>
}

function CollapsedGridItem() @{
	<Screen>
		<Grid rows="auto" columns="auto,auto" style={{ width: 100 }}>
			<Text id="collapsed-leaf" style={{ visibility: 'collapse', width: 80, height: 30 }}>
				x
			</Text>
			<Text id="following-leaf" style={{ width: 20, height: 30 }}>
				y
			</Text>
		</Grid>
	</Screen>
}

// The host Vitest timeout catches a main-thread freeze: an in-app timeout
// cannot report failure when UIKit layout starves the JavaScript event loop.
it.skipIf(!isIOS)(
	'keeps timers alive with a single collapsed Text in Screen/Grid (#45)',
	async () => {
		const { view } = await mountXplat(CollapsedText)
		for (let tick = 0; tick < 5; tick++) {
			await new Promise((resolve) => setTimeout(resolve, 200))
		}

		expect(view.getViewById<NativeView>('collapsed-leaf')?.visibility).toBe('collapse')
	},
)

it.skipIf(!isIOS)(
	'omits a collapsed Text grid item and restores its slot on visibility changes',
	async () => {
		const { view } = await mountXplat(CollapsedGridItem)
		const leaf = view.getViewById<NativeView>('collapsed-leaf')!
		const following = view.getViewById<NativeView>('following-leaf')!
		const left = () => following.getLocationRelativeTo(following.parent as NativeView)?.x
		await waitUntil(() => following.getActualSize().width > 0)
		expect(left()).toBeCloseTo(0, 0)
		leaf.visibility = 'hidden'
		await waitUntil(() => Math.abs((left() ?? -1) - 80) < 1)
		leaf.visibility = 'collapse'
		await waitUntil(() => Math.abs(left() ?? -1) < 1)
		leaf.visibility = 'visible'
		await waitUntil(() => Math.abs((left() ?? -1) - 80) < 1)
	},
)

it.skipIf(!isIOS)(
	'keeps timers alive after measuring and requesting layout in a layered collapsed-text screen (#50)',
	async () => {
		const { view } = await mountXplat(LayeredCollapsedText)
		const leaf = view.getViewById<NativeView>('collapsed-leaf')!
		const stage = view.getViewById<NativeView>('player-stage')!
		await waitUntil(() => leaf.isLoaded)
		for (const visibility of ['collapse', 'hidden', 'visible', 'collapse'] as const) {
			leaf.visibility = visibility
			stage.getActualSize()
			leaf.getActualSize()
			leaf.requestLayout()
			for (let tick = 0; tick < 5; tick++) {
				await new Promise((resolve) => setTimeout(resolve, 200))
			}

			expect(leaf.visibility).toBe(visibility)
		}
	},
)
