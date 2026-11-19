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
  const script = [
    'set -eu',
    'app="$1/app.js"',
    'primary_log="$1/primary.log"',
    'mkdir "$1/second-launch"',
    'gjs -m "$app" > "$primary_log" 2>&1 &',
    'primary=$!',
    `trap 'kill "$primary" 2>/dev/null || true; cat "$primary_log"' EXIT`,
    'until grep -q DESKTOP_WAITING_FOR_SECOND_INSTANCE "$primary_log"; do',
    '  kill -0 "$primary" 2>/dev/null || exit 1',
    '  sleep 0.1',
    'done',
    `(cd "$1/second-launch" && timeout 10 gjs -m "$app" 'résumé notes.txt' --integration-flag) > "$1/secondary.log" 2>&1 || { cat "$1/secondary.log"; exit 1; }`,
    '! grep -q DESKTOP_WAITING_FOR_SECOND_INSTANCE "$1/secondary.log" || exit 1',
    'wait "$primary"',
  ].join('\n')
  const output = run(`timeout 30 xvfb-run -a dbus-run-session -- sh -c ${quote(script)} sh ${quote(remote)} 2>&1`)

  assert.doesNotMatch(output, /DESKTOP_WINDOW_FAIL|Gjs-CRITICAL|Gtk-CRITICAL/)
  assert.match(output, /DESKTOP_WINDOW_OK/)
  assert.match(output, /DESKTOP_DIALOG_OK/)
  assert.match(output, /DESKTOP_SAVE_OK/)
  assert.match(output, /DESKTOP_MESSAGE_OK/)
  assert.match(output, /DESKTOP_SCREEN_OK/)
  assert.match(output, /DESKTOP_BOUNDS_OK/)
  assert.match(output, /DESKTOP_ACTIVATE_OK/)
  assert.match(output, /DESKTOP_SECOND_INSTANCE_OK/)
  assert.match(output, /DESKTOP_MINIMIZE_OK/)
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
