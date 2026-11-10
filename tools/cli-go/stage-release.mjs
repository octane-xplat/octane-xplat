// Production npm layout: @octane-xplat/cli plus one optional payload package
// per supported host. Used by scripts/publish-release.ts and every packaging
// gate — there is no other layout.
import assert from 'node:assert/strict'
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'

import { dirname, join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { placeholder } from '../../packages/cli/install-native.mjs'
import { sha256 } from './native-inputs.mjs'

// [Go target, npm os, npm cpu] — the same matrix cli-executables.yml builds.
export const nativePlatforms = [
  ['darwin-arm64', 'darwin', 'arm64'],
  ['darwin-amd64', 'darwin', 'x64'],
  ['linux-amd64', 'linux', 'x64'],
  ['linux-arm64', 'linux', 'arm64'],
  ['windows-amd64', 'win32', 'x64'],
]

export const nativePackageName = (osCpu) => `@octane-xplat/cli-native-${osCpu}`
export const nativePlatformPackages = nativePlatforms.map(([, os, cpu]) =>
  nativePackageName(`${os}-${cpu}`),
)

const goTarget = (os, cpu) => `${os === 'win32' ? 'windows' : os}-${cpu === 'x64' ? 'amd64' : cpu}`
const binaryName = (target) => `xplat-go-${target}-cli${target.startsWith('windows') ? '.exe' : ''}`

function pack(directory, destination, ignoreScripts = false) {
  const result = spawnSync(
    'bun',
    ['pm', 'pack', '--destination', destination, ...(ignoreScripts ? ['--ignore-scripts'] : [])],
    {
      cwd: directory,
      encoding: 'utf8',
      timeout: 60000,
    },
  )

  assert.equal(result.status, 0, `bun pm pack ${directory}: ${result.stdout}${result.stderr}`)
}

function notices(binary) {
  const files = {}

  for (const name of ['LICENSE', 'THIRD-PARTY-NOTICES.txt']) {
    const extracted = spawnSync('tar', ['-xOf', binary + '.tgz', name], { encoding: 'utf8' })

    assert.equal(extracted.status, 0, `${binary}.tgz: ${extracted.stderr}`)
    files[name] = extracted.stdout
  }

  return files
}

/** Read and validate one target's build outputs inside nativeDir. */
function targetBuild(root, nativeDir, target, version, reference) {
  const binary = join(nativeDir, binaryName(target))
  const build = JSON.parse(readFileSync(binary + '.json'))

  assert.equal(build.target, target, `${binary}.json`)
  assert.equal(build.cli, true, `${binary}.json: stage-release needs the core -cli build`)
  assert.equal(build.onnx, false, `${binary}.json: production payloads ship without ONNX`)
  assert.equal(build.cliVersion, version, `${binary}.json cliVersion`)

  const bytes = readFileSync(binary)

  assert.equal(sha256(bytes), build.sha256, `${binary}: checksum`)
  assert.equal(sha256(readFileSync(binary + '.tgz')), build.download.sha256, `${binary}.tgz`)
  assert.equal(readFileSync(binary + '.tgz').length, build.download.bytes, `${binary}.tgz`)
  if (reference) {
    assert.deepEqual(build.inputs, reference.inputs, `${binary}.json: mixed source inputs`)
    assert.deepEqual(
      build.releaseWorker,
      reference.releaseWorker,
      `${binary}.json: release workers differ across targets`,
    )
  }

  return { binary, build, bytes }
}

/**
 * Stage the publishable CLI tarball and its five native payload tarballs.
 * `nativeDir` holds the five `xplat-go-<target>-cli` binaries with their
 * `.json` records and `.tgz` archives plus a `release-worker/` directory.
 * `outputDir` must be a fresh owned directory; tarballs land inside it.
 */
export function stageRelease({ root, version, nativeDir, outputDir, ignoreScripts = false }) {
  mkdirSync(outputDir, { recursive: true })
  assert.equal(
    readdirSync(outputDir).length,
    0,
    `stageRelease needs an empty output directory: ${outputDir}`,
  )

  const builds = new Map()

  for (const [, os, cpu] of nativePlatforms) {
    const target = goTarget(os, cpu)

    builds.set(
      `${os}-${cpu}`,
      targetBuild(root, nativeDir, target, version, [...builds.values()][0]?.build),
    )
  }

  // Payload packages: one native image each, selected by the installer.
  const payloads = []
  const targets = {}

  for (const [, os, cpu] of nativePlatforms) {
    const npmTarget = `${os}-${cpu}`
    const { binary, build, bytes } = builds.get(npmTarget)
    const name = nativePackageName(npmTarget)
    const stage = join(outputDir, 'stage-' + npmTarget)

    mkdirSync(stage)
    writeFileSync(join(stage, 'xplat.exe'), bytes, { mode: 0o755 })
    for (const [file, content] of Object.entries(notices(binary))) {
      writeFileSync(join(stage, file), content)
    }

    const manifest = {
      name,
      version,
      description: `Native xplat executable for ${npmTarget} (installed by @octane-xplat/cli)`,
      license: 'MIT',
      repository: {
        type: 'git',
        url: 'https://github.com/octane-xplat/octane-xplat',
        directory: 'packages/cli',
      },
      os: [os],
      cpu: [cpu],
      files: ['xplat.exe', 'LICENSE', 'THIRD-PARTY-NOTICES.txt'],
      exports: { './package.json': './package.json' },
    }

    writeFileSync(join(stage, 'package.json'), JSON.stringify(manifest, null, 2) + '\n')
    pack(stage, outputDir)
    rmSync(stage, { recursive: true, force: true })

    const archive = join(outputDir, `${name.slice(1).replace('/', '-')}-${version}.tgz`)

    payloads.push({ manifest, archive, target: npmTarget })
    targets[npmTarget] = { package: name, bytes: bytes.length, sha256: build.sha256 }
  }

  // The release worker ships inside the CLI package; every target record
  // must describe the same worker (asserted above).
  const worker = [...builds.values()][0].build.releaseWorker

  assert.equal(worker.cliVersion, version)

  // Pack the workspace CLI first so prepack, files and catalog/workspace
  // resolution apply, then augment the extracted package and repack it.
  const packed = join(outputDir, 'packed')

  mkdirSync(packed)
  pack(join(root, 'packages/cli'), packed, ignoreScripts)

  const cliArchives = readdirSync(packed).filter((name) => name.endsWith('.tgz'))

  assert.equal(cliArchives.length, 1, `expected one CLI tarball in ${packed}`)

  const stage = join(outputDir, 'stage-cli')

  mkdirSync(stage)

  const extracted = spawnSync(
    'tar',
    ['-xzf', join(packed, cliArchives[0]), '-C', stage, '--strip-components=1'],
    { encoding: 'utf8' },
  )

  assert.equal(extracted.status, 0, extracted.stderr)
  rmSync(packed, { recursive: true, force: true })

  const manifestPath = join(stage, 'package.json')
  const pkg = JSON.parse(readFileSync(manifestPath))

  assert.equal(pkg.name, '@octane-xplat/cli')
  assert.equal(pkg.version, version, 'CLI manifest version must match the staged version')
  pkg.bin = { xplat: './bin/xplat.exe' }
  pkg.scripts = { ...pkg.scripts, postinstall: 'node install-native.mjs' }
  // The repack runs inside the staged tree, where build config is absent;
  // the tarball's contents are already final, so no build hooks belong.
  delete pkg.scripts.prepack
  delete pkg.scripts.postpack
  pkg.optionalDependencies = Object.fromEntries(
    nativePlatformPackages.map((name) => [name, version]),
  )

  for (const file of ['install-native.mjs', 'native-platforms.json', 'native-worker']) {
    if (!pkg.files.includes(file)) {
      pkg.files.push(file)
    }
  }

  // Reset even when the first pack skipped lifecycle hooks.
  writeFileSync(join(stage, 'bin/xplat.exe'), placeholder, { mode: 0o755 })
  writeFileSync(
    join(stage, 'native-platforms.json'),
    JSON.stringify({ version: 1, cliVersion: version, targets }, null, 2) + '\n',
  )

  const workerDir = join(nativeDir, 'release-worker')

  for (const [file, record] of Object.entries(worker.files)) {
    assert.ok(!file.split('/').some((part) => part === '..' || part === ''))
    assert.ok(!file.startsWith('/') && !file.includes('\\'))

    const bytes = readFileSync(join(workerDir, file))

    assert.equal(sha256(bytes), record.sha256, `release-worker/${file}`)
    assert.equal(bytes.length, record.bytes, `release-worker/${file}`)

    const output = join(stage, 'native-worker', file)

    mkdirSync(dirname(output), { recursive: true })
    writeFileSync(output, bytes)
  }

  writeFileSync(join(stage, 'native-worker/manifest.json'), JSON.stringify(worker))
  writeFileSync(manifestPath, JSON.stringify(pkg, null, 2) + '\n')
  pack(stage, outputDir)
  rmSync(stage, { recursive: true, force: true })

  const cliArchive = join(outputDir, `octane-xplat-cli-${version}.tgz`)

  return {
    version,
    cli: { manifest: pkg, archive: cliArchive },
    payloads,
    platforms: { version: 1, cliVersion: version, targets },
  }
}
