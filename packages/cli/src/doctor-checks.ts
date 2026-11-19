// @ts-nocheck — .mjs→.ts port: annotations pending (transitional)
import { packageManagerFor, packageManagerExec } from './package-manager.ts'
import { inspectCompatibility } from './compatibility-check.ts'
import { workspaceRoot } from './compatibility.ts'
import { runDoctorTool as check } from './doctor-tool.ts'
import { existsSync, readdirSync, readFileSync, realpathSync } from 'node:fs'
import { dirname, join, parse, relative, resolve, sep } from 'node:path'
import { hasLinux, hasMacOS, hasNative, hasWindows, nsPlatforms } from './targets.ts'
import { inspectPatches, patchStateDetail } from './patches.ts'

import { inspectLinuxPackageConfig } from './linux/config.ts'
import { installedGtkRuntimeRoot } from './linux/gtk-runtime.ts'
import { installedPackageRoot } from './package-root.ts'

const frameworkFallbacks = {
  // UI's plugin-backed widgets are optional platform subpaths. Requiring
  // their plugins for every `@octane-xplat/ui` import creates false warnings
  // for targets and apps that never load those subpaths.
  '@octane-xplat/ui': [],
}

const nativePlugin = (name) =>
  (name.startsWith('@nativescript/') ||
    name.startsWith('@nativescript-community/') ||
    name.startsWith('nativescript-')) &&
  !name.endsWith('/octane') &&
  !name.endsWith('/core')

const readJson = (file) => {
  try {
    return JSON.parse(readFileSync(file, 'utf8'))
  } catch {
    return null
  }
}

const packageName = (specifier) => {
  if (!specifier.startsWith('@') && !specifier.includes('/')) {
    return specifier
  }

  const parts = specifier.split('/')

  return specifier.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0]
}

const importSpecifiers = (source) => {
  const specs = new Set()

  for (const pattern of [
    /\bfrom\s*['"]([^'"]+)['"]/g,
    /\bimport\s*['"]([^'"]+)['"]/g,
    /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  ]) {
    for (const match of source.matchAll(pattern)) {
      specs.add(match[1])
    }
  }

  return specs
}

/** Platform tags a native bundle can ship — mirrors the bundler's per-target
 *  allowlist (`boundaryAllowed` in vite.ts). A leaf tagged for a platform this
 *  app cannot build never joins its graphs, so its imports are not HMR scope. */
const nativeTagAllowlist = (cwd) => {
  const perPlatform = {
    ios: ['ios', 'android', 'mobile'],
    android: ['ios', 'android', 'mobile'],
    windows: ['windows'],
    native: ['ios', 'android', 'mobile', 'windows'],
  }

  const platforms = nsPlatforms(cwd)
  const tags = new Set()

  for (const platform of platforms.length ? platforms : ['native']) {
    for (const tag of perPlatform[platform] ?? []) {
      tags.add(tag)
    }
  }

  return tags
}

const PLATFORM_TAG = /\.(web|mobile|ios|android|macos|windows|linux|gtk)\.[^./\\]+$/

/** Platform-scoped subtrees inside a source root follow the file-suffix
 *  convention: `src/web`, `src/macos`, … hold leaves for that platform. */
const PLATFORM_DIRS = new Set(['web', 'macos', 'windows', 'linux', 'gtk'])

/** Trees that never ship app runtime code; their imports are not bundle edges. */
const NON_RUNTIME_DIRS = new Set([
  'node_modules',
  'test',
  'tests',
  'e2e',
  'fixtures',
  '__tests__',
  'dist',
  'types',
  'scripts',
  'template',
  'templates',
])

/** Declarations and tests produce no runtime bundle edges. */
const NON_RUNTIME_FILE = /\.d\.ts$|[.-](?:test|spec)\.[^.]+$/

const sourceFiles = (root, tags) => {
  if (!existsSync(root)) {
    return []
  }

  const out = []
  const visit = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('.') || NON_RUNTIME_DIRS.has(entry.name)) {
        continue
      }

      const file = join(dir, entry.name)

      if (entry.isDirectory()) {
        // A platform-named subtree is foreign when the app cannot ship it.
        if (!PLATFORM_DIRS.has(entry.name) || !tags || tags.has(entry.name)) {
          visit(file)
        }
      } else if (/\.(?:m?[jt]sx?|tsrx)$/.test(entry.name) && !NON_RUNTIME_FILE.test(entry.name)) {
        const tag = PLATFORM_TAG.exec(entry.name)?.[1]

        if (!tag || !tags || tags.has(tag)) {
          out.push(file)
        }
      }
    }
  }

  visit(root)
  return out
}

