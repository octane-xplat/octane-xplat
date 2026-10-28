import { runInNewContext } from 'node:vm'
import { createImageRequests } from '../../src/image-requests.ts'
import { imagePixelSize } from '../../src/image-pixels.ts'
import { createImageByteCache } from '../../src/image-byte-cache.ts'
import { sourceWithoutImports } from '../mock-globals.ts'
import { imageCacheFixture } from './image-cache.ts'
/** Isolated image module state without native framework loads or disk I/O. */
export function rendererImageFixture() {
	const env = imageCacheFixture()
	let decodes = 0
	const errors: unknown[] = []
	const bitmap = (fields: object) => Object.defineProperty(fields, 'representations', { value: [{ pixelsWide: 64, pixelsHigh: 32 }] })
	const source = sourceWithoutImports(new URL('../../src/image.ts', import.meta.url)).replace(/^export /gm, '')
	const image = runInNewContext(source + '\n;({ updateImage, disposeImage, imageMemoryCache, imageCache, setImageEventHandlers })', {
		...env.native, createImageRequests, createImageByteCache, imagePixelSize, setTimeout, clearTimeout, console: { ...console, error: (...args: unknown[]) => errors.push(args) },
		NSImage: { alloc: () => ({ initWithData: (data: unknown) => { decodes++; return bitmap({ data }) }, initWithContentsOfFile: (path: string) => bitmap({ path }) }) },
		NSData: { alloc: () => ({ initWithBase64EncodedStringOptions: (value: string, options: number) => ({ value, options }) }) },
	})
	return { ...env, ...image, errors, decodes: () => decodes }
}
