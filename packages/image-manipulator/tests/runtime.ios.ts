import { File } from '@nativescript/core'
import { backend } from '../src/backend.ios'
import { createImageManipulator } from '../src/core'
import type { ImageRef, ImageResult, ImageManipulatorContext } from '../src/types'
import orientations from './orientation-fixtures.json'

type Context = {
	assert(name: string, actual: unknown, expected?: unknown): void
	record(name: string, value: unknown): void
	onCleanup(callback: () => void): void
}

// An asymmetric 3 × 2 RGB fixture; red channels are 20,40,60 / 80,100,120.
const source =
	'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAMAAAACCAIAAAASFvFNAAAAHElEQVR4nGMQYWDQYGCwYWBgCGBgSGFgqGBgAAANrAGldwYwdgAAAABJRU5ErkJggg=='

export async function run(ctx: Context) {
	const { ImageManipulator, releaseImage } = createImageManipulator(backend)
	const refs: ImageRef[] = []
	const contexts: ImageManipulatorContext[] = []
	const results: ImageResult[] = []
	ctx.onCleanup(() => {
		for (const ref of refs) {
			ref.release()
		}
		for (const context of contexts) {
			context.release()
		}
		for (const result of results) {
			releaseImage(result)
		}
	})
	async function save(ref: ImageRef, name: string, expected: number[]) {
		const result = await ref.saveAsync({ format: 'png', base64: true })
		results.push(result)
		ctx.assert(`${name} width`, result.width, ref.width)
		ctx.assert(`${name} height`, result.height, ref.height)
		ctx.record(name, { base64: result.base64, expected })
		return result
	}
	ctx.assert('UIKit backend available', ImageManipulator.supported)
	const context = ImageManipulator.manipulate(source)
	contexts.push(context)
	const original = await context.renderAsync()
	refs.push(original)
	ctx.assert('physical source width', original.width, 3)
	ctx.assert('physical source height', original.height, 2)
	const first = await save(original, 'source', [20, 40, 60, 80, 100, 120])
	context.crop({ originX: 1, originY: 0, width: 2, height: 2 }).rotate(90)
	const cropped = await context.renderAsync()
	refs.push(cropped)
	await save(cropped, 'crop then rotate', [100, 40, 120, 60])
	context.reset().flip('vertical')
	const flipped = await context.renderAsync()
	refs.push(flipped)
	await save(flipped, 'vertical flip', [80, 100, 120, 20, 40, 60])
	context.reset().resize({ width: 6 })
	const resized = await context.renderAsync()
	refs.push(resized)
	ctx.assert('aspect resize width', resized.width, 6)
	ctx.assert('aspect resize height', resized.height, 4)
	context.release()
	await save(original, 'retained snapshot', [20, 40, 60, 80, 100, 120])
	const child = ImageManipulator.manipulate(original).flip('horizontal')
	contexts.push(child)
	original.release()
	const derived = await child.renderAsync()
	refs.push(derived)
	await save(derived, 'ref source reuse', [60, 40, 20, 120, 100, 80])
	const jpeg = await derived.saveAsync({ format: 'jpeg', compress: 0.8, base64: true })
	results.push(jpeg)
	ctx.assert('JPEG signature', jpeg.base64?.startsWith('/9j/'))
	let rejected = false
	try {
		await derived.saveAsync({ format: 'webp' })
	} catch {
		rejected = true
	}
	ctx.assert('unsupported WebP rejects', rejected)
	releaseImage(first)
	releaseImage(first)
	ctx.assert('owned output removed', File.exists(decodeURIComponent(first.uri.slice(7))), false)
	for (const fixture of orientations) {
		const context = ImageManipulator.manipulate(fixture.source)
		contexts.push(context)
		const ref = await context.renderAsync()
		refs.push(ref)
		const result = await ref.saveAsync({ format: 'png', base64: true })
		results.push(result)
		ctx.record(`exif${fixture.orientation}`, {
			orientation: fixture.orientation,
			width: result.width,
			height: result.height,
			base64: result.base64,
		})
	}
}
