// Per-icon virtual modules: `import xMark from 'icons:heroicons/x-mark'`
// resolves to that icon's normalized IconifyIcon data — each import is a
// tree-shaking edge and a compile-checked specifier, so apps stop bundling
// whole Iconify JSON collections. The ambient `declare module 'icons:*'`
// typings live in this package's icons.d.ts; apps include or reference it.
// TODO(octane-xplat#93): TS 6.1+ content mappers can type `icons:*`
// specifiers natively — the ambient stub then goes away and only this
// runtime-side resolution remains.
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'

import type { IconifyJSON } from '@iconify/types'
import { getIconData } from '@iconify/utils/lib/icon-set/get-icon'
import type { Plugin } from 'vite'

const specifier = /^icons:([a-z0-9]+(?:-[a-z0-9]+)*)\/([a-z0-9]+(?:-[a-z0-9]+)*)$/
const virtual = '\0icons:'

interface VirtualIcon {
	prefix: string
	name: string
	jsonPath: string
}

/**
 * Vite plugin resolving `icons:<prefix>/<name>` imports to per-icon modules
 * that default-export IconifyIcon data (collection dimensions and aliases
 * baked in via getIconData). A missing collection or icon fails the build —
 * that is the compile check. Register it before the Octane plugins and
 * include the package's icons.d.ts in the app's types.
 */
export function xplatIcons(): Plugin {
	let root = process.cwd()
	const resolved = new Map<string, VirtualIcon>()

	return {
		name: 'xplat-icons',
		configResolved(config) {
			root = config.root
		},
		resolveId(source, importer) {
			if (!source.startsWith('icons:')) {
				return null
			}

			const match = specifier.exec(source)
			if (!match) {
				return this.error(
					`Invalid icon specifier "${source}" — expected icons:<prefix>/<name> (kebab-case).`,
				)
			}

			const [, prefix, name] = match
			const anchor =
				importer && !importer.startsWith('\0')
					? importer.split(/[?#]/, 1)[0]
					: join(root, 'package.json')
			let jsonPath: string
			try {
				jsonPath = createRequire(anchor).resolve(`@iconify-json/${prefix}/icons.json`)
			} catch {
				return this.error(
					`Cannot resolve @iconify-json/${prefix} for "${source}" — install the collection package.`,
				)
			}

			// The resolved JSON path keys the virtual id so two installs of the
			// same prefix (nested monorepo deps) cannot collide.
			const id = `${virtual}${jsonPath}:${name}`
			resolved.set(id, { prefix, name, jsonPath })
			return id
		},
		load(id) {
			const entry = resolved.get(id)
			if (!entry) {
				return null
			}

			this.addWatchFile(entry.jsonPath)
			const collection = JSON.parse(readFileSync(entry.jsonPath, 'utf8')) as IconifyJSON
			const icon = getIconData(collection, entry.name)
			if (!icon) {
				return this.error(
					`Icon "${entry.name}" not found in @iconify-json/${entry.prefix} — check the name against its icons.json.`,
				)
			}

			return `export default ${JSON.stringify(icon)}`
		},
	}
}
