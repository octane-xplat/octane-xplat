import { existsSync } from 'node:fs'
import { dirname, isAbsolute, resolve } from 'node:path'
import type { Plugin, UserConfig, ResolverFunction } from 'vite'

/** Renderer targets accepted by platform CSS selection and `@platform` blocks. */
export type CssPlatform =
	| 'web'
	| 'ios'
	| 'android'
	| 'visionos'
	| 'macos'
	| 'windows'
	| 'linux'
	| 'gtk'
	| 'native'

const targets = new Set([
	'web',
	'ios',
	'android',
	'visionos',
	'macos',
	'windows',
	'linux',
	'gtk',
	'native',
	'mobile',
])
const qualified = /\.(web|ios|android|visionos|mobile|macos|windows|linux|gtk|native)\.css$/
const cssId = /\.css(?:[?#].*)?$/
const cleanId = (id: string) => id.split(/[?#]/, 1)[0]

function suffixes(platform: CssPlatform): string[] {
	if (platform === 'ios' || platform === 'android') return [platform, 'mobile']
	if (platform === 'visionos') return ['visionos', 'ios', 'mobile']
	return platform === 'native' ? ['mobile'] : [platform]
}

/**
 * Select platform CSS siblings for the build target.
 * CSS suffixes replace the unsuffixed file; they never append to it. Explicit
 * platform filenames stay exact. Native presets include this automatically;
 * web apps add `xplatCss('web')` to their Vite plugins.
 */
export function xplatCss(platform: CssPlatform = 'web'): Plugin {
	if (!targets.has(platform) || platform === ('mobile' as string))
		throw new Error(`Unknown CSS build target: ${platform}`)
	const candidates = new Set<string>()
	const select = (id: string) => {
		const file = cleanId(id)
		if (!file.endsWith('.css') || qualified.test(file)) return id
		const choices = [
			...suffixes(platform).map((suffix) => file.slice(0, -4) + `.${suffix}.css`),
			file,
		]
		for (const choice of choices) candidates.add(choice)
		const selected = choices.find((choice) => existsSync(choice))
		return selected ? selected + id.slice(file.length) : id
	}
	return {
		name: 'xplat-platform-css',
		enforce: 'pre',
		config(): UserConfig {
			// Vite's CSS @import resolver uses aliases but bypasses resolveId
			// plugins. The same alias therefore handles JS imports and @import.
			return {
				resolve: {
					alias: [
						{
							find: cssId,
							replacement: '$&',
							customResolver: async function (
								this: ThisParameterType<ResolverFunction>,
								source: string,
								importer: string | undefined,
								options: Parameters<ResolverFunction>[2],
							) {
								const file = cleanId(source)
								const local =
									file.startsWith('.') && importer
										? resolve(dirname(cleanId(importer)), file)
										: isAbsolute(file) && existsSync(file)
											? file
											: undefined
								if (local) {
									const selected = select(local + source.slice(file.length))
									if (existsSync(cleanId(selected))) return selected
								}
								const resolved = await this.resolve(source, importer, {
									...options,
									skipSelf: true,
								})
								return resolved ? { ...resolved, id: select(resolved.id) } : null
							} as unknown as ResolverFunction,
						},
					],
				},
			}
		},
		configureServer(server) {
			const changed = (file: string) => {
				if (!candidates.has(file)) return
				server.moduleGraph.invalidateAll()
				server.ws.send({ type: 'full-reload' })
			}
			server.watcher.on('add', changed).on('unlink', changed)
			server.httpServer?.once('close', () => {
				server.watcher.off('add', changed).off('unlink', changed)
			})
		},
	}
}
