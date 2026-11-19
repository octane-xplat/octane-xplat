import { createHash } from 'node:crypto'
import {
  chmodSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join } from 'node:path'
import { installedPackageRoot } from '../package-root.ts'

const machines = { aarch64: 183, x86_64: 62 } as const
export type GtkRuntimeArchitecture = keyof typeof machines | 'universal'

export function installedGtkRuntimeRoot(appRoot: string) {
  const renderer = installedPackageRoot(appRoot, '@octane-xplat/linux-gtk')
  if (!renderer) return null
  const source = join(renderer, 'platforms/linux/runtime')
  return hasRuntimeDirectory(source) ? source : null
}

export function stageInstalledGtkRuntime(appRoot: string, destination: string) {
  const source = installedGtkRuntimeRoot(appRoot)
  if (!source) {
    throw new Error('Linux GTK requires the NativeScript runtime payloads. Install a matching release of @octane-xplat/linux-gtk or stage the pinned payloads in a source checkout.')
  }

  mkdirSync(destination)
  for (const architecture of ['x86_64', 'aarch64'] as const) {
    const input = join(source, architecture)
    if (
      !hasRuntimeDirectory(input) ||
      stageGtkRuntime(input, join(destination, architecture)) !== architecture
    ) {
      throw new Error(`Installed GTK runtime is missing the ${architecture} payload`)
    }
  }
  const x86Schema = readFileSync(join(destination, 'x86_64/gi.json'))
  if (!x86Schema.equals(readFileSync(join(destination, 'aarch64/gi.json')))) {
    throw new Error('Installed GTK runtimes must use the same GI schema')
  }
}

function hasRuntimeDirectory(path: string): boolean {
  const info = lstatSync(path, { throwIfNoEntry: false })
  if (!info) return false
  if (!info.isDirectory() || realpathSync(path) !== path) {
    throw new Error(`GTK runtime payload must be an ordinary directory: ${path}`)
  }
  return true
}

export function stageGtkRuntime(sourcePath: string, destination: string): 'aarch64' | 'x86_64' {
  const source = realpathSync(sourcePath)
  const manifestPath = join(source, 'manifest.json')
  if (!lstatSync(manifestPath).isFile())
    throw new Error('GTK runtime manifest must be a regular file')
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  const { architecture, files } = manifest ?? {}
  if (
    manifest?.version !== 1 ||
    (architecture !== 'aarch64' && architecture !== 'x86_64') ||
    !files ||
    typeof files !== 'object' ||
    Array.isArray(files)
  ) {
    throw new Error('Invalid GTK runtime payload manifest')
  }

  const libraries = ['lib/libmason_c.so', 'lib/libxplatmason-gtk.so']
  for (const name of [
    'ns-linux',
    'gi.json',
    'icu/icudt77l.dat',
    `metadata-${architecture}.bin`,
    'metadata/mason.bin',
    'metadata/xplatmason.bin',
    'metadata/gtk-matrix.bin',
    'metadata/webkit.bin',
    'typings/index.d.ts',
    ...libraries,
  ]) {
    if (!Object.hasOwn(files, name)) throw new Error(`GTK runtime payload is missing ${name}`)
  }

  mkdirSync(destination)
  for (const [name, hash] of Object.entries(files)) {
    if (
      !name
        .split('/')
        .every((part) => /^[A-Za-z0-9_!.-]+$/.test(part) && part !== '.' && part !== '..') ||
      name === 'manifest.json' ||
      typeof hash !== 'string' ||
      !/^[0-9a-f]{64}$/.test(hash)
    ) {
      throw new Error(`Invalid GTK runtime manifest entry: ${name}`)
    }
    const input = join(source, name)
    if (!lstatSync(input).isFile() || realpathSync(input) !== input) {
      throw new Error(`GTK runtime payload must contain a regular file: ${name}`)
    }
    const bytes = readFileSync(input)
    if (!bytes.length || createHash('sha256').update(bytes).digest('hex') !== hash) {
      throw new Error(`GTK runtime payload checksum mismatch: ${name}`)
    }
    if (
      (name === 'ns-linux' || libraries.includes(name)) &&
      (bytes.subarray(0, 6).toString('hex') !== '7f454c460201' ||
        bytes.length < 20 ||
        bytes.readUInt16LE(18) !== machines[architecture])
    ) {
      throw new Error(`Expected a ${architecture} Linux ELF file: ${name}`)
    }
    const output = join(destination, name)
    mkdirSync(dirname(output), { recursive: true })
    writeFileSync(output, bytes, { flag: 'wx' })
    if (name === 'ns-linux') chmodSync(output, 0o755)
  }
  writeFileSync(join(destination, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n', {
    flag: 'wx',
  })
  return architecture
}

export function writeGtkRuntimeLauncher(
  appDir: string,
  launcher: string,
  bundle: string,
  architecture: GtkRuntimeArchitecture = 'x86_64',
) {
  const bundleArg = "'" + bundle.replaceAll("'", "'\\''") + "'"
  const launcherPath = join(appDir, launcher)
  writeFileSync(join(appDir, 'package.json'), '{"type":"module"}\n', { flag: 'wx' })
  writeFileSync(
    launcherPath,
    `#!/bin/sh
set -eu
APP_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
RUNTIME="$APP_DIR/runtime"
${
  architecture === 'universal'
    ? `case "$(uname -m)" in
  x86_64) RUNTIME="$RUNTIME/x86_64" ;;
  aarch64) RUNTIME="$RUNTIME/aarch64" ;;
  *) echo "This app supports x86_64 and aarch64 Linux." >&2; exit 1 ;;
esac
`
    : ''
}export ICU_DATA="$RUNTIME/icu"
exec "$RUNTIME/ns-linux" "$APP_DIR"/${bundleArg} "$@"
`,
    { flag: 'wx' },
  )
  chmodSync(launcherPath, 0o755)
}
