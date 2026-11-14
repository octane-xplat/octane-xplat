import { execFileSync } from 'node:child_process'
import { basename, dirname, resolve } from 'node:path'

const engine = process.env.LINUX_RUNTIME_EVAL_ENGINE ?? 'native'
if (!['native', 'gjs'].includes(engine)) {
  throw Error('LINUX_RUNTIME_EVAL_ENGINE must be native or gjs')
}
const slice = process.env.LINUX_RUNTIME_EVAL_SLICE ?? 'slice'
if (!['slice', 'port'].includes(slice)) {
  throw Error('LINUX_RUNTIME_EVAL_SLICE must be slice or port')
}
const executable = process.env.LINUX_RUNTIME_EVAL_EXECUTABLE
if (engine === 'native' && !executable) {
  throw Error('Set LINUX_RUNTIME_EVAL_EXECUTABLE to the prepared Linux ns-linux binary')
}
const entry =
  slice === 'port' ? `dist/port-${engine}/app.js` : `dist/${engine}/slice.js`
const masonDir = process.env.LINUX_RUNTIME_EVAL_MASON_DIR
const quote = (value) => `'${value.replaceAll("'", "'\\''")}'`
const runtime = engine === 'gjs' ? ['gjs', '-m'] : [executable]
// --expose-gc lets the port/slice drain checks force V8 collections; without
// it they silently fall back to waiting.
const envVars = engine === 'native' ? ['NS_V8_FLAGS=--expose-gc'] : []
if (masonDir) {
  envVars.push(`XPLAT_MASON_TYPELIB=${masonDir}`, `LD_LIBRARY_PATH=${masonDir}`)
}
const command = [
  'timeout',
  '60s',
  'dbus-run-session',
  '--',
  'xvfb-run',
  '-a',
  ...(envVars.length ? ['env', ...envVars] : []),
  'python3',
  'input.py',
  ...runtime,
  basename(entry),
]
const host = process.env.LINUX_RUNTIME_EVAL_HOST
const vm = process.env.LINUX_RUNTIME_EVAL_VM
if (host) {
  // Remote mode: stage input.py plus the entry's dist directory into a
  // VM-local tmpdir, run there, and remove only that directory afterwards.
  // LINUX_RUNTIME_EVAL_EXECUTABLE and LINUX_RUNTIME_EVAL_MASON_DIR are paths
  // on the remote Linux side.
  const remoteVm = vm
  const prefix = remoteVm
    ? `PATH=/usr/local/bin:$PATH orb -m ${quote(remoteVm)} -w /tmp `
    : ''
  const ssh = (script, options = {}) =>
    execFileSync(
      'ssh',
      ['-o', 'BatchMode=yes', '-o', 'ConnectTimeout=10', host, prefix + 'sh -c ' + quote(script)],
      options,
    )
  let remote
  try {
    remote = ssh('mktemp -d /tmp/xplat-lre-XXXXXX', { encoding: 'utf8' }).trim()
    if (!/^\/tmp\/xplat-lre-[A-Za-z0-9]+$/.test(remote)) {
      throw Error(`unexpected remote tmpdir: ${remote}`)
    }
    const tar = execFileSync('tar', ['-C', import.meta.dirname, '-cf', '-', 'input.py'], {
      maxBuffer: 8 * 1024 * 1024,
    })
    ssh(`mkdir -p ${quote(remote)} && tar -C ${quote(remote)} -xf -`, { input: tar })
    const entryTar = execFileSync(
      'tar',
      ['-C', resolve(import.meta.dirname, dirname(entry)), '-cf', '-', '.'],
      { maxBuffer: 64 * 1024 * 1024 },
    )
    ssh(`tar -C ${quote(remote)} -xf -`, { input: entryTar })
    // ns-linux decides .js module-ness by the nearest package.json "type";
    // a bare tmpdir has none, so bundled entries with top-level await would
    // run as CommonJS. Mirror this tool's own package.json.
    ssh(`printf '%s' '{"type":"module"}' > ${quote(remote)}/package.json`)
    ssh(`cd ${quote(remote)} && ${command.map(quote).join(' ')}`, { stdio: 'inherit' })
  } finally {
    if (remote && /^\/tmp\/xplat-lre-[A-Za-z0-9]+$/.test(remote)) {
      ssh(`rm -rf ${quote(remote)}`)
    }
  }
} else {
  const local = command.map((part) =>
    part === 'input.py'
      ? resolve(import.meta.dirname, 'input.py')
      : part === basename(entry)
        ? resolve(import.meta.dirname, entry)
        : part,
  )
  if (vm) {
    execFileSync('orb', ['-m', vm, 'bash', '-lc', local.map(quote).join(' ')], {
      stdio: 'inherit',
    })
  } else {
    execFileSync(local[0], local.slice(1), { stdio: 'inherit' })
  }
}
