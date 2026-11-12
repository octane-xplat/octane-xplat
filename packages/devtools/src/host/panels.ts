// Panel-plugin discovery for the devtools desktop bundle: a package opts in
// with `"octaneXplat": { "devtoolsPanel": "./devtools" }` in its package.json
// (the value names one of its own export subpaths; that module must
// default-export a DevtoolsPanelPlugin). `devtoolsPanels` serves the
// discovered modules as `virtual:octane-devtools-panels` to the desktop app's
// Shell — the generated `xplat devtools` config and the apps/devtools harness
// both install it.
//
// Scan scope is one level: the selected project's dependencies +
// devDependencies, plus octane-xplat's own dependencies when the umbrella is
// installed (resolved from the umbrella's location, so Bun's isolated install
// layout keeps transitive panel packages reachable). Candidates are resolved
// through createRequire from the declaring package and must realpath inside
// the plugin package's root — nothing outside a package's own files may be
// bundled. Malformed or unresolvable candidates are skipped with one stderr
// warning each; a package without the field is simply not a candidate.

import { createRequire } from 'node:module'
import { lstatSync, readFileSync, realpathSync, statSync } from 'node:fs'
import { dirname, join, sep } from 'node:path'
import type { Plugin } from 'vite'

export interface DiscoveredDevtoolsPanel {
  /** The declaring package name. */
  name: string
  /** Realpath'd entry file the virtual module default-imports. */
  file: string
}

const FIELD = 'devtoolsPanel'

function readManifest(file: string): Record<string, unknown> | null {
  try {
    return JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>
  } catch {
    return null
  }
}

/** Locate a dependency's package.json: its exports map first, then a physical
 *  node_modules walk for packages that do not export ./package.json. */
function locatePackage(name: string, requireFrom: NodeRequire, fromDir: string): string | null {
  try {
    return requireFrom.resolve(`${name}/package.json`)
  } catch {
    // Fall through to the physical walk — a package without ./package.json in
    // its exports map still carries the file on disk.
  }

  for (let at = fromDir; ; at = dirname(at)) {
    const candidate = join(at, 'node_modules', name, 'package.json')

    try {
      if (lstatSync(candidate).isFile()) {
        return candidate
      }
    } catch {
      // keep walking
    }

    if (dirname(at) === at) {
      return null
    }
  }
}

function warn(message: string) {
  console.error(`[devtools] ${message}`)
}

export function discoverDevtoolsPanels(projectRoot: string): DiscoveredDevtoolsPanel[] {
  const projectManifest = readManifest(join(projectRoot, 'package.json')) ?? {}
  const names = new Set<string>([
    ...Object.keys((projectManifest.dependencies as Record<string, string>) ?? {}),
    ...Object.keys((projectManifest.devDependencies as Record<string, string>) ?? {}),
  ])

  // Scan sources in stable order: project deps (alphabetical), then the
  // umbrella's dependencies (alphabetical, deduped against project names).
  const sources: { dir: string; names: string[] }[] = [
    { dir: projectRoot, names: [...names].sort() },
  ]

  if (names.has('octane-xplat')) {
    try {
      const requireFrom = createRequire(join(projectRoot, 'package.json'))
      const umbrellaDir = dirname(requireFrom.resolve('octane-xplat/package.json'))
      const umbrella = readManifest(join(umbrellaDir, 'package.json')) ?? {}
      const extra = Object.keys((umbrella.dependencies as Record<string, string>) ?? {})
        .filter((name) => !names.has(name))
        .sort()

      if (extra.length) {
        sources.push({ dir: umbrellaDir, names: extra })
      }
    } catch (error) {
      warn(`skipping octane-xplat dependency scan — ${String(error)}`)
    }
  }

  const out: DiscoveredDevtoolsPanel[] = []

  for (const source of sources) {
    const requireFrom = createRequire(join(source.dir, 'package.json'))

    for (const name of source.names) {
      const manifestPath = locatePackage(name, requireFrom, source.dir)

      if (!manifestPath) {
        continue
      }

      let packageRoot: string
      let manifest: Record<string, unknown> | null

      try {
        packageRoot = realpathSync(dirname(manifestPath))
        manifest = readManifest(join(packageRoot, 'package.json'))
      } catch {
        continue
      }

      const field = (manifest?.octaneXplat as Record<string, unknown> | undefined)?.[FIELD]

      if (field === undefined) {
        continue
      }

      const fail = (why: string) => warn(`skipping devtools panel candidate "${name}" — ${why}`)

      if (typeof field !== 'string' || !field.startsWith('./') || field.includes('..')) {
        fail(`octaneXplat.${FIELD} must be an export subpath like "./devtools"`)
        continue
      }

      let file: string

      try {
        file = realpathSync(requireFrom.resolve(`${name}/${field.slice(2)}`))
      } catch (error) {
        fail(`cannot resolve ${name}/${field.slice(2)} — ${String(error)}`)
        continue
      }

      try {
        if (!file.startsWith(packageRoot + sep) || !statSync(file).isFile()) {
          fail(`resolved panel module escapes its package root — ${file}`)
          continue
        }
      } catch {
        fail(`resolved panel module is not a file — ${file}`)
        continue
      }

      out.push({ name, file })
    }
  }

  return out
}

export const DEVTOOLS_PANELS_VIRTUAL_ID = 'virtual:octane-devtools-panels'

const RESOLVED_ID = '\0' + DEVTOOLS_PANELS_VIRTUAL_ID

/** Vite plugin serving `virtual:octane-devtools-panels`: a default-exported
 *  array of the discovered panel plugins (`[]` when none). */
export function devtoolsPanels(options: { root: string }): Plugin {
  return {
    name: 'octane-devtools-panels',
    resolveId(id) {
      return id === DEVTOOLS_PANELS_VIRTUAL_ID ? RESOLVED_ID : null
    },
    load(id) {
      if (id !== RESOLVED_ID) {
        return null
      }

      const panels = discoverDevtoolsPanels(options.root)
      const imports = panels
        .map((panel, i) => `import p${i} from ${JSON.stringify(panel.file)}`)
        .join('\n')

      return `${imports}\nexport default [${panels.map((_, i) => `p${i}`).join(', ')}]`
    },
  }
}
