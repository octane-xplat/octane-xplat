import { serverBoundary } from '@octane-xplat/lib/server-boundary'
import { tsrx } from '@octane-xplat/build/vite'
import { fileURLToPath } from 'node:url'
import { normalizePath, type Plugin } from 'vite'

/** Use alongside octane() for paired browser/server builds. This binds the
 * browser root factory to an explicit unsupported server implementation; it
 * also enforces explicit .server module boundaries in browser builds. */
export function webHost(): Plugin[] {
	const entry = import.meta.resolve('@octane-xplat/ui/routing/web-host')
	const browserRoot = normalizePath(fileURLToPath(new URL('./browser-root.web.ts', entry)))
	const serverRoot = fileURLToPath(new URL('./browser-root.server.web.ts', entry))
	return [
		serverBoundary(),
		tsrx('web'),
		{
			name: 'xplat-web-host',
			enforce: 'pre',
			config: () => ({
				resolve: {
					// Vite 8 feeds top-level `resolve` only into the client
					// environment, and user conditions replace the env defaults
					// rather than append — keep web first, then the client
					// defaults or browser/dev-prod conditional exports degrade.
					conditions: ['web', 'module', 'browser', 'development|production'],
					extensions: [
						'.web.tsrx',
						'.web.tsx',
						'.web.ts',
						'.tsrx',
						'.tsx',
						'.ts',
						'.mjs',
						'.js',
						'.json',
					],
				},
				ssr: {
					// Top-level `resolve` feeds only the client environment in
					// Vite 8 — without the web condition here the SSR bundle
					// resolves conditional exports (e.g.
					// @octane-xplat/lib/escape-props) to their native defaults.
					resolve: {
						conditions: ['web', 'module', 'node', 'development|production'],
					},
					noExternal: [
						'@octane-xplat/web-host',
						'@octane-xplat/ui',
						'@octane-xplat/lib',
						'@octane-xplat/platform',
					],
				},
			}),
			async resolveId(source, importer, options) {
				if (!options.ssr || !source.endsWith('/browser-root.web')) {
					return null
				}
				const resolved = await this.resolve(source, importer, { skipSelf: true })
				return resolved && normalizePath(resolved.id) === browserRoot ? serverRoot : null
			},
		},
	]
}

/** Add to custom non-SSR builds to enforce the same boundary as Xplat presets. */
export { serverBoundary }
