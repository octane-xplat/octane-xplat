// `xplat devtools` launcher: resolves the selected project's macOS dev engine,
// generates a disposable Vite config whose entry is this package's desktop app
// (src/desktop/main.macos.ts), and runs it through runMacOSDev. The service
// worker (packages/cli devtools-desktop op) calls this from the app's own
// Node process; Go owns argv/cwd/env and the process group.

import { createRequire } from 'node:module'
import { lstatSync, realpathSync, statSync } from 'node:fs'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, relative, sep } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

export const DEVTOOLS_DESKTOP_LIFECYCLE_VERSION = 1

interface MacOSDevEngine {
  runMacOSDev(
    appRoot: string,
    options: {
      target?: Record<string, unknown>
      workshop?: boolean
      resourceRoot?: string
      onReady?: (metadata: {
        pid: number
        renderer: string
        executable: string
        observedAt?: string
        url?: string
      }) => void
    },
  ): Promise<void>
}

// Resolve the selected project's explicit engine, never a global fallback.
async function loadMacOSDevEngine(project: string): Promise<MacOSDevEngine> {
  const require = createRequire(join(project, 'package.json'))
  for (let at = project; ; at = dirname(at)) {
    const candidate = join(at, 'node_modules/@octane-xplat/macos-build')
    let found = false
    try {
      lstatSync(candidate)
      found = true
    } catch (error) {
      if (!(error instanceof Error) || !('code' in error) || error.code !== 'ENOENT') {
        throw error
      }
    }
    if (found) {
      const root = realpathSync(candidate)
      let entry: string
      try {
        entry = realpathSync(require.resolve('@octane-xplat/macos-build/dev-engine'))
      } catch (error) {
        throw new Error(
          `Update or reinstall @octane-xplat/macos-build in the selected project: development engine export unavailable; ${String(error)}`,
          { cause: error },
        )
      }
      if (!entry.startsWith(root + sep) || !statSync(entry).isFile()) {
        throw new Error(
          'Reinstall @octane-xplat/macos-build: its development engine must stay inside the selected package',
        )
      }
      const api = (await import(pathToFileURL(entry).href)) as MacOSDevEngine
      if (typeof api.runMacOSDev !== 'function') {
        throw new Error(
          'Update @octane-xplat/macos-build in the selected project: development engine API is missing',
        )
      }
      return api
    }
    if (dirname(at) === at) {
      break
    }
  }
  throw new Error(
    'Install the macOS project engine before launching devtools: bun add -D @octane-xplat/macos-build',
  )
}

export interface DevtoolsDesktopOptions {
  cwd?: string
  resourceRoot?: string
  profileRoot?: string
  onStarted?: (evidence: { kind: string; pid?: number; url?: string }) => void
}

/** Generate a separate consumer-owned cache profile; leave app entries untouched. */
export async function devtoolsDesktop({
  cwd,
  resourceRoot,
  profileRoot,
  onStarted,
}: DevtoolsDesktopOptions = {}): Promise<void> {
  if (process.platform !== 'darwin' || (process.arch !== 'arm64' && process.arch !== 'x64')) {
    throw new Error('The native devtools app requires a macOS arm64 or x86_64 execution host')
  }

  const root = realpathSync(cwd ?? process.cwd())
  const { runMacOSDev } = await loadMacOSDevEngine(root)
  const require = createRequire(join(root, 'package.json'))
  for (const name of [
    '@octane-xplat/macos-appkit',
    '@nativescript/macos-node-api',
    'octane',
    '@octanejs/vite-plugin',
    'vite',
  ]) {
    try {
      require.resolve(name)
    } catch {
      throw new Error(
        `Devtools desktop prerequisite missing: ${name}; use the matching versions from your app's macOS setup`,
      )
    }
  }

  // Generated config/bundle live only in an owned per-run directory: the
  // service worker's unique compiler profile, or OS temp for direct calls.
  // Nothing may land in project output dirs — `xplat dev` holds that lock.
  const directory = profileRoot
    ? await mkdtemp(join(profileRoot, 'session-'))
    : await mkdtemp(join(tmpdir(), 'octane-devtools-desktop-'))
  // This module runs from src/ in the monorepo and dist/host/ in an install —
  // the desktop entry is shipped as source, so resolve through src/ either way.
  const source = dirname(fileURLToPath(import.meta.url)).replace('/dist/', '/src/')
  const entry = join(source, '../desktop/main.macos.ts')
  const bundle = join(directory, 'devtools.cjs')

  await writeFile(
    join(directory, 'devtools.config.ts'),
    `import { macos } from '@octane-xplat/cli/macos/vite'
const root = ${JSON.stringify(root)}
const entry = ${JSON.stringify(entry)}

export default async ({ mode }) => {
 const settings = await macos(mode, { root, hmr: false, entry })
 return { ...settings, build: { ...settings.build, outDir: ${JSON.stringify(directory)}, emptyOutDir: false,
  lib: { entry, formats: ['cjs'], fileName: () => 'devtools.cjs' } },
  define: { ...(settings.define ?? {}), __XPLAT_DEVTOOLS_PREFERRED_ROOT__: ${JSON.stringify(JSON.stringify(root))} } }
}
`,
  )

  try {
    await runMacOSDev(root, {
      resourceRoot,
      onReady: (meta) => onStarted?.({ kind: 'native-host-spawned', pid: meta.pid }),
      target: {
        runtime: 'appkit-node-api',
        renderer: 'appkit',
        dev: {
          productName: 'Octane Xplat devtools',
          viteConfig: relative(root, join(directory, 'devtools.config.ts')),
          bundleFile: relative(root, bundle),
        },
      },
    })
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
}
