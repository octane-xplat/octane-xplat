import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { createServer } from 'vite'
import { octane } from 'octane/compiler/vite'

const root = fileURLToPath(new URL('..', import.meta.url))
const repo = fileURLToPath(new URL('../../..', import.meta.url))
const server = await createServer({
	root,
	configFile: false,
	plugins: [octane()],
	resolve: { extensions: ['.web.ts', '.ts', '.tsx', '.js'] },
	server: { host: '127.0.0.1', port: 0, fs: { allow: [repo] } },
})

let browser
try {
	await server.listen()
	browser = await chromium.launch()
	const page = await browser.newPage()
	const errors = []
	page.on('pageerror', (error) => errors.push(error.message))
	await page.goto(`${server.resolvedUrls.local[0]}tests/index.html`)
	const result = await page.evaluate(async () => {
		const { ImageManipulator, SaveFormat, FlipType, releaseImage } =
			await import('/src/index.web.ts')
		const original = document.createElement('canvas')
		original.width = 3
		original.height = 2
		const ctx = original.getContext('2d')
		const values = [20, 40, 60, 80, 100, 120]
		const bytes = new Uint8ClampedArray(values.flatMap((value) => [value, 0, 0, 255]))
		ctx.putImageData(new ImageData(bytes, 3, 2), 0, 0)
		const uri = original.toDataURL('image/png')
		const read = async (result) => {
			const img = new Image()
			img.src = result.uri
			await img.decode()
			const canvas = document.createElement('canvas')
			canvas.width = img.naturalWidth
			canvas.height = img.naturalHeight
			const draw = canvas.getContext('2d')
			draw.drawImage(img, 0, 0)
			const data = draw.getImageData(0, 0, canvas.width, canvas.height).data
			return {
				width: canvas.width,
				height: canvas.height,
				reds: Array.from(data).filter((_, index) => index % 4 === 0),
			}
		}
		const run = async (change) => {
			const context = ImageManipulator.manipulate(uri)
			change(context)
			const image = await context.renderAsync()
			context.release()
			const saved = await image.saveAsync({ format: SaveFormat.PNG, base64: true })
			image.release()
			const pixels = await read(saved)
			const mimeType = (await fetch(saved.uri).then((response) => response.blob())).type
			releaseImage(saved)
			let revoked = false
			try {
				await fetch(saved.uri)
			} catch {
				revoked = true
			}
			return { ...pixels, mimeType, base64: Boolean(saved.base64), revoked }
		}
		const rotated = await run((context) => context.rotate(90))
		const cropped = await run((context) =>
			context.crop({ originX: 1, originY: 0, width: 2, height: 2 }).rotate(90),
		)
		const flipped = await run((context) => context.flip(FlipType.Vertical))
		const enlarged = await run((context) =>
			context.extent({ width: 4, height: 3, originX: 1, originY: 1, backgroundColor: '#ff0000' }),
		)
		const resize = await run((context) => context.resize({ width: 6 }))
		const context = ImageManipulator.manipulate(uri)
		const pending = context.renderAsync()
		context.rotate(180)
		const turned = await context.renderAsync()
		const before = await pending
		context.reset()
		const restored = await context.renderAsync()
		context.release()
		const child = ImageManipulator.manipulate(before).flip(FlipType.Horizontal)
		before.release()
		const derived = await child.renderAsync()
		child.release()
		const saveAndRead = async (image) => {
			const saved = await image.saveAsync({ format: SaveFormat.PNG })
			image.release()
			const value = await read(saved)
			releaseImage(saved)
			return value
		}
		const frozen = await saveAndRead(turned)
		const reset = await saveAndRead(restored)
		const reuse = await saveAndRead(derived)
		const failed = ImageManipulator.manipulate(uri).crop({
			originX: 2,
			originY: 1,
			width: 2,
			height: 2,
		})
		let boundsError = false
		try {
			await failed.renderAsync()
		} catch {
			boundsError = true
		}
		failed.release()
		const { exerciseHook } = await import('/tests/hook.web.tsx')
		const { stable, boundsChanged, sourceChanged, unmounted } = await exerciseHook(uri)
		return {
			rotated,
			cropped,
			flipped,
			enlarged,
			resize,
			frozen,
			reset,
			reuse,
			boundsError,
			stable,
			boundsChanged,
			sourceChanged,
			unmounted,
		}
	})
	assert.deepEqual(result.rotated.reds, [80, 20, 100, 40, 120, 60])
	assert.deepEqual([result.rotated.width, result.rotated.height], [2, 3])
	assert.deepEqual(result.cropped.reds, [100, 40, 120, 60])
	assert.deepEqual(result.flipped.reds, [80, 100, 120, 20, 40, 60])
	assert.deepEqual(result.enlarged.reds, [255, 255, 255, 255, 255, 20, 40, 60, 255, 80, 100, 120])
	assert.deepEqual([result.resize.width, result.resize.height], [6, 4])
	assert.deepEqual(result.frozen.reds, [120, 100, 80, 60, 40, 20])
	assert.deepEqual(result.reset.reds, [20, 40, 60, 80, 100, 120])
	assert.deepEqual(result.reuse.reds, [60, 40, 20, 120, 100, 80])
	assert.equal(result.boundsError, true)
	assert.equal(result.stable, true)
	assert.equal(
		result.boundsChanged,
		true,
		JSON.stringify({
			stable: result.stable,
			boundsChanged: result.boundsChanged,
			sourceChanged: result.sourceChanged,
			unmounted: result.unmounted,
		}),
	)
	assert.equal(result.sourceChanged, true)
	assert.equal(result.unmounted, true)
	for (const sample of [
		result.rotated,
		result.cropped,
		result.flipped,
		result.enlarged,
		result.resize,
	]) {
		assert.equal(sample.mimeType, 'image/png')
		assert.equal(sample.base64, true)
		assert.equal(sample.revoked, true)
	}
	assert.deepEqual(errors, [])
	console.log(
		'Chromium: exact pixel transforms, action order, resize, extent, encoded output, source refs, reset, release, bounds and Octane hook lifecycle passed; no screenshots captured.',
	)
} finally {
	await browser?.close()
	await server.close()
}
