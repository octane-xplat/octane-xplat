import { existsSync } from 'node:fs'
import { dirname, isAbsolute, resolve } from 'node:path'
import postcss, {
	type Plugin as PostcssPlugin,
	type Root,
	type AcceptedPlugin,
	type ProcessOptions,
} from 'postcss'
import loadPostcssConfig from 'postcss-load-config'
import type { Alias, Plugin, UserConfig, ResolverFunction } from 'vite'

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

const buildTargets = new Set([
	'web',
	'ios',
	'android',
	'visionos',
	'macos',
	'windows',
	'linux',
	'gtk',
	'native',
])
const targets = new Set([...buildTargets, 'mobile'])
const qualified = /\.(web|ios|android|visionos|mobile|macos|windows|linux|gtk|native)\.css$/
const cssId = /\.css(?:[?#].*)?$/
const cleanId = (id: string) => id.split(/[?#]/, 1)[0]

function suffixes(platform: CssPlatform): string[] {
	if (platform === 'ios' || platform === 'android') return [platform, 'mobile']
	if (platform === 'visionos') return ['ios', 'mobile']
	return platform === 'native' ? [] : [platform]
}

function matches(condition: string, platform: CssPlatform): boolean {
	return (
		condition === platform ||
		(condition === 'mobile' && ['ios', 'android', 'visionos'].includes(platform)) ||
		(condition === 'native' && platform !== 'web')
	)
}

function filterPlatforms(root: Root, platform: CssPlatform) {
	// Validate even unreachable nested conditions so typos fail on every target.
	root.walkAtRules('platform', (rule) => {
		const condition = rule.params.replace(/\/\*[\s\S]*?\*\//g, '').trim()
		if (!targets.has(condition) || !rule.nodes) {
			throw rule.error(`Expected @platform <target> { ... }; targets: ${[...targets].join(', ')}`)
		}
	})
	root.walkAtRules('platform', (rule) => {
		const condition = rule.params.replace(/\/\*[\s\S]*?\*\//g, '').trim()
		if (matches(condition, platform)) rule.replaceWith(...rule.nodes!)
		else rule.remove()
	})
}

/** Compile platform blocks while retaining source positions for diagnostics. */
export function platformCssPlugin(
	platform: CssPlatform,
	deferred = new Set<string>(),
): PostcssPlugin {
	return {
		postcssPlugin: 'xplat-platform',
		Once(root) {
			if (![...deferred].some((id) => root.source?.input.file?.endsWith(id)))
				filterPlatforms(root, platform)
		},
	}
}

/** Parse platform CSS without losing authored declaration positions for audits. */
export function parsePlatformCss(css: string, platform: CssPlatform, from?: string): Root {
	const root = postcss.parse(css, { from })
	filterPlatforms(root, platform)
	return root
}

/** Filter authored or generated CSS before a target-specific consumer parses it. */
export function filterPlatformCss(css: string, platform: CssPlatform, from?: string): string {
	return css.includes('@platform') ? parsePlatformCss(css, platform, from).toString() : css
}

/**
 * Select platform CSS siblings and compile build-time `@platform` blocks.
 * CSS suffixes replace the unsuffixed file; they never append to it. Explicit
 * platform filenames stay exact. Native presets include this automatically;
 * web apps add `xplatCss('web')` to their Vite plugins.
 */
export function xplatCss(platform: CssPlatform = 'web'): Plugin {
	if (!buildTargets.has(platform)) throw new Error(`Unknown CSS build target: ${platform}`)
	const candidates = new Set<string>()
	const deferred = new Set<string>()
	let aliases: readonly Alias[] = []
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
		api: {
			platform,
			defer: (id: string) => deferred.add(id),
			filter: (css: string, from?: string) => filterPlatformCss(css, platform, from),
			project(css: string, from: string, previousMap?: string) {
				const result = postcss([platformCssPlugin(platform)]).process(css, {
					from,
					to: from,
					map: previousMap ? { prev: previousMap, inline: false, annotation: false } : false,
				})
				return { css: result.css, map: result.map?.toString() }
			},
		},
		enforce: 'pre',
		async config(userConfig): Promise<UserConfig> {
			if (userConfig.css?.transformer === 'lightningcss') {
				throw new Error(
					'xplatCss requires the PostCSS transformer; use Lightning CSS for minification instead',
				)
			}
			const configuredAliases = userConfig.resolve?.alias ?? []
			aliases = Array.isArray(configuredAliases)
				? [...configuredAliases]
				: Object.entries(configuredAliases).map(([find, replacement]) => ({ find, replacement }))
			const configured = userConfig.css?.postcss
			let settings: { options?: ProcessOptions; plugins?: AcceptedPlugin[] } = {}
			if (configured && typeof configured === 'object') {
				const { plugins, ...options } = configured
				settings = { options, plugins }
			} else {
				try {
					settings = await loadPostcssConfig(
						{},
						typeof configured === 'string' ? configured : (userConfig.root ?? process.cwd()),
					)
				} catch (error) {
					if (!(error instanceof Error) || !error.message.includes('No PostCSS Config found'))
						throw error
				}
			}
			// Assign rather than return: Vite concatenates plugin arrays on merge.
			userConfig.css ??= {}
			userConfig.css.postcss = {
				...settings.options,
				plugins: [platformCssPlugin(platform, deferred), ...(settings.plugins ?? [])],
			}

			// Vite's CSS @import resolver uses aliases but bypasses resolveId
			// plugins. The same alias therefore handles JS imports and @import.
			return {
				resolve: {
					alias: [
						{
							find: cssId,
							replacement: '$&',
							// Vite 8.3 types this hook synchronously; its alias runner awaits it.
							customResolver: async function (
								this: ThisParameterType<ResolverFunction>,
								source: string,
								importer: string | undefined,
								options: Parameters<ResolverFunction>[2],
							) {
								// The catch-all alias runs ahead of user aliases; honor their
								// normal first-match mapping before selecting the CSS sibling.
								for (const alias of aliases) {
									if (
										typeof alias.find === 'string'
											? source !== alias.find && !source.startsWith(alias.find + '/')
											: !alias.find.test(source)
									)
										continue
									source = source.replace(alias.find, alias.replacement)
									if (alias.customResolver) {
										const resolver =
											typeof alias.customResolver === 'function'
												? alias.customResolver
												: alias.customResolver.resolveId
										const result = await resolver.call(this, source, importer, options)
										return typeof result === 'string'
											? select(result)
											: result && typeof result === 'object'
												? { ...result, id: select(result.id) }
												: result
									}
									break
								}
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
		transform(code, id) {
			if (
				!cssId.test(id) ||
				/(?:\?|&)(?:raw|url)(?:&|$)/.test(id) ||
				!code.includes('@platform') ||
				[...deferred].some((suffix) => cleanId(id).endsWith(suffix))
			)
				return
			const result = postcss([platformCssPlugin(platform)]).process(code, {
				from: cleanId(id),
				map: { inline: false, annotation: false },
			})
			return { code: result.css, map: result.map?.toString() ?? null }
		},
		configureServer(server) {
			const changed = (file: string) => {
				if (!candidates.has(file)) return
				// Vite caches import resolutions separately from transformed modules.
				void server.restart().catch((error) => server.config.logger.error(String(error)))
			}
			server.watcher.on('add', changed).on('unlink', changed)
			server.httpServer?.once('close', () => {
				server.watcher.off('add', changed).off('unlink', changed)
			})
		},
	}
}
