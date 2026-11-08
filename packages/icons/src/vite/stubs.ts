// Type-stub generation for `icons:<prefix>/<name>` specifier checking. The
// consumer's tsconfig maps `icons:*` to a stub tree through `paths` and
// registers the `.icon` extension with this package's content mapper (see
// ../mapper). Each stub file marks one resolvable icon name — a specifier with
// no stub fails module resolution, which is the per-name compile check. Stub
// contents are the specifier itself; the mapper re-resolves the collection at
// transform time, so edits to icons.json do not require regenerating data.
// Stubs stay dependency-free and regenerable — safe to gitignore.
import {
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
  type Dirent,
} from 'node:fs'

import { dirname, join, resolve } from 'node:path'

import type { IconifyJSON } from '@iconify/types'

import { resolveCollectionJson } from './resolve'

const identifier = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/** Stub-generation options. */
export interface SyncIconStubsOptions {
  /** Package root the collection walk and default stub dir anchor to — the
   *  app's Vite root. */
  root: string
  /** Stub output directory. Default `<root>/.icons`; must match the app's
   *  `paths` target for `icons:*`. */
  outDir?: string
  /** Collection prefixes to stub. Default: every `@iconify-json/*` package
   *  resolvable from `root` upward, nearest install winning per prefix. */
  collections?: string[]
}

/** Sync outcome. */
export interface SyncIconStubsResult {
  /** Prefixes that were stubbed (collection JSON found). */
  collections: string[]
  /** Stub files created or rewritten. */
  written: number
  /** Stale stub files or prefix directories removed. */
  removed: number
  /** Collection prefixes requested but not resolvable from `root`. */
  missing: string[]
}

/**
 * Discover `@iconify-json/*` packages resolvable from `dir`: walk ancestors
 * and read each `node_modules/@iconify-json` listing (following install
 * symlinks); the nearest `icons.json` wins per prefix, mirroring Node
 * resolution. Returns prefix → absolute icons.json path.
 */
export function discoverIconifyCollections(dir: string): Map<string, string> {
  const found = new Map<string, string>()

  for (let current = resolve(dir); ; current = dirname(current)) {
    const scope = join(current, 'node_modules', '@iconify-json')
    let entries: Dirent[]

    try {
      entries = readdirSync(scope, { withFileTypes: true })
    } catch {
      entries = []
    }

    for (const entry of entries) {
      if (found.has(entry.name) || entry.name.startsWith('.')) {
        continue
      }

      const jsonPath = join(scope, entry.name, 'icons.json')

      try {
        if (statSync(jsonPath).isFile()) {
          found.set(entry.name, jsonPath)
        }
      } catch {
        // Not a collection package — skip.
      }
    }

    if (dirname(current) === current) {
      return found
    }
  }
}

function stubNames(jsonPath: string): Set<string> {
  const collection = JSON.parse(readFileSync(jsonPath, 'utf8')) as IconifyJSON
  const names = new Set<string>()

  for (const name of Object.keys(collection.icons ?? {})) {
    if (identifier.test(name)) {
      names.add(name)
    }
  }

  for (const name of Object.keys(collection.aliases ?? {})) {
    if (identifier.test(name)) {
      names.add(name)
    }
  }

  return names
}

/**
 * Write the `.icon` stub tree for the resolvable collections, pruning files
 * and prefix directories the current collections no longer cover. The output
 * directory is treated as fully managed — keep it out of source includes and
 * gitignore it.
 */
export function syncIconStubs(options: SyncIconStubsOptions): SyncIconStubsResult {
  const outDir = options.outDir ?? join(options.root, '.icons')
  const collections = new Map<string, string>()
  const missing: string[] = []

  if (options.collections) {
    for (const prefix of options.collections) {
      const jsonPath = resolveCollectionJson(prefix, join(options.root, 'package.json'))

      if (jsonPath) {
        collections.set(prefix, jsonPath)
      } else {
        missing.push(prefix)
      }
    }
  } else {
    for (const [prefix, jsonPath] of discoverIconifyCollections(options.root)) {
      collections.set(prefix, jsonPath)
    }
  }

  const expected = new Map<string, Set<string>>()

  for (const [prefix, jsonPath] of collections) {
    if (identifier.test(prefix)) {
      expected.set(prefix, stubNames(jsonPath))
    }
  }

  let removed = 0
  let existing: Dirent[]

  try {
    existing = readdirSync(outDir, { withFileTypes: true })
  } catch {
    existing = []
  }

  for (const entry of existing) {
    const names = expected.get(entry.name)
    const dir = join(outDir, entry.name)

    if (!entry.isDirectory() || !names) {
      rmSync(dir, { recursive: true, force: true })
      removed++
      continue
    }

    for (const file of readdirSync(dir)) {
      if (!file.endsWith('.icon') || !names.has(file.slice(0, -'.icon'.length))) {
        rmSync(join(dir, file), { force: true })
        removed++
      }
    }
  }

  let written = 0

  for (const [prefix, names] of expected) {
    const dir = join(outDir, prefix)

    mkdirSync(dir, { recursive: true })
    for (const name of names) {
      const file = join(dir, `${name}.icon`)
      const content = `icons:${prefix}/${name}\n`
      let current

      try {
        current = readFileSync(file, 'utf8')
      } catch {
        current = undefined
      }

      if (current !== content) {
        writeFileSync(file, content)
        written++
      }
    }
  }

  return { collections: [...expected.keys()], written, removed, missing }
}
