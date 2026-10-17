// @ts-nocheck — .mjs→.ts port: annotations pending (transitional)
// Test-only loader for utility modules that now ship as TypeScript source.
import { createRequire } from 'node:module'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const requireWeb = createRequire(new URL('../apps/web/package.json', import.meta.url))

export async function loadSource(url, options = {}) {
	const file = fileURLToPath(url)
	const { createServer } = await import(requireWeb.resolve('vite'))
	const server = await createServer({
		configFile: false,
		root: dirname(file),
		logLevel: 'error',
		server: { middlewareMode: true, watch: null, hmr: false },
		...options,
	})

	try {
		return await server.ssrLoadModule(file)
	} finally {
		await server.close()
	}
}
