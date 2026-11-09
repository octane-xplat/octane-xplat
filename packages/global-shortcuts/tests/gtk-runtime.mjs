// Real XDG GlobalShortcuts portal check for @octane-xplat/global-shortcuts on
// Linux: the fixture runs the packaged GTK backend inside a disposable Docker
// container (KDE portal stack + Xvfb + xdotool) on a remote host. Real X11
// input is injected while a foreign window (xeyes) holds focus. Env:
// GLOBAL_SHORTCUTS_LINUX_HOST — SSH host with Docker (e.g. andromeda).
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'vite'

const host = process.env.GLOBAL_SHORTCUTS_LINUX_HOST

assert.ok(host, 'Set GLOBAL_SHORTCUTS_LINUX_HOST to an SSH host with Docker (e.g. andromeda)')

const quote = (value) => "'" + value.replaceAll("'", "'\\''") + "'"
const run = (script, input) =>
  execFileSync('ssh', ['-o', 'BatchMode=yes', '-o', 'ConnectTimeout=5', host, script], {
    input,
    encoding: 'utf8',
    timeout: 600_000,
    maxBuffer: 8 * 1024 * 1024,
  })

const id = randomUUID().replaceAll('-', '').slice(0, 12)
const directory = mkdtempSync(join(tmpdir(), 'xplat-global-shortcuts-gtk-'))
let remote

try {
  await build({
    configFile: false,
    logLevel: 'warn',
    build: {
      outDir: directory,
      emptyOutDir: false,
      minify: false,
      lib: {
        entry: fileURLToPath(new URL('./fixtures/hotkey.gtk.ts', import.meta.url)),
        formats: ['es'],
        fileName: () => 'bundle.mjs',
      },
      rollupOptions: { external: [/^gi:/] },
    },
  })

  remote = run(`mktemp -d /tmp/xplat-ghk-${id}-XXXXXX`).trim()
  assert.match(remote, /^\/tmp\/xplat-ghk-/)
  for (const [local, name] of [
    [join(directory, 'bundle.mjs'), 'bundle.mjs'],
    [fileURLToPath(new URL('./fixtures/hotkey-run.sh', import.meta.url)), 'run.sh'],
    [fileURLToPath(new URL('./fixtures/hotkey.Dockerfile', import.meta.url)), 'Dockerfile'],
  ]) {
    run(`cat > ${quote(remote + '/' + name)}`, readFileSync(local))
  }

  run(`chmod +x ${quote(remote + '/run.sh')}`)

  const output = run(
    `cd ${quote(remote)} && docker build -q -t xplat-ghk-${id} . >/dev/null && docker run --rm --name xplat-ghk-${id} xplat-ghk-${id} 2>&1; docker rmi xplat-ghk-${id} >/dev/null 2>&1 || true`,
  )

  assert.match(output, /GHK_LINUX_OK/, output)
  assert.doesNotMatch(output, /GHK_LINUX_FAIL/)
  console.log(
    output
      .split('\n')
      .filter((line) => /PHASE|FOCUSED_WINDOW|assigned trigger|GHK_LINUX_OK/.test(line))
      .join('\n'),
  )
} finally {
  if (remote && remote.startsWith('/tmp/xplat-ghk-')) {
    try {
      run(`rm -rf ${quote(remote)}`)
    } catch {
      // Best-effort remote cleanup.
    }
  }

  rmSync(directory, { recursive: true, force: true })
}
