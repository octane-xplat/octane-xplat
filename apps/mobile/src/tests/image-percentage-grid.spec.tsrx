/** @jsxImportSource @nativescript-community/octane */
import { expect, it } from 'vitest'
import { ImageSource, isAndroid, knownFolders, path as nsPath } from '@nativescript/core'
import { Grid, Image, Screen, View } from '@octane-xplat/ui'
import { mountXplat, waitUntil } from '@octane-xplat/platform/testing'

// Issue #41: does a percentage-sized native Image inflate a `*` grid track's
// minimum? Web reference (Chromium): 402-wide `1fr 1fr` grid, tiles containing
// a 360x640 bitmap at width/height 100% lay out at 201/201. MasonKit beta.126
// reportedly produced 226-wide tiles (402 * 360/640 aspect-fit).

function makeFixture(): { path: string; width: number; height: number } {
	const w = 360
	const h = 640
	const source = new ImageSource()
	if (isAndroid) {
		const bmp = (globalThis as any).android.graphics.Bitmap.createBitmap(
			w,
			h,
			(globalThis as any).android.graphics.Bitmap.Config.ARGB_8888,
		)

		bmp.eraseColor((globalThis as any).android.graphics.Color.RED)
		source.setNativeSource(bmp)
	} else {
		const size = (globalThis as any).CGSizeMake(w, h)

		;(globalThis as any).UIGraphicsBeginImageContextWithOptions(size, true, 1)

		;(globalThis as any).UIColor.redColor.setFill()

		;(globalThis as any).UIRectFill((globalThis as any).CGRectMake(0, 0, w, h))
		const img = (globalThis as any).UIGraphicsGetImageFromCurrentImageContext()

		;(globalThis as any).UIGraphicsEndImageContext()
		source.setNativeSource(img)
	}

	const file = nsPath.join(knownFolders.temp().path, `issue41-${w}x${h}.png`)
	if (!source.saveToFile(file, 'png')) {
		throw new Error('failed to write fixture PNG')
	}

	const check = ImageSource.fromFileSync(file)
	expect(check?.width).toBe(w)
	expect(check?.height).toBe(h)
	return { path: file, width: check?.width ?? -1, height: check?.height ?? -1 }
}

let fixture: string | undefined
function fixturePath(): string {
	if (!fixture) {
		fixture = makeFixture().path
	}

	return fixture
}

async function settle(view: any, grid: any, ids: string[]) {
	await waitUntil(
		() => {
			const g = grid?.getActualSize?.().width > 0
			if (!g) {
				return false
			}

			return ids.every((id) => {
				const el: any = view.getViewById(id)
				return el && !el.isLoading && el.imageSource && el.getActualSize().width > 0
			})
		},
		{ message: `layout/images not settled: ${ids.join(',')}` },
	)
}

function NestedTiles() @{
	const src = fixturePath()

	<rootlayout width={402} height={480}>
		<Screen>
			<Grid id="grid" columns="*,*" style={{ width: 402 }}>
				<View id="tile-0" row={0} col={0} style={{ height: 402 }}>
					<View style={{ flexGrow: 1 }}>
						<Image
							id="img-0"
							src={src}
							alt=""
							contentFit="cover"
							style={{ width: '100%', height: '100%' }}
						/>
					</View>
				</View>
				<View id="tile-1" row={0} col={1} style={{ height: 402 }}>
					<View style={{ flexGrow: 1 }}>
						<Image
							id="img-1"
							src={src}
							alt=""
							contentFit="cover"
							style={{ width: '100%', height: '100%' }}
						/>
					</View>
				</View>
			</Grid>
		</Screen>
	</rootlayout>
}

function DirectTiles() @{
	const src = fixturePath()

	<rootlayout width={402} height={480}>
		<Screen>
			<Grid id="grid" columns="*,*" style={{ width: 402 }}>
				<View id="tile-0" row={0} col={0} style={{ height: 402 }}>
					<Image
						id="img-0"
						src={src}
						alt=""
						contentFit="cover"
						style={{ width: '100%', height: '100%' }}
					/>
				</View>
				<View id="tile-1" row={0} col={1} style={{ height: 402 }}>
					<Image
						id="img-1"
						src={src}
						alt=""
						contentFit="cover"
						style={{ width: '100%', height: '100%' }}
					/>
				</View>
			</Grid>
		</Screen>
	</rootlayout>
}

function ImageItems() @{
	const src = fixturePath()

	<rootlayout width={402} height={480}>
		<Screen>
			<Grid id="grid" columns="*,*" style={{ width: 402 }}>
				<Image
					id="img-0"
					row={0}
					col={0}
					src={src}
					alt=""
					contentFit="cover"
					style={{ width: '100%', height: 402 }}
				/>
				<Image
					id="img-1"
					row={0}
					col={1}
					src={src}
					alt=""
					contentFit="cover"
					style={{ width: '100%', height: 402 }}
				/>
			</Grid>
		</Screen>
	</rootlayout>
}

async function runCase(component: any, tileIds: string[]) {
	const { view } = await mountXplat(component)
	const grid: any = view.getViewById('grid')
	await settle(view, grid, ['img-0', 'img-1'])
	await waitUntil(
		() =>
			tileIds.every((id) => {
				const tile: any = view.getViewById(id)
				return tile && Math.abs(tile.getActualSize().width - 201) <= 1
			}),
		{ message: 'percentage images inflated the two 201-point tracks' },
	)

	for (const [index, id] of tileIds.entries()) {
		const tile: any = view.getViewById(id)
		expect(tile).toBeDefined()
		expect(tile.getActualSize().width).toBeCloseTo(201, 0)
		expect(tile.getLocationRelativeTo(grid).x).toBeCloseTo(index * 201, 0)
	}

	for (const id of ['img-0', 'img-1']) {
		const image: any = view.getViewById(id)
		expect(image.getActualSize().width).toBeCloseTo(201, 0)
		expect(image.getActualSize().height).toBeCloseTo(402, 0)
	}
}

it('keeps nested flex tiles at their star-track share with percentage Images (#41)', async () => {
	await runCase(NestedTiles, ['tile-0', 'tile-1'])
})

it('keeps direct percentage Images inside their star-track share (#41)', async () => {
	await runCase(DirectTiles, ['tile-0', 'tile-1'])
})

it('keeps percentage Image grid items inside their star-track share (#41)', async () => {
	await runCase(ImageItems, ['img-0', 'img-1'])
})
