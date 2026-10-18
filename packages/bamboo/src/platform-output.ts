import { createHash } from 'node:crypto'
import { posix } from 'node:path'
import MagicString from 'magic-string'
import remapping from '@ampproject/remapping'
import type { Plugin } from 'vite'

interface PlatformCssApi {
	defer(id: string): void
	filter(css: string, from?: string): string
	project(css: string, from: string, previousMap?: string): { css: string; map?: string }
}

/** Filter only after Bamboo's validation and restore content-addressed asset names. */
export function platformOutput(): Plugin {
	let compiler: PlatformCssApi | undefined
	let ssr = false
	const adapted = new WeakSet<Plugin>()
	return {
		name: 'xplat-bamboo:platform-output',
		enforce: 'post',
		configResolved(config) {
			ssr = Boolean(config.build.ssr)
			compiler = config.plugins.find((plugin) => plugin.name === 'xplat-platform-css')?.api
			if (config.command === 'build') compiler?.defer('virtual:bamboo.css')
		},
		transform: {
			order: 'pre',
			handler(code, id) {
				if (!id.split('?')[0].endsWith('virtual:bamboo.css') || !code.includes('@platform')) return
				if (!compiler)
					this.error(
						'@octane-xplat/bamboo: platform conditions require xplatCss(target) from @octane-xplat/cli/vite',
					)
				if (ssr || this.environment?.config.build.ssr)
					this.error(
						'@octane-xplat/bamboo: platform conditions currently require a single renderer build; SSR generation is not supported',
					)
			},
		},
		options: {
			order: 'post',
			handler(input) {
				const outputs = (
					input as typeof input & { output?: { plugins?: Plugin[] } | { plugins?: Plugin[] }[] }
				).output
				for (const output of Array.isArray(outputs) ? outputs : outputs ? [outputs] : []) {
					for (const plugin of (output.plugins ?? []).flat(Infinity) as Plugin[]) {
						if (!plugin?.name?.startsWith('bamboocss:output-finalizer:') || adapted.has(plugin))
							continue
						const hook = plugin.generateBundle
						const handler = typeof hook === 'function' ? hook : hook?.handler
						if (!handler)
							throw new Error(
								'@octane-xplat/bamboo: output finalizer has no generateBundle handler',
							)
						plugin.generateBundle = {
							...(typeof hook === 'object' ? hook : {}),
							async handler(options, bundle, isWrite) {
								await handler.call(this, options, bundle, isWrite)
								if (!compiler) return
								const renamed = new Map<string, string>()
								for (const [key, asset] of Object.entries(bundle)) {
									if (asset.type !== 'asset' || !asset.fileName.endsWith('.css')) continue
									const source =
										typeof asset.source === 'string'
											? asset.source
											: new TextDecoder().decode(asset.source)
									const mapKey = `${asset.fileName}.map`
									const mapAsset = bundle[mapKey]
									const previousMap =
										mapAsset?.type === 'asset' ? String(mapAsset.source) : undefined
									if (!source.includes('@platform')) continue
									const projected = compiler.project(source, asset.fileName, previousMap)
									let filtered = projected.css
									if (filtered === source) continue
									const hash = createHash('sha256').update(filtered).digest('hex').slice(0, 16)
									const next = asset.fileName.replace(/\.css$/, `.platform-${hash}.css`)
									renamed.set(asset.fileName, next)
									if (projected.map && previousMap) {
										const nextMap = `${next}.map`
										const map = JSON.parse(projected.map)
										map.file = posix.basename(next)
										this.emitFile({ type: 'asset', fileName: nextMap, source: JSON.stringify(map) })
										delete bundle[mapKey]
										filtered += `
/*# sourceMappingURL=${posix.basename(nextMap)} */`
									}
									this.emitFile({ type: 'asset', fileName: next, source: filtered })
									delete bundle[key]
								}
								for (const file of Object.values(bundle)) {
									const replace = (text: string) => {
										for (const [old, next] of renamed) {
											text = text.split(old).join(next)
											const directory = posix.dirname(file.fileName)
											text = text
												.split(posix.relative(directory, old))
												.join(posix.relative(directory, next))
										}
										return text
									}
									if (file.type === 'chunk') {
										const nextCode = replace(file.code)
										if (nextCode !== file.code) {
											const magic = new MagicString(file.code)
											const replacements = new Map(renamed)
											for (const [old, next] of renamed)
												replacements.set(
													posix.relative(posix.dirname(file.fileName), old),
													posix.relative(posix.dirname(file.fileName), next),
												)
											// Scan the original code once so overlapping full/relative names
											// cannot apply two edits to the same source-map span.
											for (let index = 0; index < file.code.length; index++) {
												const found = [...replacements].find(([old]) =>
													file.code.startsWith(old, index),
												)
												if (!found) continue
												magic.overwrite(index, index + found[0].length, found[1])
												index += found[0].length - 1
											}
											file.code = magic.toString()
											if (file.map) {
												const combined = remapping(
													[
														magic.generateMap({ source: file.fileName, hires: 'boundary' }),
														file.map,
													] as never,
													() => null,
												)
												const encoded = combined.toString()
												file.map = Object.assign(combined, {
													toUrl: () =>
														`data:application/json;charset=utf-8;base64,${Buffer.from(encoded).toString('base64')}`,
												}) as typeof file.map
												const mapFile = bundle[`${file.fileName}.map`]
												if (mapFile?.type === 'asset') mapFile.source = encoded
												if (file.code.includes('//# sourceMappingURL=data:'))
													file.code =
														file.code.replace(
															/\n?\/\/# sourceMappingURL=data:application\/json[^\n]*$/,
															'',
														) +
														`
//# sourceMappingURL=${file.map.toUrl()}`
											}
										}
										const refs = file as typeof file & { referencedFiles?: string[] }
										if (refs.referencedFiles)
											refs.referencedFiles = refs.referencedFiles.map(replace)
										const metadata = (
											file as typeof file & { viteMetadata?: { importedCss?: Set<string> } }
										).viteMetadata
										if (metadata?.importedCss)
											metadata.importedCss = new Set([...metadata.importedCss].map(replace))
									} else if (typeof file.source === 'string') file.source = replace(file.source)
								}
							},
						}
						adapted.add(plugin)
					}
				}
			},
		},
	}
}
