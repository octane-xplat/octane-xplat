import { build } from 'vite'
import {
  chmodSync, closeSync, existsSync, lstatSync, mkdirSync, openSync,
  readFileSync, realpathSync, writeFileSync,
} from 'node:fs'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { basename, dirname, resolve } from 'node:path'
import { linuxGtk } from '../../../packages/cli/src/linux-gtk/vite.ts'
import { nativeGiProjection } from './native-gi-projection.mjs'

const [payloadArg, outputArg] = process.argv.slice(2)
if (!payloadArg || !outputArg || process.argv.length !== 4) {
  throw new Error('Pass the staged runtime payload and a new app output directory')
}
const payload = realpathSync(payloadArg)
const output = resolve(outputArg)
const archive = output + '.tar.gz'
if (existsSync(archive)) throw new Error(`App archive already exists: ${archive}`)
const manifest = JSON.parse(readFileSync(resolve(payload, 'manifest.json'), 'utf8'))
if (manifest.version !== 1 || !['x86_64', 'aarch64'].includes(manifest.architecture)) {
  throw new Error('Invalid staged runtime payload')
}
const files = Object.entries(manifest.files)
for (const name of ['ns-linux', 'gi.json', 'icu/icudt77l.dat', `metadata-${manifest.architecture}.bin`]) {
  if (!Object.hasOwn(manifest.files, name)) throw new Error(`Runtime payload is missing ${name}`)
}

function payloadBytes(name, hash) {
  if (
    !/^[A-Za-z0-9_!.-]+(?:\/[A-Za-z0-9_!.-]+)*$/.test(name) ||
    name.split('/').some((part) => part === '..' || part === '.')
  ) {
    throw new Error(`Invalid runtime payload path: ${name}`)
  }
  const path = resolve(payload, name)
  if (!lstatSync(path).isFile() || realpathSync(path) !== path) {
    throw new Error(`Runtime payload file must be a regular file: ${name}`)
  }
  const bytes = readFileSync(path)
  const actual = createHash('sha256').update(bytes).digest('hex')
  if (actual !== hash) throw new Error(`Runtime payload checksum mismatch: ${name}`)
  return bytes
}
for (const [name, hash] of files) payloadBytes(name, hash)

mkdirSync(output)
const preset = await linuxGtk('production', {
  root: resolve(import.meta.dirname, '..'),
  entry: 'port/installed-app.gtk.tsx',
  outDir: output,
})
await build({
  ...preset,
  plugins: [nativeGiProjection(resolve(payload, 'gi.json')), ...preset.plugins],
  build: {
    ...preset.build,
    minify: false,
    rollupOptions: { ...preset.build.rollupOptions, external: () => false },
  },
})

const runtime = resolve(output, 'runtime')
mkdirSync(runtime)
for (const [name, hash] of files) {
  const destination = resolve(runtime, name)
  mkdirSync(dirname(destination), { recursive: true })
  writeFileSync(destination, payloadBytes(name, hash), { mode: name === 'ns-linux' ? 0o755 : 0o644 })
}
writeFileSync(resolve(runtime, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n')

writeFileSync(resolve(output, 'package.json'), '{"type":"module"}\n')
writeFileSync(resolve(output, 'launch'), `#!/bin/sh
set -eu
APP_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
export ICU_DATA="$APP_DIR/runtime/icu"
exec "$APP_DIR/runtime/ns-linux" "$APP_DIR/app.js" "$@"
`)
chmodSync(resolve(output, 'launch'), 0o755)
const archiveFd = openSync(archive, 'wx')
try {
  execFileSync('tar', ['-czf', '-', '-C', dirname(output), '--', basename(output)], {
    stdio: ['ignore', archiveFd, 'inherit'],
    env: { ...process.env, COPYFILE_DISABLE: '1' },
  })
} finally {
  closeSync(archiveFd)
}