/** Workspace-package runtime source lives under src/ when the package has one —
 *  config, test and generated trees beside it never reach an app bundle. */
const packageSourceFiles = (root, tags) => {
  const src = join(root, 'src')

  return sourceFiles(existsSync(src) ? src : root, tags)
}

const workspacePackages = (cwd) => {
  const found = new Map()
  let dir = resolve(cwd)

  while (true) {
    for (const group of ['apps', 'packages', 'tools']) {
      const parent = join(dir, group)

      if (!existsSync(parent)) {
        continue
      }

      for (const name of readdirSync(parent)) {
        const root = join(parent, name)
        const manifest = readJson(join(root, 'package.json'))

        if (manifest?.name) {
          found.set(manifest.name, root)
        }
      }
    }

    const next = dirname(dir)

    if (next === dir) {
      break
    }

    dir = next
  }

  return found
}

const packageRoot = (cwd, name, workspaces) => {
  // Hoisted workspaces install at the workspace root — Node-style walk-up
  // first, then the declared workspace map.
  return installedPackageRoot(cwd, name) ?? workspaces.get(name)
}

const frameworkPlugins = (cwd, name, workspaces) => {
  const root = packageRoot(cwd, name, workspaces)
  const manifest = root && readJson(join(root, 'package.json'))
  // Only peers are app-declared contracts — real `dependencies` travel
  // transitively and merge through `ns prepare`'s BFS without the app
  // redeclaring them (decision #51).
  const declared = Object.keys(manifest?.peerDependencies ?? {}).filter(nativePlugin)

  return declared.length ? declared : (frameworkFallbacks[name] ?? [])
}

/**
 * Find native plugins required by the framework packages reachable from an app
 * source tree, then compare them with the app's own package.json. This is a
 * warning because the web target does not need native plugin declarations and
 * a package may intentionally keep an optional native capability unused.
 */
export function findMissingPluginDeclarations(cwd) {
  const manifest = readJson(join(cwd, 'package.json')) ?? {}
  const owned = new Set([
    ...Object.keys(manifest.dependencies ?? {}),
    ...Object.keys(manifest.devDependencies ?? {}),
    ...Object.keys(manifest.optionalDependencies ?? {}),
    ...Object.keys(manifest.peerDependencies ?? {}),
  ])

  const workspaces = workspacePackages(cwd)
  const tags = nativeTagAllowlist(cwd)
  const pending = sourceFiles(join(cwd, 'src'), tags)

  for (const dir of ['app', 'src/app']) {
    pending.push(...sourceFiles(join(cwd, dir), tags))
  }

  const visited = new Set()
  const frameworks = new Map()
  const eligible = new Map()

  while (pending.length) {
    const file = pending.pop()

    if (visited.has(file)) {
      continue
    }

    visited.add(file)

    let source

    try {
      source = readFileSync(file, 'utf8')
    } catch {
      continue
    }

    for (const specifier of importSpecifiers(source)) {
      const name = packageName(specifier)

      if (frameworkFallbacks[name]) {
        if (!frameworks.has(name)) {
          frameworks.set(name, new Set())
        }

        frameworks.get(name).add(relative(cwd, file) || parse(file).base)
        continue
      }

      const root = packageRoot(cwd, name, workspaces)

      if (root && workspaces.has(name)) {
        if (!eligible.has(name)) {
          eligible.set(name, packageSourceFiles(root, tags))
        }

        pending.push(...eligible.get(name))
      }
    }
  }

  const missing = new Map()

  for (const [framework] of frameworks) {
    for (const plugin of frameworkPlugins(cwd, framework, workspaces)) {
      if (!owned.has(plugin)) {
        if (!missing.has(plugin)) {
          missing.set(plugin, new Set())
        }

        missing.get(plugin).add(framework)
      }
    }
  }

  return [...missing.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([plugin, frameworks]) => ({ plugin, frameworks: [...frameworks].sort() }))
}

/**
 * @nativescript/vite scopes HMR to the app source dir plus the roots named in
 * the app's tsconfig `paths` — a workspace package imported but absent from
 * `paths` still builds and serves, but edits to it never reach `handleHotUpdate`
 * and the save is dropped silently. Warn when that gap exists. Only files that
 * can join the app's bundles count: tests, declarations, configs and leaves for
 * platforms the app does not target are not HMR scope.
 */
