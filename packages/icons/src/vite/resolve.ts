// Iconify collection resolution shared by the Vite plugin, the type-stub
// generator, and the content mapper. Kept dependency-free (node builtins +
// @iconify utils) so every emitted entry can inline it.
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { basename, dirname } from 'node:path'

import type { IconifyIcon, IconifyJSON } from '@iconify/types'
import { getIconData } from '@iconify/utils/lib/icon-set/get-icon'

/** Parse an `icons:<prefix>/<name>` specifier into its parts. */
export function iconSpecifierParts(specifier: string): [string, string] | undefined {
  const match = /^icons:([a-z0-9]+(?:-[a-z0-9]+)*)\/([a-z0-9]+(?:-[a-z0-9]+)*)$/.exec(specifier)

  return match ? [match[1], match[2]] : undefined
}

const identifier = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/** Parse a generated `.icon` stub path (`<stubdir>/<prefix>/<name>.icon`) back
 *  into specifier parts; undefined for paths outside the managed shape. */
export function iconStubParts(fileName: string): [string, string] | undefined {
  const name = basename(fileName)

  if (!name.endsWith('.icon')) {
    return undefined
  }

  const icon = name.slice(0, -'.icon'.length)
  const prefix = basename(dirname(fileName))

  return identifier.test(prefix) && identifier.test(icon) ? [prefix, icon] : undefined
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
