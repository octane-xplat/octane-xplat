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

function LayeredScreen() @{
	<Screen>
		<View id="bounds" style={{ width: 107, height: 400 }}>
			<Grid rows="*" columns="*" style={{ flexGrow: 1 }}>
				<View row={0} col={0}>
					<Text>Library</Text>
				</View>
				<View id="layer" row={0} col={0}>
					<Screen id="layered-screen" style={{ flexGrow: 1 }}>
						<Grid
							id="layered-stage"
							rows="*"
							columns="*"
							style={{ flexGrow: 1, flexShrink: 1, minHeight: 0 }}
						>
							<View style={{ width: '100%', aspectRatio: 360 / 640 }} />
						</Grid>
					</Screen>
				</View>
			</Grid>
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

it('fills a same-cell layer with intrinsic content without a native height pin (#42)', async () => {
	const { view } = await mountXplat(LayeredScreen)
	const bounds = view.getViewById<NativeView>('bounds')!
	const layer = view.getViewById<NativeView>('layer')!
	const screen = view.getViewById<NativeView>('layered-screen')!
	const stage = view.getViewById<NativeView>('layered-stage')!
	await waitUntil(() => screen.isLoaded)
	for (const [width, height] of [
		[107, 400],
		[107, 300],
		[107, 500],
		[200, 500],
		[107, 300],
	]) {
		bounds.style.width = width
		bounds.style.height = height
		stage.requestLayout()
		try {
			await waitUntil(() =>
				[layer, screen, stage].every((item) => {
					const size = item.getActualSize()
					return (
						Math.abs(size.height - height) <= 1 && (!isAndroid || Math.abs(size.width - width) <= 1)
					)
				}),
			)
		} catch (cause) {
			throw new Error(
				`Expected layer bounds ${width}x${height}; actual bounds: ${JSON.stringify(
					[bounds, layer, screen, stage].map((item) => ({
						id: item.id,
						...item.getActualSize(),
						styleHeight: item.style.height,
						flexGrow: item.style.flexGrow,
						minHeight: item.style.minHeight,
					})),
				)}`,
				{ cause },
			)
		}

		await new Promise((resolve) => setTimeout(resolve, 400))
		for (const item of [layer, screen, stage]) {
			expect(Math.abs(item.getActualSize().height - height)).toBeLessThanOrEqual(1)
			// Added Android width coverage catches stale-frame intrinsic minima.
			// iOS can still report zero stage width after settling; see the beta.5
			// qualification in masonkit-layout-evaluation.md. Height remains cross-platform.
			if (isAndroid) {
				expect(Math.abs(item.getActualSize().width - width)).toBeLessThanOrEqual(1)
			}
		}
	}
})
