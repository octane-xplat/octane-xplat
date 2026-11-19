import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdir, mkdtemp, rm } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'vite'
import { macos } from '../../../cli/src/macos/vite.ts'
import { hostBundle, hostRoot, macOSHostArch } from '../../../cli/src/macos/jsc-host/runtime.ts'

const here = fileURLToPath(new URL('.', import.meta.url))
const appRoot = fileURLToPath(new URL('../../../../apps/macos', import.meta.url))
const scratch = join(homedir(), 'agent-scratch/octane-xplat/desktop-window-lifecycle')
await mkdir(scratch, { recursive: true })
const directory = await mkdtemp(join(scratch, 'macos-'))

try {
  const config = await macos('production', {
    root: appRoot,
    entry: join(here, 'window.macos.tsrx'),
    outDir: directory,
  })

  await build({ ...config, configFile: false, logLevel: 'error' })

  const result = spawnSync(
    join(hostBundle, 'host'),
    [
      join(hostBundle, 'NativeScript.framework/Versions/A/NativeScript'),
      join(directory, 'main.cjs'),
      join(hostBundle, `metadata.macos.${macOSHostArch()}.nsmd`),
      join(hostRoot, 'shim.js'),
    ],
    {
      encoding: 'utf8',
      timeout: 45_000,
      env: { ...process.env, OCTANE_MACOS_EXTERNAL_RUNLOOP: '1', OCTANE_MACOS_AUTOMATION: '1' },
    },
  )
  const output = result.stdout + result.stderr

  assert.equal(result.status, 0, `${result.error ?? ''}\n${output}`)
  assert.doesNotMatch(output, /DESKTOP_WINDOW_FAIL/)
  assert.match(output, /DESKTOP_WINDOW_OK/)
  assert.match(output, /DESKTOP_DIALOG_OK/)
  assert.match(output, /DESKTOP_SAVE_OK/)
  assert.match(output, /DESKTOP_MESSAGE_OK/)
  assert.match(output, /DESKTOP_ACTIVATE_OK/)
  assert.match(output, /DESKTOP_MINIMIZE_OK/)
  assert.match(output, /DESKTOP_APP_QUIT_OK/)
  console.log('DESKTOP_WINDOW_OK, DESKTOP_DIALOG_OK, DESKTOP_SAVE_OK, DESKTOP_ACTIVATE_OK, DESKTOP_MINIMIZE_OK and DESKTOP_APP_QUIT_OK (AppKit)')
} finally {
  await rm(directory, { recursive: true, force: true })
}
