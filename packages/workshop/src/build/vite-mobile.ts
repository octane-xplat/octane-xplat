// @ts-nocheck — .mjs→.ts port: annotations pending (transitional)
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { mobileRegexPlugin } from './mobile-regex.ts'
import { discoverStories } from './discover.ts'

export const MOBILE_CATALOG_ID = '\0xplat-workshop-mobile-catalog'
const fsUrl = (file) => `/@fs/${file.replaceAll('\\', '/')}`

export function mobileCatalogCode(root, config, target) {
	const { entries, diagnostics } = discoverStories(root, { ...config.stories, target })
	const loaders = entries
		.filter((e) => e.applicable && !diagnostics.length)
		.map(
			(e) =>
				`${JSON.stringify(e.id)}: (stamp) => stamp === undefined ? import(${JSON.stringify(fsUrl(e.file))}) : import(/* @vite-ignore */ ${JSON.stringify(fsUrl(e.file))} + '?t=' + encodeURIComponent(stamp))`,
		)
		.join(',\n')

	return `import { catalogDidUpdate } from '@octane-xplat/workshop/mobile'
export const diagnostics = ${JSON.stringify(diagnostics)}
const loaders = {${loaders}}
export const catalog = ${JSON.stringify(entries)}.map(entry => loaders[entry.id] ? {...entry, load: loaders[entry.id]} : entry)
if (import.meta.hot) import.meta.hot.accept(next => catalogDidUpdate(next?.catalog ?? catalog, next?.diagnostics ?? diagnostics))
`
}

/** Apply AFTER resolving the consumer preset, so this pre hook precedes octane(). */
export function withWorkshopMobile(config, options = {}) {
	const target = options.target ?? process.env.XPLAT_WORKSHOP_TARGET
	if (!target) {
		return config
	}

	if (!['ios', 'android'].includes(target)) {
		throw new Error('Workshop mobile target must be ios or android')
	}

	const root = options.cwd ?? process.cwd()
	const workshop = options.config ?? JSON.parse(process.env.XPLAT_WORKSHOP_CONFIG ?? '{}')
	const manifest = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'))
	const main = resolve(root, manifest.main ?? 'src/index.ts')
	const plugin = {
		name: 'xplat-workshop-mobile',
		enforce: 'pre',
		resolveId(id) {
			if (id === MOBILE_CATALOG_ID) {
				return id
			}
		},
		load(id) {
			if (id === MOBILE_CATALOG_ID) {
				return mobileCatalogCode(root, workshop, target)
			}

			// Retain the NativeScript polyfills/dev-session bootstrap; replace
			// only its consumer entry, without touching the production file.
			if (id.split('?')[0] !== main) {
				return
			}

			const presets = workshop.providerModules ?? []
			return `import { startWorkshop } from '@octane-xplat/workshop/mobile'
import { catalog, diagnostics } from ${JSON.stringify(MOBILE_CATALOG_ID)}
import '@octane-xplat/ui/theme/tokens.css'
${presets.map((p, i) => `import * as preset${i} from ${JSON.stringify(fsUrl(resolve(root, p)))}`).join('\n')}
const workshopRuntime = startWorkshop({catalog, diagnostics, target: ${JSON.stringify(target)}, initialStoryId: ${JSON.stringify(options.story ?? process.env.XPLAT_WORKSHOP_STORY ?? null)}, globalProviders: [${presets.map((_, i) => `...(preset${i}.providers ?? preset${i}.default ?? [])`).join(',')}]})
if (import.meta.hot) {
 import.meta.hot.accept()
 import.meta.hot.on('vite:error', error => workshopRuntime.controller.session.markCompileError(error.err?.message ?? error))
 import.meta.hot.on('vite:ws:disconnect', () => workshopRuntime.controller.session.markDisconnected())
 import.meta.hot.on('vite:ws:connect', () => workshopRuntime.controller.session.markConnected())
 import.meta.hot.dispose(() => { void workshopRuntime.dispose().catch(error => console.error('Workshop cleanup requires restart:', error)) })
}
`
		},
		hotUpdate: {
			order: 'pre',
			handler(ctx) {
				// NativeScript's active Vite environment is used directly; no
				// browser-only client assumption. All consumer source edits
				// refresh the selected revision, including dependency edits.
				if (
					!/\.(?:tsrx|tsx|ts|jsx|js|mjs)$/.test(ctx.file) ||
					ctx.file.includes('/node_modules/')
				) {
					return
				}

				const catalog = this.environment.moduleGraph.getModuleById(MOBILE_CATALOG_ID)
				if (!catalog) {
					return
				}

				this.environment.moduleGraph.invalidateModule(catalog)
				return [catalog]
			},
		},
	}

	return { ...config, plugins: [plugin, mobileRegexPlugin(), ...(config.plugins ?? [])] }
}
