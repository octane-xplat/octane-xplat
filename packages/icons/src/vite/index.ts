// Per-icon virtual modules: `import xMark from 'icons:heroicons/x-mark'`
// resolves to that icon's normalized IconifyIcon data — each import is a
// tree-shaking edge and a compile-checked specifier, so apps stop bundling
// whole Iconify JSON collections. Compile-time typing comes from this
// package's `.icon` content mapper plus a generated stub tree (syncIconStubs,
// wired below): the app's tsconfig maps `icons:*` onto the stubs through
// `paths` and registers `.icon` in `contentMappers`.
import { join } from 'node:path'

import { iconSpecifierParts, readIconData, resolveCollectionJson } from './resolve'
import { syncIconStubs, type SyncIconStubsOptions } from './stubs'
import type { Plugin } from 'vite'

const virtual = '\0icons:'

interface VirtualIcon {
  prefix: string
  name: string
  jsonPath: string
}

/** Plugin options. */
export interface XplatIconsOptions {
  /** Self-register every imported icon on module eval — `name=` resolves
   *  the same tree-shaken data for dynamic lookups. Default false: `icon=`
   *  stays registry-free. */
  register?: boolean
  /** Sync the `.icon` type-stub tree (default `<root>/.icons`) at config
   *  time so `tsc --runExternalCode` and editors resolve `icons:*` specifiers per
   *  name through the package's content mapper. Default true; pass an
   *  options object to steer the stub dir or collections, or `false` when
   *  stubs are synced by another step. */
  stubs?: boolean | Omit<SyncIconStubsOptions, 'root'>
}

/**
 * Vite plugin resolving `icons:<prefix>/<name>` imports to per-icon modules
 * that default-export IconifyIcon data (collection dimensions and aliases
 * baked in via getIconData). A missing collection or icon fails the build.
 * Register it before the Octane plugins; per-name typechecking additionally
 * needs the app's tsconfig `paths` + `contentMappers` entries (see
 * package-icons docs).
 */
export function xplatIcons(options: XplatIconsOptions = {}): Plugin {
  let root = ''
  const resolved = new Map<string, VirtualIcon>()

  return {
    name: 'xplat-icons',
    configResolved(config) {
      root = config.root
      if (options.stubs !== false) {
        try {
          syncIconStubs({
            root,
            ...(typeof options.stubs === 'object' ? options.stubs : {}),
          })
        } catch (error) {
          this.warn(
            `xplatIcons: icon type stubs failed to sync — ${error instanceof Error ? error.message : String(error)}`,
          )
        }
      }
    },
    resolveId(source, importer) {
      if (!source.startsWith('icons:')) {
        return null
      }

      const match = iconSpecifierParts(source)
      if (!match) {
        return this.error(
          `Invalid icon specifier "${source}" — expected icons:<prefix>/<name> (kebab-case).`,
        )
      }

      const [prefix, name] = match
      const anchor =
        importer && !importer.startsWith('\0')
          ? importer.split(/[?#]/, 1)[0]
          : join(root, 'package.json')
      const jsonPath = resolveCollectionJson(prefix, anchor)
      if (!jsonPath) {
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
      const icon = readIconData(entry.jsonPath, entry.name)
      if (!icon) {
        return this.error(
          `Icon "${entry.name}" not found in @iconify-json/${entry.prefix} — check the name against its icons.json.`,
        )
      }

      if (!options.register) {
        return `export default ${JSON.stringify(icon)}`
      }

      return [
        `import { addIcon } from '@octane-xplat/icons'`,
        `const icon = ${JSON.stringify(icon)}`,
        `addIcon('${entry.prefix}:${entry.name}', icon)`,
        'export default icon',
      ].join('\n')
    },
  }
}

export { discoverIconifyCollections, syncIconStubs } from './stubs'
export type { SyncIconStubsOptions, SyncIconStubsResult } from './stubs'
