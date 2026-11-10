// Installation only. The installed xplat bin is the native executable itself.
import { createRequire } from 'node:module'
import { createHash } from 'node:crypto'
import {
  readFileSync,
  existsSync,
  mkdirSync,
  lstatSync,
  realpathSync,
  mkdtempSync,
  writeFileSync,
  chmodSync,
  renameSync,
  rmSync,
} from 'node:fs'

import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = import.meta.dirname

// No shebang: Windows package managers must create native executable shims.
export const placeholder =
  'echo "xplat native executable is not installed. Allow install scripts for octane-xplat and @octane-xplat/cli, then reinstall. Or run node node_modules/octane-xplat/install-native.mjs (direct CLI: node node_modules/@octane-xplat/cli/install-native.mjs)." >&2\nexit 1\n'

function payload() {
  // Workspace installation precedes compilation. Only a host core build may
  // prepare local commands; cross-builds and ONNX builds must not replace them.
  if (existsSync(join(root, 'go/go.mod'))) {
    const os = process.platform === 'win32' ? 'windows' : process.platform
    const arch = process.arch === 'x64' ? 'amd64' : process.arch
    const binary = resolve(
      root,
      `../../research/go-cli/xplat-go-${os}-${arch}-cli${os === 'windows' ? '.exe' : ''}`,
    )

    return existsSync(binary) ? readFileSync(binary) : null
  }

  const pkg = JSON.parse(readFileSync(join(root, 'package.json')))
  const manifest = JSON.parse(readFileSync(join(root, 'native-platforms.json')))
  const target = `${process.platform}-${process.arch}`
  const record = manifest.targets?.[target]

  if (manifest.version === 1 && manifest.cliVersion === pkg.version && !record) {
    // Keep JS exports installable even on hosts without a native payload.
    console.error(
      `xplat has no native executable for ${target}; supported: ${Object.keys(
        manifest.targets ?? {},
      ).join(', ')}`,
    )

    return null
  }

  if (manifest.version !== 1 || manifest.cliVersion !== pkg.version || !record) {
    throw new Error(`This CLI package has no native executable for ${target}.`)
  }

  if (
    record.package !== `@octane-xplat/cli-native-${target}` ||
    pkg.optionalDependencies?.[record.package] !== pkg.version ||
    !Number.isSafeInteger(record.bytes) ||
    record.bytes <= 0 ||
    record.bytes > 32 << 20 ||
    !/^[a-f0-9]{64}$/.test(record.sha256)
  ) {
    throw new Error('Invalid native CLI package manifest; reinstall this release.')
  }

  let sourceRoot

  try {
    sourceRoot = dirname(
      realpathSync(createRequire(import.meta.url).resolve(record.package + '/package.json')),
    )
  } catch {
    throw new Error(
      `Missing ${record.package}@${pkg.version}. Reinstall @octane-xplat/cli with optional dependencies enabled, then run its install-native.mjs with Node.`,
    )
  }

  const sourcePackage = JSON.parse(readFileSync(join(sourceRoot, 'package.json')))

  if (sourcePackage.name !== record.package || sourcePackage.version !== pkg.version) {
    throw new Error('Native CLI package version mismatch; reinstall this release.')
  }

  const source = join(sourceRoot, 'xplat.exe')
  const info = lstatSync(source)

  if (!info.isFile() || info.size !== record.bytes) {
    throw new Error('Native CLI executable must match its ordinary-file inventory.')
  }

  const bytes = readFileSync(source)

  if (
    bytes.length !== record.bytes ||
    createHash('sha256').update(bytes).digest('hex') !== record.sha256
  ) {
    throw new Error('Native CLI checksum mismatch; reinstall this release.')
  }

  return bytes
}

export function installNative(destination = root, prepare = false) {
  const bytes = prepare ? placeholder : (payload() ?? placeholder)
  const bin = join(destination, 'bin')

  mkdirSync(bin, { recursive: true })

  if (!lstatSync(bin).isDirectory()) {
    throw new Error('Native CLI bin directory must be an ordinary directory.')
  }

  const stage = mkdtempSync(join(bin, '.install-'))

  try {
    const image = join(stage, 'xplat.exe')

    writeFileSync(image, bytes, { flag: 'wx', mode: 0o755 })
    chmodSync(image, 0o755)
    renameSync(image, join(bin, 'xplat.exe'))
  } finally {
    rmSync(stage, { recursive: true, force: true })
  }
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  installNative(root, process.argv.includes('--prepare-package'))
}
