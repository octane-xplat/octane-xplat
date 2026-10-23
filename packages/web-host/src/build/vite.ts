import { fileURLToPath } from 'node:url'
import { normalizePath, type Plugin } from 'vite'

/** Use alongside octane() for paired browser/server builds. This binds the
 * browser root factory to an explicit unsupported server implementation; it
 * does not strip application server exports or implement a server-code boundary. */
export function webHost(): Plugin {
	const entry = import.meta.resolve('@octane-xplat/ui/routing/web-host')
	const browserRoot = normalizePath(fileURLToPath(new URL('../browser-root.web.ts', entry)))
	const serverRoot = fileURLToPath(new URL('../browser-root.server.web.ts', entry))
	return {
		name: 'xplat-web-host',
		enforce: 'pre',
		config: () => ({
			resolve: {
				conditions: ['web'],
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
	}
}
