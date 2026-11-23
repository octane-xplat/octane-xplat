import { defineConfig } from 'vite'
import { native } from '@octane-xplat/cli/vite'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { verifyWindowsLayoutRepair } from './scripts/verify-layout-repair'

verifyWindowsLayoutRepair()

// The shared entry is outside this toolchain workspace. Resolve its packages
// from here so Windows keeps one copy of its preview core and renderer.
const manifest = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))
const windowsDependencies = Object.keys(manifest.dependencies)

const qualificationEnabled = process.env.XPLAT_WINDOWS_QUALIFICATION === '1'
const qualificationSource = qualificationEnabled
  ? {
      commit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
      dirty: execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim() !== '',
    }
  : null

// XPLAT_WINDOWS_ENTRY swaps the app entry for a staged verification app (the
// desktop-shell journey stages its sources under src/.desktop-shell-journey/
// so they resolve this app's dependencies).
const entryOverride = process.env.XPLAT_WINDOWS_ENTRY
  ? fileURLToPath(new URL(process.env.XPLAT_WINDOWS_ENTRY, new URL('./', import.meta.url)))
  : qualificationEnabled
    ? fileURLToPath(new URL('../../apps/harness/windows/qualification/index.ts', import.meta.url))
    : null

// The shared preset owns the renderer rules, octane→universal/native alias,
// suffix extension chain (.windows → the unsuffixed native default when
// building for windows), deps-bundle plugin exclusions, the HMR watchdog,
// and the px→dip CSS rewrite. App-specific additions go through the second
// argument's `extra` (or mergeConfig).
export default defineConfig(async ({ mode }) => {
  const config = await native(mode, {
    extra: {
      define: qualificationSource
        ? { __WINDOWS_QUALIFICATION_SOURCE__: JSON.stringify(qualificationSource) }
        : {},
      plugins: entryOverride
        ? [
            {
              name: 'windows-entry-override',
              enforce: 'pre',
              resolveId(source, importer) {
                if (
                  importer?.includes('virtual:entry-with-polyfills') &&
                  source === '/src/index.ts'
                ) {
                  return entryOverride
                }

                return null
              },
            },
          ]
        : [],
      resolve: {
        // This app runs the PR-preview core (9.1.4-next.0) while workspace
        // packages' devDeps carry 9.1.2 — importers inside packages/* would
        // otherwise resolve a second core copy and split view identity.
        // Peer contexts can also duplicate the renderer's element registry.
        dedupe: windowsDependencies,
        extensions: ['.native.tsrx', '.native.tsx', '.native.ts', '.native.js'],
        alias: [
          {
            find: '@octane-xplat/app/platform/filepick',
            replacement: fileURLToPath(
              new URL('../../packages/app/src/platform/filepick.windows.ts', import.meta.url),
            ),
          },
          {
            find: '@octane-xplat/ui/internal/gesture-input',
            replacement: fileURLToPath(
              new URL('../../packages/ui/src/gestures/external.windows.ts', import.meta.url),
            ),
          },
        ],
      },
    },
  })

  // The shared Vite checker does not recognize Windows and overwrites the
  // project's moduleSuffixes. Run the same project check with its own config.
  const plugins = config.plugins.flat(Infinity)
  const checkers = plugins.filter((plugin) => plugin?.name === 'ns-typescript-check')

  if (checkers.length !== 1) {
    throw new Error('Expected one NativeScript TypeScript checker')
  }

  const require = createRequire(import.meta.url)
  const typescriptPackage = require.resolve('typescript/package.json')
  const typescriptManifest = JSON.parse(readFileSync(typescriptPackage, 'utf8'))
  const tsc = resolve(dirname(typescriptPackage), typescriptManifest.bin.tsc)

  config.plugins = [
    ...plugins.filter((plugin) => plugin?.name !== 'ns-typescript-check'),
    {
      name: 'windows-project-typecheck',
      apply: 'build',
      buildStart() {
        execFileSync(
          process.execPath,
          [
            tsc,
            '--runExternalCode',
            '--noEmit',
            '-p',
            fileURLToPath(new URL('./tsconfig.typecheck.json', import.meta.url)),
          ],
          { stdio: 'inherit' },
        )
      },
    },
  ]

  return config
})
