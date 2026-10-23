/** @jsxImportSource @nativescript-community/octane */
import { expect, it } from 'vitest'
import { isIOS, type View as NativeView } from '@nativescript/core'
import { Grid, Screen, Text } from '@octane-xplat/ui'
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