export function findHmrScopeGaps(cwd) {
  if (!existsSync(join(cwd, 'nativescript.config.ts'))) {
    return []
  }

  const tsconfig = readJson(join(cwd, 'tsconfig.json'))
  let paths = tsconfig?.compilerOptions?.paths

  if (!paths && typeof tsconfig?.extends === 'string') {
    paths = readJson(join(cwd, tsconfig.extends))?.compilerOptions?.paths ?? undefined
  }

  if (!paths) {
    return []
  }

  const workspaces = workspacePackages(cwd)

  if (workspaces.size === 0) {
    return []
  }

  // '@scope/pkg' and '@scope/pkg/*' both cover the package.
  const covered = new Set(Object.keys(paths).map((k) => k.replace(/\/?\*$/, '')))
  const tags = nativeTagAllowlist(cwd)

  const pending = [
    ...sourceFiles(join(cwd, 'src'), tags),
    ...sourceFiles(join(cwd, 'app'), tags),
    ...sourceFiles(join(cwd, 'src/app'), tags),
  ]

  const visited = new Set()
  const gaps = new Set()
  const eligible = new Map()

  while (pending.length) {
    const file = pending.pop()

    if (visited.has(file)) {
      continue
    }

    visited.add(file)

    let source

    try {
      source = readFileSync(file, 'utf8')
    } catch {
      continue
    }

    for (const specifier of importSpecifiers(source)) {
      const name = packageName(specifier)
      const root = workspaces.get(name)

      if (!root) {
        continue
      }

      if (!eligible.has(name)) {
        eligible.set(name, packageSourceFiles(root, tags))
      }

      const files = eligible.get(name)

      // A package with no shippable source here has no HMR surface — a
      // type-only facade or a package whose leaves all target other platforms.
      if (!covered.has(name) && files.length) {
        gaps.add(name)
      }

      pending.push(...files)
    }
  }

  return [...gaps].sort()
}

/**
 * A native app dependency whose install realpaths outside the app root — a
 * `link:`/`file:`/`portal:` checkout — resolves `@nativescript/core` from that
 * checkout's own node_modules during typechecks, producing a second type
 * identity (issue #66). The app's tsconfig must pin core to its own copy;
 * names the first linked dependency found, or null.
 */
export function findLinkedCoreTypeGap(cwd) {
  if (!existsSync(join(cwd, 'nativescript.config.ts'))) {
    return null
  }

  const tsconfig = readJson(join(cwd, 'tsconfig.json'))
  let paths = tsconfig?.compilerOptions?.paths

  if (!paths && typeof tsconfig?.extends === 'string') {
    paths = readJson(join(cwd, tsconfig.extends))?.compilerOptions?.paths ?? undefined
  }

  if (paths?.['@nativescript/core']) {
    return null
  }

  const manifest = readJson(join(cwd, 'package.json')) ?? {}
  const declared = new Set([
    ...Object.keys(manifest.dependencies ?? {}),
    ...Object.keys(manifest.devDependencies ?? {}),
    ...Object.keys(manifest.optionalDependencies ?? {}),
    ...Object.keys(manifest.peerDependencies ?? {}),
  ])

  const root = realpathSync(workspaceRoot(cwd))

  for (const name of declared) {
    const location = installedPackageRoot(cwd, name)

    if (location && location !== root && !location.startsWith(root + sep)) {
      return name
    }
  }

  return null
}

export type DoctorMessage = { level: 'info' | 'warn'; text: string }
export type DoctorCheck = { name: string; ok: boolean; detail?: string; hint?: string }

/** Canonical diagnostic policy; presentation and process ownership belong to callers.
 * This operation may run project-installed declaration tools. It never installs
 * dependencies, launches an application, or claims that tool presence is a runtime pass.
 */
