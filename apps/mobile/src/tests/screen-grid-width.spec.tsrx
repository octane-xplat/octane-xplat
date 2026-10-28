/** @jsxImportSource @nativescript-community/octane */
import '@octane-xplat/ui/theme/tokens.css'
import './screen-grid-width.css'
import { expect, it } from 'vitest'
import { isAndroid, Utils, type View as NativeView } from '@nativescript/core'
import { Grid, Screen, Text, View } from '@octane-xplat/ui'
import { mountXplat, waitUntil } from '@octane-xplat/platform/testing'

// Exercise the real RootLayout → Mason boundary. Object-driver tests cannot
// detect a native frame that fits while Mason computes wider descendants.
function ScreenGridWidth(props: { bounded: boolean }) @{
	const className = props.bounded ? 'test-screen-width-bounded' : undefined

	<rootlayout width={240} height={480}>
		<Screen>
			<Grid
				id="width-stage"
				className={className}
				rows="*"
				columns={props.bounded ? undefined : '*'}
				style={{ flex: 1 }}
			>
				<View id="width-home" row={0} col={0}>
					<Text>Home</Text>
				</View>
				<View id="width-sheet" row={0} col={0}>
					<Grid
						id="width-camera"
						className={className}
						rows="*"
						columns={props.bounded ? undefined : '*'}
						style={{ flex: 1 }}
					>
						<View
							row={0}
							col={0}
							style={{ width: '80%', padding: 24, alignSelf: 'center', justifySelf: 'center' }}
						>
							<Text>
								A permission explanation with enough wrapping text to exceed this narrow screen
								before it is constrained.
							</Text>
						</View>
					</Grid>
				</View>
			</Grid>
		</Screen>
	</rootlayout>
}

async function checkWidth(bounded: boolean) {
	const { view } = await mountXplat(ScreenGridWidth, { bounded })
	const stage: any = view.getViewById('width-stage')
	await waitUntil(() => stage?.getActualSize().width > 0, { message: 'Grid was not laid out' })
	const inner = stage.parent
	const frameWidth = inner.getActualSize().width
	expect(frameWidth).toBeCloseTo(240, 0)
	expect(
		Utils.layout.toDeviceIndependentPixels(inner.nativeViewProtected.getNode().getComputedWidth()),
	).toBeCloseTo(frameWidth, 0)

	expect(stage.getActualSize().width).toBeCloseTo(frameWidth, 0)
	if (bounded) {
		for (const id of ['width-home', 'width-sheet', 'width-camera']) {
			expect(view.getViewById<NativeView>(id)!.getActualSize().width).toBeCloseTo(frameWidth, 0)
		}
	}
}

it.skipIf(!isAndroid)(
	'keeps the Screen engine root within its native frame with intrinsic Grid content',
	async () => {
		await checkWidth(false)
	},
)

it.skipIf(!isAndroid)(
	'supports explicit bounded tracks for nested overlapping Grid layers',
	async () => {
		await checkWidth(true)
	},
)
