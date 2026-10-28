import { runInNewContext } from 'node:vm'
import { createImageRequests } from '../../src/image-requests.ts'
import { createImageByteCache } from '../../src/image-byte-cache.ts'
import { sourceWithoutImports } from '../mock-globals.ts'
import { imageCacheFixture } from './image-cache.ts'
/** Isolated image module state without native framework loads or disk I/O. */
export function rendererImageFixture() {
	const env = imageCacheFixture()
	let decodes = 0
	const source = sourceWithoutImports(new URL('../../src/image.ts', import.meta.url)).replace(/^export /gm, '')
	const image = runInNewContext(source + '\n;({ updateImage, disposeImage, imageMemoryCache, imageCache })', {
		...env.native, createImageRequests, createImageByteCache, setTimeout, clearTimeout, console,
		NSImage: { alloc: () => ({ initWithData: (data: unknown) => { decodes++; return { data } }, initWithContentsOfFile: (path: string) => ({ path }) }) },
		NSData: { alloc: () => ({ initWithBase64EncodedStringOptions: (value: string, options: number) => ({ value, options }) }) },
	})
	return { ...env, ...image, decodes: () => decodes }
}
