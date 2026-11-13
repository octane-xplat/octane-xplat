import { defineConfig } from 'vite'
import { native } from '@octane-xplat/cli/vite'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import { verifyWindowsLayoutRepair } from './scripts/verify-layout-repair'

verifyWindowsLayoutRepair()

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
    ? fileURLToPath(new URL('./src/qualification/index.ts', import.meta.url))
    : null

// The shared preset owns the renderer rules, octane→universal/native alias,
// suffix extension chain (.windows → the unsuffixed native default when
// building for windows), deps-bundle plugin exclusions, the HMR watchdog,
// and the px→dip CSS rewrite. App-specific additions go through the second
// argument's `extra` (or mergeConfig).
export default defineConfig(({ mode }) =>
  native(mode, {
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
        dedupe: ['@nativescript/core', '@octane-xplat/nativescript-octane'],
      },
    },
  }),
)
