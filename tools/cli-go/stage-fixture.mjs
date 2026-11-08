// Test fixture: build the stager's nativeDir input from one real host build.
// Foreign targets get inert placeholder images with complete, self-consistent
// records — the stager's manifest/installer checks run against real data
// while only the host payload is ever executed on this machine.
import assert from 'node:assert/strict'
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { createRequire } from 'node:module'
import { createHash } from 'node:crypto'
import { nativePlatforms, stageRelease } from './stage-release.mjs'

export const hostTarget = `${process.platform === 'win32' ? 'windows' : process.platform}-${
  process.arch === 'x64' ? 'amd64' : process.arch
}`

export const hostOsCpu = `${process.platform}-${process.arch}`

const binaryName = (target) => `xplat-go-${target}-cli${target.startsWith('windows') ? '.exe' : ''}`

/**
 * Copy the real host build into nativeDir and fabricate the remaining
 * targets' binaries, records, and archives around it. The worker directory
 * is the real release worker build.mjs produced.
 */
export function nativeFixture(root, hostBinary) {
  const host = JSON.parse(readFileSync(hostBinary + '.json'))
  assert.equal(host.target, hostTarget)
  assert.equal(host.cli, true)
  assert.equal(host.onnx, false, 'Production staging needs the core -cli build')
  const nativeDir = mkdtempSync(join(tmpdir(), 'xplat-native-'))
  cpSync(hostBinary, join(nativeDir, binaryName(hostTarget)))
  cpSync(hostBinary + '.json', join(nativeDir, binaryName(hostTarget) + '.json'))
  cpSync(hostBinary + '.tgz', join(nativeDir, binaryName(hostTarget) + '.tgz'))
  cpSync(join(root, 'research/go-cli/release-worker'), join(nativeDir, 'release-worker'), {
    recursive: true,
  })

  const notices = join(nativeDir, 'notices')
  mkdirSync(notices)
  writeFileSync(join(notices, 'LICENSE'), 'Test fixture license\n')
  writeFileSync(join(notices, 'THIRD-PARTY-NOTICES.txt'), 'Test fixture notices\n')
  for (const [, os, cpu] of nativePlatforms) {
    const target = `${os === 'win32' ? 'windows' : os}-${cpu === 'x64' ? 'amd64' : cpu}`
    if (target === hostTarget) {
      continue
    }

    const binary = join(nativeDir, binaryName(target))
    const bytes = Buffer.from(`inert fixture image for ${target}\n`)
    writeFileSync(binary, bytes, { mode: 0o755 })
    const archive = binary + '.tgz'
    const packed = spawnSync(
      'tar',
      ['-czf', archive, '-C', notices, 'LICENSE', 'THIRD-PARTY-NOTICES.txt'],
      {
        encoding: 'utf8',
      },
    )

    assert.equal(packed.status, 0, packed.stderr)
    const image = createHash('sha256').update(bytes).digest('hex')
    const tgz = readFileSync(archive)
    const record = {
      ...host,
      target,
      bytes: bytes.length,
      sha256: image,
      binary,
      download: {
        file: archive,
        bytes: tgz.length,
        sha256: createHash('sha256').update(tgz).digest('hex'),
      },
    }

    writeFileSync(binary + '.json', JSON.stringify(record, null, 2) + '\n')
  }
  rmSync(notices, { recursive: true, force: true })
  return nativeDir
}

/** Stage the actual host executable and inert foreign payloads for a consumer. */
export function stageHostCli(root, outputDir) {
  const nativeDir = nativeFixture(root, join(root, 'research/go-cli', binaryName(hostTarget)))
  try {
    return stageRelease({
      root,
      outputDir,
      nativeDir,
      ignoreScripts: true,
      version: JSON.parse(readFileSync(join(root, 'packages/cli/package.json'))).version,
    })
  } finally {
    rmSync(nativeDir, { recursive: true, force: true })
  }
}

/** File-tarball installs skip transitive hooks; perform the documented repair. */
export function repairPackedCli(app) {
  const require = createRequire(join(app, 'package.json'))
  const cli = dirname(require.resolve('@octane-xplat/cli/package.json'))
  const result = spawnSync(process.execPath, [join(cli, 'install-native.mjs')], {
    cwd: app,
    encoding: 'utf8',
  })
  assert.equal(result.status, 0, result.stdout + result.stderr)
}
