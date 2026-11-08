// Real-D-Bus GTK runtime check for @octane-xplat/tray's gtk leaf, run over SSH
// into a Linux host/VM. Requires env TRAY_GTK_HOST (e.g. andromeda.local) and
// TRAY_GTK_VM (default octane-linux). The VM needs gjs, dbus-run-session and
// xvfb-run only — the fixture ships its own StatusNotifierWatcher, so no SNI
// host or appindicator/dbusmenu typelibs are required on the machine.
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'vite'

const host = process.env.TRAY_GTK_HOST
const vm = process.env.TRAY_GTK_VM ?? 'octane-linux'
assert.ok(host, 'Set TRAY_GTK_HOST to a Linux host or an OrbStack Mac host')
const q = (value) => "'" + value.replaceAll("'", "'\\''") + "'"
const prefix = process.env.TRAY_GTK_DIRECT ? 'cd /tmp && ' : `orb -m ${q(vm)} -w /tmp `
const run = (script, input) =>
  execFileSync(
    'ssh',
    ['-o', 'BatchMode=yes', '-o', 'ConnectTimeout=5', host, prefix + 'sh -c ' + q(script)],
    { input, encoding: 'utf8', timeout: 60_000, maxBuffer: 4 * 1024 * 1024 },
  )

// 4x4 solid red PNG (first pixel = FF FF 00 00 ARGB).
const PNG =
  'iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAEklEQVR4nGP4z8DwHxkzkC4AADxAH+HggXe0AAAAAElFTkSuQmCC'

const fixture = (name) => fileURLToPath(new URL('./fixtures/' + name, import.meta.url))
const temporary = mkdtempSync(join(tmpdir(), 'xplat-tray-gtk-'))
let remote
try {
  for (const [entry, out] of [
    ['tray-dbus.gtk.js', 'tray-dbus.js'],
    ['tray-window.gtk.js', 'tray-window.js'],
  ]) {
    await build({
      configFile: false,
      logLevel: 'warn',
      build: {
        outDir: temporary,
        emptyOutDir: false,
        lib: { entry: fixture(entry), formats: ['es'], fileName: () => out },
        rollupOptions: { external: [/^gi:/, 'system'] },
        minify: false,
      },
    })
  }

  writeFileSync(join(temporary, 'icon.png'), Buffer.from(PNG, 'base64'))

  remote = run('mktemp -d /tmp/xplat-tray-XXXXXX').trim()
  assert.match(remote, /^\/tmp\/xplat-tray-[A-Za-z0-9]+$/)
  for (const name of ['tray-dbus.js', 'tray-window.js']) {
    run(`cat > ${q(remote + '/' + name)}`, readFileSync(join(temporary, name)))
  }

  run(`base64 -d > ${q(remote + '/icon.png')}`, PNG)

  // Phases a–d under a private session bus; no display needed for D-Bus.
  const dbusOut = run(
    `cd ${q(remote)} && TRAY_ICON_PATH=${q(remote + '/icon.png')} dbus-run-session -- gjs -m tray-dbus.js 2>&1`,
  )

  assert.match(dbusOut, /TRAY_GTK_OK \d+/, dbusOut)
  assert.doesNotMatch(dbusOut, /TRAY_GTK_FAIL/)
  console.log(dbusOut.trim())

  // Window/residency phase needs a display server for Gtk.
  const winOut = run(
    `cd ${q(remote)} && xvfb-run -a dbus-run-session -- gjs -m tray-window.js 2>&1`,
  )

  assert.match(winOut, /TRAY_GTK_WIN_OK \d+/, winOut)
  assert.doesNotMatch(winOut, /TRAY_GTK_WIN_FAIL/)
  console.log(winOut.trim())
} finally {
  if (remote && /^\/tmp\/xplat-tray-[A-Za-z0-9]+$/.test(remote)) {
    try {
      run(`rm -rf ${q(remote)}`)
    } catch {
      // Best-effort remote cleanup.
    }
  }

  rmSync(temporary, { recursive: true, force: true })
}
