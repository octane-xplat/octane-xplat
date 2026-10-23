import { build } from 'vite'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { octane } from 'octane/compiler/vite'
import { webHost } from '../src/build/vite.ts'
const root = new URL('..', import.meta.url).pathname
const common = {
	root,
	configFile: false,
	define: { 'process.env.NODE_ENV': '"production"' },
	resolve: { conditions: ['web'], extensions: ['.web.tsrx', '.tsrx', '.web.ts', '.ts', '.js'] },
}

await build({
	...common,
	plugins: [webHost(), octane()],
	build: {
		outDir: 'example/dist/client',
		emptyOutDir: true,
		lib: { entry: root + '/example/client.web.ts', formats: ['es'], fileName: () => 'client.js' },
	},
})

await build({
	...common,
	plugins: [webHost(), octane()],
	ssr: {
		noExternal: [
			'@octane-xplat/web-host',
			'@octane-xplat/ui',
			'@octane-xplat/lib',
			'@octane-xplat/platform',
		],
	},
	build: { ssr: root + '/example/server.web.ts', outDir: 'example/dist/server', emptyOutDir: true },
})

// Keep static HTML separate from client assets so only owned pages are replaced.
const { prerender } = await import('../src/build/prerender.ts')
const { staticRenderer } = await import('./dist/server/server.web.js')
console.log(
	await prerender(staticRenderer, {
		origin: 'http://localhost:4174',
		outDir: root + '/example/dist/static',
		cacheFile: root + '/node_modules/.cache/example-prerender.json',
		revision: createHash('sha256')
			.update(await readFile(new URL('./dist/server/server.web.js', import.meta.url)))
			.digest('hex'),
		paths: async () =>
			['coat', 'hat'].map((id) => ({
				destination: { to: '/products/:id', params: { id } },
				key: `product-${id}-v1`,
			})),
	}),
)
