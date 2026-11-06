// Installation only. The installed xplat bin is the native executable itself.
import { createRequire } from 'node:module'
import { createHash } from 'node:crypto'
import {
  readFileSync,
  lstatSync,
  realpathSync,
  mkdtempSync,
  writeFileSync,
  chmodSync,
  renameSync,
  rmSync,
} from 'node:fs'

import { dirname, join } from 'node:path'

const root = import.meta.dirname
const pkg = JSON.parse(readFileSync(join(root, 'package.json')))
const manifest = JSON.parse(readFileSync(join(root, 'native-platforms.json')))
const target = `${process.platform}-${process.arch}`
const record = manifest.targets?.[target]
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

const bin = join(root, 'bin')
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
