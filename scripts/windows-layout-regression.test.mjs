import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { verifyWindowsLayoutRepair } from '../apps/windows/scripts/verify-layout-repair.ts'

const appRequire = createRequire(new URL('../apps/windows/package.json', import.meta.url))

test('installed Core and selected native pair contain the matching fixed-size repair', () => {
  verifyWindowsLayoutRepair()
})

test('installed Windows preview preserves percentage sizing and parent lifecycle', () => {
  const helper = fileURLToPath(
    new URL(
      '../tools/platform-qualification/windows-layout/percent-sizing.test.mjs',
      import.meta.url,
    ),
  )
  const view = appRequire.resolve('@nativescript/core/ui/core/view/index.windows.js')
  execFileSync(process.execPath, [helper, view], { stdio: 'pipe' })
})
