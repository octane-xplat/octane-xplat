// Iconify collection resolution shared by the Vite plugin and the registry
// codegen. Kept dependency-free (node builtins + @iconify utils) so both
// emitted entries can inline it.
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'

import type { IconifyIcon, IconifyJSON } from '@iconify/types'
import { getIconData } from '@iconify/utils/lib/icon-set/get-icon'

/** Parse an `icons:<prefix>/<name>` specifier into its parts. */
export function iconSpecifierParts(specifier: string): [string, string] | undefined {
	const match = /^icons:([a-z0-9]+(?:-[a-z0-9]+)*)\/([a-z0-9]+(?:-[a-z0-9]+)*)$/.exec(specifier)
	return match ? [match[1], match[2]] : undefined
}

/**
 * Resolve `@iconify-json/<prefix>/icons.json` from an anchor path (a source
 * file or the app's package.json) via Node resolution — nested monorepo
 * installs resolve from the importing file's own node_modules chain.
 */
export function resolveCollectionJson(prefix: string, anchor: string): string | undefined {
	try {
		return createRequire(anchor).resolve(`@iconify-json/${prefix}/icons.json`)
	} catch {
		return undefined
	}
}

/** Read one icon's normalized data (collection dimensions and aliases baked
 *  in via getIconData); undefined when the name is absent or dangling. */
export function readIconData(jsonPath: string, name: string): IconifyIcon | undefined {
	const collection = JSON.parse(readFileSync(jsonPath, 'utf8')) as IconifyJSON
	return getIconData(collection, name) ?? undefined
}