export async function inspectDoctor({
  onMessage,
  macosChecks,
}: {
  onMessage?: (message: DoctorMessage) => void
  macosChecks?: () => Promise<DoctorCheck[]>
} = {}) {
  const messages: DoctorMessage[] = []
  const message = (level: DoctorMessage['level'], text: string) => {
    const value = { level, text }

    messages.push(value)
    onMessage?.(value)
  }

  const cwd = process.cwd()

  const rows: DoctorCheck[] = []
  const row = (name, ok, detail, hint) => rows.push({ name, ok, detail, hint })
  const native = hasNative(cwd)
  const macos = hasMacOS(cwd)
  const manifest = readJson(join(cwd, 'package.json')) ?? {}
  let compatibilityFailed = false

  try {
    const compatibilityRows = inspectCompatibility(cwd)

    rows.push(...compatibilityRows)
    compatibilityFailed = compatibilityRows.some((r) => !r.ok)
  } catch (error) {
    row(
      'compatibility',
      false,
      error.message,
      'fix the package/workspace metadata and rerun xplat doctor',
    )

    compatibilityFailed = true
  }

  let declarationPackCheckFailed = false
  let declarationPackCheckOutput = ''

  if (existsSync(join(cwd, 'tsrx-typegen.json'))) {
    const declarations = check(
      packageManagerFor(cwd),
      packageManagerExec(cwd, ['tsrx-typegen', '--pack-check']).args,
      cwd,
      120000,
    )

    row(
      'tsrx package declarations',
      declarations.ok,
      declarations.out,
      'run bun run tsrx-typegen --pack-check and resolve the reported package issue',
    )

    declarationPackCheckFailed = !declarations.ok
    declarationPackCheckOutput = declarations.out
  }

  row('node', check('node', ['--version']).ok, check('node', ['--version']).out)

  const manager = packageManagerFor(cwd)

  row(manager, check(manager, ['--version']).ok, check(manager, ['--version']).out)
  if (native) {
    row(
      'ns CLI',
      check(packageManagerFor(cwd), packageManagerExec(cwd, ['ns', '--version']).args, cwd).ok,
      check(packageManagerFor(cwd), packageManagerExec(cwd, ['ns', '--version']).args, cwd).out,
      'add the nativescript devDep (the starter ships it)',
    )

    row(
      'xcodebuild',
      check('xcodebuild', ['-version']).ok,
      check('xcodebuild', ['-version']).out,
      'iOS needs Xcode — App Store install + xcode-select',
    )

    row(
      'xcodeproj gem',
      check('ruby', ['-e', 'require "xcodeproj"']).ok,
      '',
      'gem install --user-install xcodeproj',
    )

    const sims = check('xcrun', ['simctl', 'list', 'devices', 'booted'])

    row('iOS simulator', sims.ok, sims.out || 'none booted')

    const adb = check('adb', ['devices'])
    const devices = adb.ok
      ? adb.out
          .split('\n')
          .slice(1)
          .filter((l) => l.includes('\tdevice')).length
      : 0

    row('adb', adb.ok, `${devices} device(s)`, 'Android SDK platform-tools on PATH')
    row(
      'ANDROID_HOME',
      !!process.env.ANDROID_HOME,
      process.env.ANDROID_HOME || 'unset',
      'export ANDROID_HOME=$HOME/Library/Android/sdk',
    )

    row(
      'JAVA_HOME',
      !!process.env.JAVA_HOME,
      process.env.JAVA_HOME || 'unset',
      'JDK 17 (JDK 25 breaks the Android toolchain)',
    )
  }

  if (macos) {
    const platformRows = macosChecks
      ? await macosChecks()
      : await (await import('./macos/doctor-checks.ts')).inspectMacOSDoctor(cwd, manifest)

    rows.push(...platformRows)
  }

  if (hasLinux(cwd)) {
    const config = inspectLinuxPackageConfig(cwd)

    row(
      'Linux packaging config',
      config.issues.length === 0,
      config.issues.join('; ') || config.applicationId,
      config.issues.join('; '),
    )

    const tar = check('tar', ['--version'])

    row('Linux archive tool', tar.ok, tar.out, 'install tar')
    const gtk = config.runtime === 'gtk'
    const gtkPayloads = gtk ? installedGtkRuntimeRoot(cwd) : null
    const installGtkPayloads =
      'install matching releases of @octane-xplat/cli and @octane-xplat/linux-gtk'
    if (gtk) {
      row(
        'Linux GTK payloads',
        !!gtkPayloads,
        gtkPayloads ?? 'missing NativeScript runtime',
        installGtkPayloads,
      )
    }
    if (process.platform === 'linux') {
      if (gtk && gtkPayloads) {
        const architecture =
          process.arch === 'x64' ? 'x86_64' : process.arch === 'arm64' ? 'aarch64' : null
        const runtime = architecture ? join(gtkPayloads, architecture) : null
        const result = runtime
          ? check(
              'env',
              [
                `ICU_DATA=${join(runtime, 'icu')}`,
                join(runtime, 'ns-linux'),
                '-e',
                `const major = gtk_get_major_version(), minor = gtk_get_minor_version();
           if (major !== 4 || minor < 14) throw Error('GTK 4.14+ required');
           const mason = xplat_mason_engine_new();
           if (!mason) throw Error('Mason could not allocate an engine');
           xplat_mason_engine_free(mason);
           console.log('NativeScript with GTK ' + major + '.' + minor);`,
              ],
              cwd,
            )
          : { ok: false, out: `unsupported architecture: ${process.arch}` }
        row(
          'Linux runtime',
          result.ok,
          result.out,
          'install libgtk-4-1 (GTK 4.14+) and libjson-glib-1.0-0',
        )
      }


      row(
        'Linux graphical session',
        !!(process.env.DISPLAY || process.env.WAYLAND_DISPLAY),
        process.env.DISPLAY || process.env.WAYLAND_DISPLAY || 'unset',
        'run in a desktop session or use xvfb-run for automated tests',
      )

      row(
        'Linux session bus',
        !!process.env.DBUS_SESSION_BUS_ADDRESS,
        process.env.DBUS_SESSION_BUS_ADDRESS ? 'configured' : 'unset',
        'run in a desktop session or dbus-run-session',
      )
    } else {
      message('info', 'Linux archive can be built here. Verify the NativeScript/GTK4 runtime on Linux.')
    }
  }

  for (const patch of inspectPatches(workspaceRoot(cwd))) {
    if (patch.state === 'not-declared' || patch.state === 'not-applicable') {
      continue
    }

    row(
      `patch ${patch.specifier}`,
      patch.state === 'applied',
      patchStateDetail(patch.state),
      patch.state === 'not-installed' ? 'run `bun install`' : 'run `xplat patches apply`',
    )
  }

  const windows = hasWindows(cwd)

  if (windows) {
    const winHost = process.platform === 'win32'

    row(
      'Windows host',
      winHost,
      process.platform,
      'the WinUI 3 target builds and runs only on Windows 10 1809+',
    )

    const windowsRuntimeVersion =
      manifest.devDependencies?.['@nativescript/windows'] ??
      manifest.dependencies?.['@nativescript/windows']

    row(
      '@nativescript/windows',
      typeof windowsRuntimeVersion === 'string' && !/[\^~]/.test(windowsRuntimeVersion),
      windowsRuntimeVersion ?? 'not declared',
      'pin an exact version — ranges match incompatible older prereleases',
    )

    if (winHost) {
      const dotnet = check('dotnet', ['--version'])
      const dotnetMajor = parseInt(dotnet.out ?? '', 10)

      row(
        '.NET SDK',
        dotnet.ok && dotnetMajor >= 10,
        dotnet.out || 'not found',
        'install the .NET 10 SDK — the WinUI 3 host builds with dotnet build',
      )

      const devMode = check('powershell', [
        '-NoProfile',
        '-Command',
        '(Get-ItemProperty "HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\AppModelUnlock" -Name AllowDevelopmentWithoutDevLicense -ErrorAction SilentlyContinue).AllowDevelopmentWithoutDevLicense',
      ])

      row(
        'Developer Mode',
        devMode.ok && devMode.out?.trim() === '1',
        devMode.ok
          ? `AllowDevelopmentWithoutDevLicense=${devMode.out?.trim() || 'unset'}`
          : 'unverified',
        'enable Settings → For developers → Developer Mode, or signed MSIX packaging',
      )
    }
  }

  const pluginWarnings = native ? findMissingPluginDeclarations(cwd) : []

  for (const { plugin, frameworks } of pluginWarnings) {
    message(
      'warn',
      `native plugin declaration — ${plugin} is required by ${frameworks.join(', ')}; add it to this app's package.json`,
    )
  }

  const scopeGaps = native ? findHmrScopeGaps(cwd) : []

  for (const name of scopeGaps) {
    message(
      'warn',
      `HMR scope — ${name} is imported but missing from tsconfig paths; native hot updates silently skip its files`,
    )
  }

  const linkedCoreGap = native ? findLinkedCoreTypeGap(cwd) : null

  if (linkedCoreGap) {
    message(
      'warn',
      `linked dependency — ${linkedCoreGap} resolves outside this app's install; pin "@nativescript/core" and "@nativescript/core/*" to "./node_modules/@nativescript/core…" in tsconfig paths or linked checkouts typecheck a second core copy`,
    )
  }

  const bad = rows.filter((row) => !row.ok).length
  const summary =
    bad === 0 ? 'All checks pass' : `${bad} check(s) need attention — see the missing items above`

  return {
    rows,
    messages,
    pluginWarnings,
    scopeGaps,
    summary: pluginWarnings.length
      ? `${summary}; ${pluginWarnings.length} native plugin declaration warning(s)`
      : summary,
    exitCode:
      compatibilityFailed ||
      declarationPackCheckFailed ||
      rows.some((row) => row.name.startsWith('Linux ') && !row.ok)
        ? 1
        : 0,
    diagnosticStderr: declarationPackCheckOutput,
  }
}
