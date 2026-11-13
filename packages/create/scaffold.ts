// Scaffold manifest + compose/apply shared by create-octane-xplat and the
// CLI's `xplat add`. compatibility.json owns version pins; the generated
// templates own script bodies and the dependency set for each starter.
import {
  cpSync,
  lstatSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs'

import { basename, dirname, join, resolve, relative, isAbsolute, sep } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import { isMap, parseDocument, stringify } from 'yaml'
import {
  compatibility,
  mergeCompatibilityCatalog,
  compatibilityRoot,
  requestedCatalogPins,
} from './compatibility.ts'

import type { PackageManager } from './package-manager.ts'

export type { PackageManager } from './package-manager.ts'

const moduleDir = dirname(fileURLToPath(import.meta.url))
// dist/ emit sits one level deeper than the root sources it mirrors.
const pkgRoot = basename(moduleDir) === 'dist' ? join(moduleDir, '..') : moduleDir

export const TEMPLATE_DIR = join(pkgRoot, 'template')
export const LIBRARY_TEMPLATE_DIR = join(pkgRoot, 'library-template')

const CANONICAL_PATCHES = join(pkgRoot, '../cli/patches')
const SYNC_PATCHES = join(pkgRoot, '../../scripts/sync-patches.ts')

// template*/patches copies are generated (gitignored) from the canonical set
// in packages/cli/patches. Packed tarballs ship them; in-repo consumers on a
// fresh checkout materialize them here before the template tree is read.
function ensureTemplatePatches() {
  if (
    (existsSync(join(TEMPLATE_DIR, 'patches')) &&
      existsSync(join(LIBRARY_TEMPLATE_DIR, 'patches'))) ||
    !existsSync(CANONICAL_PATCHES) ||
    !existsSync(SYNC_PATCHES)
  ) {
    return
  }

  const result = spawnSync(process.execPath, [SYNC_PATCHES, '--templates'], { stdio: 'inherit' })

  if (result.status !== 0) {
    throw new Error('sync-patches --templates failed — run `bun run sync:patches`')
  }
}

/** Scaffoldable targets. `files` entries are template-relative paths —
 *  directories copy recursively. `deps`/`devDeps`/`scripts` name keys whose
 *  values come from template/package.json. `typecheck` contributes one clause
 *  to the generated typecheck script. */
export const targets: Record<string, any> = {
  web: {
    label: 'Web (Vite)',
    files: [
      'index.html',
      'vite.config.ts',
      'src/main.web.tsrx',
      'vitest.web.config.mts',
      'src/app.web.test.tsx',
      'src/test-setup.web.ts',
    ],
    scripts: ['dev', 'build', 'test', 'test:web', 'workshop'],
    devDeps: ['@octanejs/vite-plugin', 'jsdom', '@octane-xplat/workshop'],
  },
  ios: {
    label: 'iOS (NativeScript)',
    requires: ['native-shared'],
    files: ['App_Resources/iOS'],
    scripts: ['dev:ios', 'build:ios', 'test:ios'],
    devDeps: ['@nativescript/ios'],
    note: 'needs macOS + Xcode — `bun run xplat doctor` checks the toolchain',
  },
  android: {
    label: 'Android (NativeScript)',
    requires: ['native-shared'],
    files: ['App_Resources/Android'],
    scripts: ['dev:android', 'build:android', 'test:android'],
    devDeps: ['@nativescript/android'],
    note: 'needs Android SDK + a compatible JDK — `bun run xplat doctor` checks the toolchain',
  },
  // Shared NativeScript machinery pulled in by ios/android. Not user-
  // selectable on its own. `patches` names the packages whose
  // patchedDependencies entries in package.json belong to this
  // fragment — Bun hard-fails installs on unused patch entries, so a
  // scaffold must not carry patches for deps it doesn't install.
  'native-shared': {
    hidden: true,
    // Build-script approvals claimed by this target — the scaffolded
    // allowBuilds entry for `nativescript` only exists once native-shared
    // resolves (web-only trees never install it).
    builds: ['nativescript'],
    patches: [
      '@nativescript/core',
      '@nativescript/types',
      'css',
      '@nativescript/vite',
    ],
    files: [
      'nativescript.config.ts',
      'vite.config.native.mts',
      'references.d.ts',
      'src/main.ts',
      'vitest.config.mts',
      'src/test.ts',
      'src/app.spec.tsrx',
      'src/native-runtime.spec.ts',
      'src/failure-reporting.spec.ts',
    ],
    deps: [
      '@octane-xplat/nativescript-octane',
      '@nativescript/core',
      '@valor/nativescript-websockets',
    ],
    devDeps: [
      '@octane-xplat/workshop',
      '@octane-xplat/vite-octane',
      '@nativescript/types',
      '@nativescript/unit-test-runner',
      '@nativescript/vite',
      'nativescript',
      // The classic-API checker path used by the native Vite plugin.
      'typescript-classic',
    ],
    typecheck: 'xplat typecheck',
  },
}

export const selectableTargets = Object.keys(targets).filter((id) => !targets[id].hidden)

/** `bun create` without --targets and `xplat add`'s prompt default. */
export const defaultTargets = ['web', 'ios', 'android']

const BASE_TYPECHECK = 'xplat typecheck'

// package.json keys every scaffolded app keeps regardless of target set —
// the targets' `scripts` lists own the rest.
const BASE_SCRIPTS = ['xplat', 'lint', 'lint:fix', 'format']

/** Expand `requires` edges, dependencies first. Throws on unknown ids. */
export function resolveTargets(ids) {
  const resolved: string[] = []
  const visit = (id) => {
    const t = targets[id]

    if (!t) {
      throw new Error(`unknown target "${id}" — expected one of: ${selectableTargets.join(', ')}`)
    }

    for (const req of t.requires ?? []) {
      visit(req)
    }

    if (!resolved.includes(id)) {
      resolved.push(id)
    }
  }

  for (const id of ids) {
    visit(id)
  }

  return resolved
}

const templateManifest = () => JSON.parse(readFileSync(join(TEMPLATE_DIR, 'package.json'), 'utf8'))

/** Which target claims a template-relative path (entries may be dirs). */
function ownerOf(path) {
  for (const [id, t] of Object.entries(targets)) {
    for (const entry of t.files) {
      if (path === entry || path.startsWith(entry + '/')) {
        return id
      }
    }
  }

  return null
}

function walk(dir, prefix = '') {
  const out: string[] = []

  for (const name of readdirSync(dir)) {
    if (name === 'node_modules') {
      continue
    }

    const rel = prefix ? `${prefix}/${name}` : name

    if (statSync(join(dir, name)).isDirectory()) {
      out.push(...walk(join(dir, name), rel))
    } else {
      out.push(rel)
    }
  }

  return out
}

function pickKeys(source, names, label) {
  const out: Record<string, string> = {}

  for (const name of names) {
    if (source[name] === undefined) {
      throw new Error(`template/package.json has no ${label} entry "${name}"`)
    }

    out[name] = source[name]
  }

  return out
}

/**
 * The package.json a given target set produces. With every target selected
 * this is identical to template/package.json. For pnpm the Bun-config homes
 * move to pnpm-workspace.yaml — composePnpmWorkspace emits the other half.
 */
export function composeManifest(ids: string[], packageManager: PackageManager = 'bun') {
  const resolved = resolveTargets(ids)
  const tpl = templateManifest()
  const manifest: Record<string, any> = { ...tpl }

  for (const section of ['dependencies', 'devDependencies']) {
    const key = section === 'dependencies' ? 'deps' : 'devDeps'
    const wanted = new Set<string>()

    for (const id of resolved) {
      for (const name of targets[id][key] ?? []) {
        wanted.add(name)
      }
    }

    const next = {}

    for (const [name, spec] of Object.entries(tpl[section] ?? {})) {
      // Unclaimed entries are base; claimed entries follow their target.
      const claimed = Object.keys(targets).some((id) => (targets[id][key] ?? []).includes(name))

      if (!claimed || wanted.has(name)) {
        next[name] = spec
      }
    }

    manifest[section] = next
  }

  const wantedScripts = new Set(BASE_SCRIPTS)

  for (const id of resolved) {
    for (const name of targets[id].scripts ?? []) {
      wantedScripts.add(name)
    }
  }

  const scripts = pickKeys(tpl.scripts ?? {}, [...wantedScripts].sort(), 'script')
  const typecheck: string[] = [BASE_TYPECHECK]

  for (const id of resolved) {
    if (targets[id].typecheck) {
      typecheck.push(targets[id].typecheck)
    }
  }

  scripts.typecheck = [...new Set(typecheck)].join(' && ')
  // Keep the template's key order: scripts sit where they were.
  manifest.scripts = {}
  for (const name of Object.keys(tpl.scripts ?? {})) {
    if (name === 'typecheck' || wantedScripts.has(name)) {
      manifest.scripts[name] = scripts[name]
    }
  }

  if (!resolved.includes('native-shared')) {
    // "main" points at the native entry — meaningless without it.
    delete manifest.main
  }

  const drop = new Set(
    Object.entries(targets)
      .filter(([id]) => !resolved.includes(id))
      .flatMap(([, target]) => target.patches ?? []),
  )

  manifest.patchedDependencies = Object.fromEntries(
    Object.entries(tpl.patchedDependencies).filter(
      ([key]) => !drop.has(key.slice(0, key.indexOf('@', 1))),
    ),
  )

  const used = new Set([
    ...Object.keys(manifest.dependencies),
    ...Object.keys(manifest.devDependencies),
  ])

  manifest.workspaces = {
    ...tpl.workspaces,
    catalogs: {
      ...tpl.workspaces.catalogs,
      xplat: Object.fromEntries(
        Object.entries(tpl.workspaces.catalogs.xplat).filter(([name]) => used.has(name)),
      ),
    },
  }

  if (packageManager === 'bun') {
    return manifest
  }

  return splitForPnpm(manifest, new Set(resolved)).manifest
}

// pnpm 11 fails an install when a dependency's build scripts are neither
// approved nor denied in allowBuilds, where Bun silently skips untrusted
// ones. These are the packages real pnpm installs reported that are not
// trusted — `target` scopes an entry to the target set whose dependency
// tree contains it. Approved entries are not listed here: they come from
// the manifest's trustedDependencies filtered by target `builds` claims.
const deniedBuilds: { name: string; target?: string }[] = [
  // @octane-xplat/nativescript-mason-core pulls @nativescript/core into even
  // the web-only tree; its build scripts are not trusted.
  { name: '@nativescript/core' },
  // onnxruntime-web (via @octane-xplat/docs-search) pulls protobufjs into the
  // tree; its postinstall is a no-op and must not run.
  { name: 'protobufjs' },
]

/**
 * The allowBuilds map for a resolved target set: trusted dependencies (with
 * target claims applied) approve, everything pnpm reported denies.
 */
function allowBuildsFor(manifest, resolved: Set<string>) {
  const wanted = new Set<string>()

  for (const id of resolved) {
    for (const name of targets[id].builds ?? []) {
      wanted.add(name)
    }
  }

  const builds: Record<string, boolean> = {}

  for (const name of manifest.trustedDependencies ?? []) {
    const claimed = Object.values(targets).some((target) => (target.builds ?? []).includes(name))

    if (!claimed || wanted.has(name)) {
      builds[name] = true
    }
  }

  for (const entry of deniedBuilds) {
    if (!entry.target || resolved.has(entry.target)) {
      builds[entry.name] = false
    }
  }

  return Object.fromEntries(
    Object.keys(builds)
      .sort()
      .map((name) => [name, builds[name]]),
  )
}

/**
 * Move Bun's config homes — catalogs, overrides, patches, trusted
 * dependencies, the bun engine — out of the composed manifest into the
 * pnpm-workspace.yaml object. Both manager variants come from the same
 * composed manifest so pins can never disagree.
 */
function splitForPnpm(manifest, resolved: Set<string>) {
  const next = { ...manifest }
  const workspace: Record<string, any> = {}

  workspace.packages = next.workspaces?.packages ?? []
  if (next.workspaces?.catalogs) {
    workspace.catalogs = next.workspaces.catalogs
  }

  delete next.workspaces
  if (next.overrides) {
    workspace.overrides = next.overrides
    delete next.overrides
  }

  if (next.patchedDependencies) {
    workspace.patchedDependencies = next.patchedDependencies
    delete next.patchedDependencies
  }

  // Matches what `xplat upgrade` writes; shipped patch files may sit unused
  // for a target set (tiptap, doctor, sqlite-bridge are always copied).
  workspace.allowUnusedPatches = true
  workspace.allowBuilds = allowBuildsFor(next, resolved)
  delete next.trustedDependencies
  // NativeScript resolves plugins from a flat tree — same reason bunfig sets
  // the hoisted linker for Bun.
  workspace.nodeLinker = 'hoisted'
  workspace.saveExact = true
  if (next.engines) {
    delete next.engines.bun
    if (Object.keys(next.engines).length === 0) {
      delete next.engines
    }
  }

  next.packageManager = `pnpm@${compatibility.tools.pnpm}`
  return { manifest: next, workspace }
}

/** The pnpm-workspace.yaml a given target set produces. */
export function composePnpmWorkspace(ids: string[]): string {
  const resolved = resolveTargets(ids)
  const { workspace } = splitForPnpm(composeManifest(resolved), new Set(resolved))

  return stringify(workspace)
}

/** Patch [specifier, path] entries the enabled targets need and `present` lacks. */
function neededPatchEntries(enabledIds, present: Set<string>): [string, string][] {
  const needed = new Set(enabledIds.flatMap((id) => targets[id].patches ?? []))
  const out: [string, string][] = []

  for (const [specifier, path] of Object.entries(templateManifest().patchedDependencies) as [
    string,
    string,
  ][]) {
    const name = specifier.slice(0, specifier.indexOf('@', 1))

    if (!needed.has(name) || present.has(name)) {
      continue
    }

    out.push([specifier, path])
  }

  return out
}

/** Copy a canonical patch into the root patches/ dir unless it already matches. */
function stagePatchFile(root, path, read, write) {
  ensureTemplatePatches()

  const source = join(TEMPLATE_DIR, path)
  const destination = join(root, path)
  const before = read(destination)

  if (before !== null && !readFileSync(source).equals(before)) {
    throw new Error(
      `Custom patch ${destination} differs from the framework patch; reconcile it first`,
    )
  }

  write(destination, readFileSync(source), statSync(source).mode & 0o777)
}

const specifierName = (specifier: string) => specifier.slice(0, specifier.indexOf('@', 1))

/** Add target-owned local patches before installing newly enabled dependencies. */
function ensurePatchEntries(enabledIds, root, pkg, read, write) {
  const present = new Set(Object.keys(pkg.patchedDependencies ?? {}).map(specifierName))

  pkg.patchedDependencies ??= {}

  let changed = false

  for (const [specifier, path] of neededPatchEntries(enabledIds, present)) {
    stagePatchFile(root, path, read, write)
    pkg.patchedDependencies[specifier] = path
    changed = true
  }

  return changed
}

/** The selected manager at a workspace root — mirrors the CLI's detection. */
function managerForRoot(root: string, pkg) {
  const declared = pkg?.packageManager?.split('@')[0]

  if (declared !== undefined) {
    if (declared === 'bun' || declared === 'pnpm') {
      return declared
    }

    throw new Error(`Xplat supports Bun and pnpm projects; found packageManager ${declared}.`)
  }

  const bun = existsSync(join(root, 'bun.lock')) || existsSync(join(root, 'bun.lockb'))
  const pnpm = existsSync(join(root, 'pnpm-lock.yaml'))

  if (bun && pnpm) {
    throw new Error(
      'Both Bun and pnpm lockfiles exist. Set packageManager in package.json or pass --package-manager.',
    )
  }

  if (bun) {
    return 'bun'
  }

  if (pnpm) {
    return 'pnpm'
  }

  if (pkg?.patchedDependencies) {
    return 'bun'
  }

  return existsSync(join(root, 'pnpm-workspace.yaml')) ? 'pnpm' : 'bun'
}

/**
 * Native tsconfig `paths` pinning `@nativescript/core` to the app's own
 * install. Without it, a `link:`/`file:`/`portal:` framework checkout's core
 * imports resolve to that checkout's own copy and checkers see two distinct
 * `View`/`Page`/`Color` type identities (private-member conflicts, issue #66).
 */
export const nativeCorePaths = {
  '@nativescript/core': ['./node_modules/@nativescript/core'],
  '@nativescript/core/*': ['./node_modules/@nativescript/core/*'],
}

/**
 * The tsconfig.json a given target set produces. One program covers every
 * platform suffix (moduleSuffixes is the fixed precedence order); a web-only
 * scaffold just drops the native ambient root and entrypoint.
 */
export function composeTsconfig(ids) {
  const resolved = new Set(resolveTargets(ids))
  const config = JSON.parse(readFileSync(join(TEMPLATE_DIR, 'tsconfig.json'), 'utf8'))

  if (!resolved.has('native-shared')) {
    delete config.files
    delete config.compilerOptions.paths
    config.compilerOptions.types = (config.compilerOptions.types ?? []).filter(
      (t) => t !== '@nativescript/types',
    )

    config.exclude = [...new Set([...(config.exclude ?? []), 'src/main.ts'])]
  }

  return JSON.stringify(config, null, '\t') + '\n'
}

/**
 * Starter text files whose command forms follow the chosen package manager.
 * Nothing under patches/ is ever transformed — patch bytes must equal the
 * canonical copies.
 */
const managerTextFiles = [
  'AGENTS.md',
  'README.md',
  'nativescript.config.ts',
  'vitest.config.mts',
  'src/app.spec.tsrx',
]

const isManagerTextFile = (rel: string) =>
  managerTextFiles.includes(rel) || rel.startsWith('.agents/skills/xplat/')

// Template file names that differ from their scaffolded names: dotfiles and
// bunfig ship without their final names because npm/bun packing drops them.
const renamedFiles: Record<string, string> = {
  gitignore: '.gitignore',
  bunfig: 'bunfig.toml',
}

const destName = (rel: string) => renamedFiles[rel] ?? rel

/**
 * Rewrite the canonical Bun command forms in starter text for another
 * manager. Applied only to managerTextFiles.
 */
export function localizeCommands(text: string, manager: PackageManager): string {
  if (manager === 'bun') {
    return text
  }

  return (
    text
      // `bun run script -- args`: pnpm forwards a literal `--`, bun strips it.
      .replace(/\bbun run (\S+) -- /g, 'pnpm run $1 ')
      .replace(/\bbunx\b/g, 'pnpm dlx')
      .replace(/\bbun pm pack\b/g, 'pnpm pack')
      .replace(/\bbun run\b/g, 'pnpm run')
      .replace(/\bbun add\b/g, 'pnpm add')
      .replace(/\bbun install\b/g, 'pnpm install')
      .replace(/packageManager: 'bun'/g, "packageManager: 'pnpm'")
  )
}

/** Write a scaffold with tests for `ids` into `dir` (must not exist or be empty). */
export function composeTargets(ids, dir, options?: { packageManager?: PackageManager }) {
  const packageManager = options?.packageManager ?? 'bun'
  const resolved = new Set(resolveTargets(ids))

  ensureTemplatePatches()
  mkdirSync(dir, { recursive: true })

  for (const rel of walk(TEMPLATE_DIR)) {
    if (rel === 'package.json' || rel === 'tsconfig.json') {
      continue // generated below
    }

    if (packageManager === 'pnpm' && rel === 'bunfig') {
      continue
    }

    const owner = ownerOf(rel)

    if (owner && !resolved.has(owner)) {
      continue
    }

    const source = join(TEMPLATE_DIR, rel)
    const dest = join(dir, destName(rel))

    mkdirSync(dirname(dest), { recursive: true })
    if (packageManager === 'pnpm' && isManagerTextFile(rel)) {
      writeFileSync(dest, localizeCommands(readFileSync(source, 'utf8'), packageManager))
    } else {
      cpSync(source, dest, { recursive: true })
    }
  }

  writeFileSync(
    join(dir, 'package.json'),
    JSON.stringify(composeManifest(ids, packageManager), null, '\t') + '\n',
  )

  writeFileSync(join(dir, 'tsconfig.json'), composeTsconfig(ids))
  if (packageManager === 'pnpm') {
    writeFileSync(join(dir, 'pnpm-workspace.yaml'), composePnpmWorkspace(ids))
  }

  return [...resolved]
}

/** Write the cross-platform library starter into `dir`. */
export function composeLibrary(
  dir,
  packageName = basename(resolve(dir)),
  options?: { packageManager?: PackageManager },
) {
  if (
    packageName.length > 214 ||
    !/^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/.test(packageName)
  ) {
    throw new Error(
      `invalid npm package name "${packageName}" — use lowercase letters, numbers, dots, underscores, or hyphens`,
    )
  }

  const packageManager = options?.packageManager ?? 'bun'

  ensureTemplatePatches()
  mkdirSync(dir, { recursive: true })
  for (const rel of walk(LIBRARY_TEMPLATE_DIR)) {
    if (rel === 'package.json' || (packageManager === 'pnpm' && rel === 'bunfig')) {
      continue
    }

    const dest = join(dir, destName(rel))

    mkdirSync(dirname(dest), { recursive: true })

    const source = join(LIBRARY_TEMPLATE_DIR, rel)

    if (/\.(?:md|ts|tsx|mjs|json)$/.test(rel)) {
      let content = readFileSync(source, 'utf8').replaceAll('octane-xplat-library', packageName)

      if (packageManager === 'pnpm' && isManagerTextFile(rel)) {
        content = localizeCommands(content, packageManager)
      }

      writeFileSync(dest, content)
    } else {
      cpSync(source, dest, { recursive: true })
    }
  }

  const manifest = JSON.parse(readFileSync(join(LIBRARY_TEMPLATE_DIR, 'package.json'), 'utf8'))

  manifest.name = packageName
  if (packageManager === 'pnpm') {
    for (const [name, script] of Object.entries(manifest.scripts ?? {})) {
      manifest.scripts[name] = localizeCommands(String(script), packageManager)
    }

    // The library exercises web and native builds — its dependency tree spans
    // the native toolchain, so target claims resolve as native-shared.
    const { manifest: split, workspace } = splitForPnpm(manifest, new Set(['native-shared']))

    writeFileSync(join(dir, 'package.json'), JSON.stringify(split, null, '\t') + '\n')
    writeFileSync(join(dir, 'pnpm-workspace.yaml'), stringify(workspace))
    return
  }

  writeFileSync(join(dir, 'package.json'), JSON.stringify(manifest, null, '\t') + '\n')
}

const readJson = (file) => {
  try {
    return JSON.parse(readFileSync(file, 'utf8'))
  } catch {
    return null
  }
}

/** Sentinel-based enablement check, mirroring the CLI's targets.mjs. */
export function targetEnabled(appRoot, id) {
  if (id === 'web') {
    return (
      existsSync(join(appRoot, 'vite.config.ts')) || existsSync(join(appRoot, 'vite.config.mts'))
    )
  }

  if (id === 'native-shared') {
    return existsSync(join(appRoot, 'nativescript.config.ts'))
  }

  // ios/android: declared runtime devDep is the canonical signal — App_Resources
  // alone doesn't reach the bundler config.
  const manifest: Record<string, any> = readJson(join(appRoot, 'package.json')) ?? {}
  const declared = { ...manifest.dependencies, ...manifest.devDependencies }
  const runtime = { ios: '@nativescript/ios', android: '@nativescript/android' }[id]

  return runtime ? typeof declared[runtime] === 'string' : false
}

/** Copy a template file/dir into the app unless the destination exists. */
function copyMissing(rel, appRoot, report, present, copy) {
  const src = join(TEMPLATE_DIR, rel)
  const dest = join(appRoot, destName(rel))

  if (present(dest)) {
    report.skipped.push(rel)
    return
  }

  copy(src, dest)
  report.copied.push(rel)
}

/**
 * Fold a native-capable app's sources into the one tsconfig program: the
 * manifest (tsconfig.envs.json) is gone — one program covers every platform
 * suffix — so enabling native means wiring the ambient declaration file and
 * the entrypoint into the app's own config.
 */
function enableNativeInTsconfig(appRoot, read, write) {
  const path = join(appRoot, 'tsconfig.json')
  const text = read(path)?.toString('utf8') ?? ''
  let config

  try {
    config = JSON.parse(text)
  } catch {
    return false
  }

  if (!config || typeof config !== 'object') {
    return false
  }

  const indent = text.match(/\n(\s+)"/)?.[1] ?? '\t'

  config.files = [...new Set(['references.d.ts', ...(config.files ?? [])])]
  config.exclude = (config.exclude ?? []).filter((e) => e !== 'src/main.ts')

  const types = config.compilerOptions?.types

  if (config.compilerOptions && Array.isArray(types) && !types.includes('@nativescript/types')) {
    config.compilerOptions.types = [...types, '@nativescript/types']
  }

  // Pin core's type identity for linked checkouts; user-authored paths and
  // an existing core mapping always win.
  if (config.compilerOptions && typeof config.compilerOptions === 'object') {
    const paths = (config.compilerOptions.paths ??= {})

    for (const [key, value] of Object.entries(nativeCorePaths)) {
      if (!(key in paths)) {
        paths[key] = value
      }
    }
  }

  write(path, Buffer.from(JSON.stringify(config, null, indent) + '\n'), 0o644)
  return true
}

/**
 * Plan enabling `id` and unmet requirements without writing. Existing target
 * files, scripts and dependency choices stay intact; managed config and catalog
 * changes carry raw-byte input hashes for the publisher.
 */
export function planTarget(appRoot, id) {
  appRoot = resolve(appRoot)

  const root = compatibilityRoot(appRoot)
  const inputs = new Map<string, any>()
  const contents = new Map<string, Buffer>()
  const files = new Map<string, any>()
  const directories = new Map<string, number>()
  const hash = (bytes) => createHash('sha256').update(bytes).digest('hex')
  const within = (path) => {
    const rel = relative(root, path)

    return rel === '' || (rel !== '..' && !rel.startsWith('..' + sep) && !isAbsolute(rel))
  }

  const observe = (path) => {
    path = resolve(path)
    if (!within(path)) {
      throw new Error(`Scaffold path leaves its workspace: ${path}`)
    }

    if (inputs.has(path)) {
      return inputs.get(path)
    }

    let info

    try {
      info = lstatSync(path)
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error
      }

      const input = { path, kind: 'missing' }

      inputs.set(path, input)
      return input
    }

    if (info.isSymbolicLink() || (!info.isDirectory() && !info.isFile())) {
      throw new Error(`Scaffold path must be an ordinary file or directory: ${path}`)
    }

    const input: Record<string, any> = {
      path,
      kind: info.isDirectory() ? 'directory' : 'file',
      mode: info.mode & 0o777,
    }

    if (input.kind === 'file') {
      if (info.size > 16 * 1024 * 1024) {
        throw new Error(`Scaffold input exceeds 16 MiB: ${path}`)
      }

      const bytes = readFileSync(path)

      input.sha256 = hash(bytes)
      contents.set(path, bytes)
    }

    inputs.set(path, input)
    return input
  }

  const read = (path) => {
    const input = observe(path)

    if (input.kind === 'missing') {
      return null
    }

    if (input.kind !== 'file') {
      throw new Error(`Expected scaffold file: ${path}`)
    }

    return contents.get(resolve(path))!
  }

  const directory = (path, mode = 0o755) => {
    if (path === root || path === appRoot) {
      return
    }

    const input = observe(path)

    if (input.kind === 'directory') {
      return
    }

    if (input.kind !== 'missing') {
      throw new Error(`Expected scaffold directory: ${path}`)
    }

    directory(dirname(path))
    directories.set(path, mode)
  }

  const write = (path, bytes, mode) => {
    const before = read(path)

    if (before !== null && before.equals(bytes)) {
      return
    }

    directory(dirname(path))
    files.set(path, {
      path,
      before: before === null ? null : hash(before),
      content: bytes.toString('base64'),
      mode: before === null ? mode : observe(path).mode,
    })
  }

  const copy = (source, dest) => {
    const info = lstatSync(source)

    if (info.isDirectory()) {
      directory(dest, info.mode & 0o777)
      for (const name of readdirSync(source).sort()) {
        copy(join(source, name), join(dest, name))
      }
    } else if (info.isFile()) {
      write(dest, readFileSync(source), info.mode & 0o777)
    } else {
      throw new Error(`Scaffold template must not contain aliases: ${source}`)
    }
  }

  const manifestPath = join(appRoot, 'package.json')
  const raw = read(manifestPath)?.toString('utf8')

  if (raw === undefined) {
    throw new Error(`No package.json at ${appRoot}`)
  }

  const manifest: Record<string, any> = JSON.parse(raw)
  const tpl = templateManifest()
  const report: Record<string, any> = {
    enabled: [],
    already: [],
    copied: [],
    skipped: [],
    scriptsAdded: [],
    scriptsSkipped: [],
    depsAdded: [],
  }

  for (const tid of resolveTargets([id])) {
    const declared = { ...manifest.dependencies, ...manifest.devDependencies }
    const runtime = { ios: '@nativescript/ios', android: '@nativescript/android' }[tid]
    const enabled =
      tid === 'web'
        ? observe(join(appRoot, 'vite.config.ts')).kind !== 'missing' ||
          observe(join(appRoot, 'vite.config.mts')).kind !== 'missing'
        : tid === 'native-shared'
          ? observe(join(appRoot, 'nativescript.config.ts')).kind !== 'missing'
          : runtime !== undefined && typeof declared[runtime] === 'string'

    if (enabled) {
      report.already.push(tid)
      continue
    }

    report.enabled.push(tid)

    const t = targets[tid]

    for (const rel of t.files) {
      copyMissing(rel, appRoot, report, (path) => observe(path).kind !== 'missing', copy)
    }

    for (const [section, key] of [
      ['dependencies', 'deps'],
      ['devDependencies', 'devDeps'],
    ]) {
      for (const name of t[key] ?? []) {
        manifest[section] ??= {}
        if (manifest[section][name] === undefined) {
          manifest[section][name] = tpl[section][name]
          report.depsAdded.push(name)
        }
      }
    }

    manifest.scripts ??= {}
    for (const name of t.scripts ?? []) {
      if (manifest.scripts[name] === undefined) {
        manifest.scripts[name] = tpl.scripts[name]
        report.scriptsAdded.push(name)
      } else if (manifest.scripts[name] !== tpl.scripts[name]) {
        report.scriptsSkipped.push(name)
      }
    }

    if (t.typecheck) {
      const current = manifest.scripts.typecheck ?? ''

      if (!current.includes(t.typecheck)) {
        manifest.scripts.typecheck = current ? `${current} && ${t.typecheck}` : t.typecheck
        report.scriptsAdded.push('typecheck')
      }
    }

    if (tid === 'native-shared') {
      if (manifest.main === undefined) {
        manifest.main = tpl.main
      }

      // Native sources join the app's single typecheck program — pull the
      // ambient declaration entry into the roots and un-exclude the
      // NativeScript entry that a web-only scaffold skips.
      report.tsconfigUpdated = enableNativeInTsconfig(appRoot, read, write)
    }
  }

  // Newly enabled targets may carry patch entries the scaffolded
  // package.json never had — without them the next install misses the
  // framework patches. enabled+already covers the yaml-missing case, where
  // the file is regenerated for the whole enabled set.
  const enabledTargets = [...report.enabled, ...report.already]
  const manager = managerForRoot(
    root,
    root === appRoot
      ? manifest
      : JSON.parse(read(join(root, 'package.json'))?.toString('utf8') ?? 'null'),
  )

  if (manager === 'pnpm') {
    const yamlPath = join(root, 'pnpm-workspace.yaml')
    const doc = parseDocument(read(yamlPath)?.toString('utf8') ?? 'packages: []\n')
    const { catalog, pins } = requestedCatalogPins(manifest)

    for (const [name, spec] of Object.entries(pins)) {
      if (doc.getIn(['catalogs', catalog, name]) === undefined) {
        doc.setIn(['catalogs', catalog, name], spec)
      }
    }

    const existing = doc.get('patchedDependencies')
    const present = new Set<string>(
      (isMap(existing) ? existing.items : []).map((pair) => specifierName(String(pair.key))),
    )

    const patches = neededPatchEntries(enabledTargets, present)

    for (const [specifier, path] of patches) {
      stagePatchFile(root, path, read, write)
      doc.setIn(['patchedDependencies', specifier], path)
    }

    if (patches.length) {
      report.patchesAdded = true
    }

    const resolved = new Set(resolveTargets(enabledTargets))

    for (const id of resolved) {
      for (const name of targets[id].builds ?? []) {
        if (doc.getIn(['allowBuilds', name]) === undefined) {
          doc.setIn(['allowBuilds', name], true)
          report.allowBuildsAdded = true
        }
      }
    }

    for (const entry of deniedBuilds) {
      if (
        (!entry.target || resolved.has(entry.target)) &&
        doc.getIn(['allowBuilds', entry.name]) === undefined
      ) {
        doc.setIn(['allowBuilds', entry.name], false)
        report.allowBuildsAdded = true
      }
    }

    write(yamlPath, Buffer.from(String(doc)), 0o644)
  } else {
    const owner =
      root === appRoot ? manifest : JSON.parse(read(join(root, 'package.json'))!.toString('utf8'))

    if (ensurePatchEntries(enabledTargets, root, owner, read, write)) {
      report.patchesAdded = true
    }

    mergeCompatibilityCatalog(manifest, owner)
    if (root !== appRoot) {
      write(
        join(root, 'package.json'),
        Buffer.from(JSON.stringify(owner, null, '\t') + '\n'),
        0o644,
      )
    }
  }

  if (JSON.stringify(manifest) !== JSON.stringify(JSON.parse(raw))) {
    // Match the file's existing indent so diffs stay minimal.
    const indent = raw.match(/\n(\s+)"/)?.[1] ?? '\t'

    write(manifestPath, Buffer.from(JSON.stringify(manifest, null, indent) + '\n'), 0o644)
  }

  if (files.size > 8192 || inputs.size > 20000 || directories.size > 8192) {
    throw new Error('Scaffold plan exceeds inventory limits')
  }

  let total = 0

  for (const file of files.values()) {
    const bytes = Buffer.from(file.content, 'base64').length

    total += bytes
    if (bytes > 16 * 1024 * 1024 || total > 32 * 1024 * 1024) {
      throw new Error('Scaffold plan exceeds byte limits')
    }
  }

  return {
    version: 1,
    root,
    appRoot,
    id,
    files: [...files.values()],
    directories: [...directories].map(([path, mode]) => ({ path, mode })),
    inputs: [...inputs.values()],
    report,
  }
}

/** Apply the same read-only plan used by native CLI orchestration. */
export function applyTarget(appRoot, id) {
  const plan = planTarget(appRoot, id)

  for (const input of plan.inputs) {
    let info

    try {
      info = lstatSync(input.path)
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error
      }
    }

    const kind = !info
      ? 'missing'
      : info.isFile()
        ? 'file'
        : info.isDirectory()
          ? 'directory'
          : 'alias'

    if (
      kind !== input.kind ||
      (kind === 'file' &&
        createHash('sha256').update(readFileSync(input.path)).digest('hex') !== input.sha256)
    ) {
      throw new Error(`Scaffold input changed; retry: ${input.path}`)
    }
  }

  for (const entry of plan.directories) {
    mkdirSync(entry.path, { recursive: true, mode: entry.mode })
  }

  for (const entry of plan.files) {
    writeFileSync(entry.path, Buffer.from(entry.content, 'base64'), { mode: entry.mode })
  }

  return plan.report
}
