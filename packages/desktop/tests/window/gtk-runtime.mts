import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'vite'
import { linuxGtk } from '../../../cli/src/linux-gtk/vite.ts'

const host = process.env.DESKTOP_WINDOW_GTK_HOST
const vm = process.env.DESKTOP_WINDOW_GTK_VM
const quote = (value) => "'" + value.replaceAll("'", "'\\''") + "'"
assert.ok(host || vm || process.platform === 'linux', 'Set DESKTOP_WINDOW_GTK_HOST or DESKTOP_WINDOW_GTK_VM')

const run = (script, input) => {
  const args = vm ? ['-m', vm, '-w', '/tmp', 'sh', '-c', script] : ['-c', script]
  const executable = vm ? 'orb' : 'sh'
  const options = { input, encoding: 'utf8', timeout: 45_000 }

  if (host) {
    const command = [executable, ...args].map(quote).join(' ')

    return execFileSync('ssh', ['-o', 'BatchMode=yes', '-o', 'ConnectTimeout=5', host, command], options)
  }

  return execFileSync(executable, args, options)
}

const scratch = join(homedir(), 'agent-scratch/octane-xplat/desktop-window-lifecycle')
mkdirSync(scratch, { recursive: true })
const directory = mkdtempSync(join(scratch, 'gtk-'))
const here = fileURLToPath(new URL('.', import.meta.url))
const root = fileURLToPath(new URL('../../../linux-gtk-renderer/test/fixtures', import.meta.url))
let remote

try {
  const config = await linuxGtk('production', {
    root,
    entry: join(here, 'window.gtk.tsrx'),
    outDir: directory,
  })

  await build({ ...config, configFile: false, logLevel: 'error' })

  const candidate = run(
    'scratch="$HOME/agent-scratch/octane-xplat/desktop-window-lifecycle"\n' +
      'mkdir -p "$scratch" && mktemp -d "$scratch/gtk-XXXXXX"',
  ).trim()

  assert.match(candidate, /^\/[^\r\n]+\/agent-scratch\/octane-xplat\/desktop-window-lifecycle\/gtk-[A-Za-z0-9]+$/)
  remote = candidate
  const path = quote(join(remote, 'app.js'))

  run(`cat > ${path}`, readFileSync(join(directory, 'app.js')))
  const output = run(`timeout 30 xvfb-run -a dbus-run-session -- gjs -m ${path} 2>&1`)

  assert.doesNotMatch(output, /DESKTOP_WINDOW_FAIL|Gjs-CRITICAL|Gtk-CRITICAL/)
  assert.match(output, /DESKTOP_WINDOW_OK/)
  assert.match(output, /DESKTOP_DIALOG_OK/)
  assert.match(output, /DESKTOP_APP_QUIT_OK/)
  console.log(output.trim())
} finally {
  try {
    if (remote) {
      run(`rm -rf ${quote(remote)}`)
    }
  } finally {
    rmSync(directory, { force: true, recursive: true })
  }
}
