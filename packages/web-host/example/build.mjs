import { build } from 'vite'
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
