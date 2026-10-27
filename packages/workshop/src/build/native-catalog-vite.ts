// @ts-nocheck — .mjs→.ts port: annotations pending (transitional)
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { discoverStories } from './discover.ts'

/**
 * Regenerates the real catalog module on every (re)build. Static applicability
 * is resolved before any platform leaf enters the bundle — incompatible leaves
 * keep a catalog entry but never a `load` import.
 */
export function nativeCatalogPlugin({ root, config = {}, catalogFile, target = 'macos' }) {
	const generate = (ctx) => {
		const { entries, diagnostics } = discoverStories(root, { ...config.stories, target })
		for (const entry of entries) {
			ctx?.addWatchFile?.(entry.file)
		}

		const providers = (config.providerModules ?? []).map(
			(file, i) => `import * as preset${i} from ${JSON.stringify(resolve(root, file))}`,
		)

		const catalog = entries.map(
			(entry) => `{
			...${JSON.stringify(entry)},
			${entry.applicable ? `load: () => import(${JSON.stringify(entry.file)})` : ''}
		}`,
		)

		const next = `${providers.join('\n')}
export const catalog = [${catalog.join(',\n')}]
export const diagnostics = ${JSON.stringify(diagnostics)}
export const providers = [${(config.providerModules ?? []).map((_, i) => `...(preset${i}.providers ?? preset${i}.default ?? [])`).join(',')}]
`

		// Same-content regeneration must not retrigger the watcher.
		if (!existsSync(catalogFile) || readFileSync(catalogFile, 'utf8') !== next) {
			writeFileSync(catalogFile, next)
		}
	}

	return {
		name: 'xplat-workshop-macos-catalog',
		buildStart() {
			// Runs on every rebuild; story modules stay lazily imported.
			generate.call(this)
		},
	}
}
