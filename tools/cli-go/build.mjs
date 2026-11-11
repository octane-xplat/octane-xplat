import assert from 'node:assert/strict'
import {
  readFileSync,
  readdirSync,
  writeFileSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  existsSync,
  statSync,
  cpSync,
} from 'node:fs'

import { resolve, join, dirname } from 'node:path'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { gzipSync } from 'node:zlib'

import { installNative } from '../../packages/cli/install-native.mjs'

import { nativeInputs } from './native-inputs.mjs'
import { buildReleaseWorker } from './release-worker.mjs'

const root = resolve(import.meta.dirname, '../..')
const work = join(root, 'research/go-cli')
const moduleDirectory = join(root, 'packages/cli/go')

mkdirSync(work, { recursive: true })

const flags = process.argv.slice(2)

assert.ok(
  flags.every((value) =>
    ['--test', '--test-binary', '--onnx', '--cli', '--test-dev-server-race'].includes(value),
  ),
)

const onnx = flags.includes('--onnx')
const cli = flags.includes('--cli')
const testBinary = flags.includes('--test-binary')
const devServerRace = flags.includes('--test-dev-server-race')

assert.ok(
  !devServerRace || flags.length === 1,
  'Race qualification is a host-only standalone test mode',
)

const tags = onnx ? ['onnx'] : []
const sourceVersion = JSON.parse(readFileSync(join(root, 'packages/cli/package.json'))).version

assert.equal(
  sourceVersion,
  JSON.parse(readFileSync(join(root, 'packages/create/compatibility.json'))).frameworkVersion,
  'Synchronize CLI/framework source versions',
)

// The CLI publishes at the lockstep version like every other package.
const version = process.env.XPLAT_GO_VERSION ?? sourceVersion

assert.equal(version, sourceVersion, 'Native CLI builds pin the lockstep package version')

const embedded = JSON.parse(
  readFileSync(join(root, 'packages/cli/go/internal/assets/catalog.json')),
)

assert.equal(
  embedded.catalog.cli.version,
  sourceVersion,
  'bump-versions.ts must keep catalog cli.version in sync',
)

assert.equal(
  embedded.version,
  sourceVersion,
  'bump-versions.ts must keep the catalog release version in sync',
)

const releaseWorker = cli ? buildReleaseWorker(root, join(work, 'release-worker'), version) : null

const zig = onnx && process.env.CC?.startsWith('zig ')
const env = {
  ...process.env,
  GOTOOLCHAIN: 'local',
  GOENV: 'off',
  GOWORK: 'off',
  GOCACHE: join(work, 'build-cache'),
  GOMODCACHE: join(work, 'module-cache'),
  CGO_ENABLED: onnx || devServerRace ? '1' : '0',
  ZIG_GLOBAL_CACHE_DIR: join(work, 'zig-global-cache'),
  ZIG_LOCAL_CACHE_DIR: join(work, 'zig-local-cache'),
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: moduleDirectory,
    env,
    encoding: 'utf8',
    ...options,
  })

  assert.equal(
    result.status,
    0,
    `${command} ${args.join(' ')}\n${result.stdout ?? ''}${result.stderr ?? ''}${result.error?.message ?? ''}`,
  )

  return result.stdout
}

assert.match(
  run('go', ['version']),
  /^go version go1\.27\.3 /,
  'Install the pinned Go 1.27.3 compiler',
)

if (zig) {
  assert.equal(
    run('zig', ['version']).trim(),
    '0.17.0',
    'Use the pinned Zig 0.17.0 C cross-compiler',
  )
}

// The command catalog is checked in at packages/cli/go/internal/assets/catalog.json (embedded
// via //go:embed); edit it deliberately rather than regenerating it here.
writeFileSync(
  join(moduleDirectory, 'internal/assets/native-assets.json'),
  readFileSync(join(import.meta.dirname, 'native-assets.json')),
)

run('go', ['mod', 'download'], { stdio: 'inherit' })
if (flags.includes('--test') || devServerRace) {
  run(
    'go',
    [
      'test',
      '-count=1',
      ...(devServerRace ? ['-race', '-run=^TestDev(Server|App|Jobs)'] : []),
      '-mod=readonly',
      ...(tags.length ? ['-tags=' + tags.join(',')] : []),
      './...',
    ],
    {
      stdio: 'inherit',
    },
  )
} else {
  const target = `${env.GOOS ?? (process.platform === 'win32' ? 'windows' : process.platform)}-${env.GOARCH ?? (process.arch === 'x64' ? 'amd64' : process.arch)}`
  const binary = join(
    work,
    `${testBinary ? 'go-tests' : 'xplat-go'}-${target}${cli ? '-cli' : ''}${onnx ? '-onnx' : ''}${testBinary ? '' : target.startsWith('windows') ? '.exe' : ''}`,
  )

  const sha = (bytes) => createHash('sha256').update(bytes).digest('hex')
  const inputs = () => nativeInputs(root)
  const before = inputs()

  if (testBinary && existsSync(binary) && !statSync(binary).isDirectory()) {
    rmSync(binary)
  }

  run(
    'go',
    [
      ...(testBinary ? ['test', '-c'] : ['build']),
      '-mod=readonly',
      '-trimpath',
      '-buildvcs=false',
      '-ldflags=-s -w',
      ...(tags.length ? ['-tags=' + tags.join(',')] : []),
      '-o',
      testBinary ? binary + '/' : binary,
      ...(testBinary ? ['./...'] : cli ? ['.'] : ['./cmd/probe']),
    ],
    { stdio: 'inherit' },
  )

  assert.deepEqual(inputs(), before, 'Source changed during build')
  if (testBinary) {
    const suffix = target.startsWith('windows') ? '.test.exe' : '.test'
    const packageDirs = {}

    for (const line of run('go', ['list', '-f', '{{.Dir}}', './...']).trim().split('\n')) {
      const normalized = line.replaceAll('\\', '/')
      const prefix = moduleDirectory.replaceAll('\\', '/')
      const relative = normalized === prefix ? '.' : normalized.replace(prefix + '/', '')

      packageDirs[normalized.split('/').pop()] = relative
    }

    const binaries = {}

    for (const file of readdirSync(binary).sort()) {
      if (!file.endsWith(suffix)) {
        continue
      }

      const directory = file.slice(0, -suffix.length)
      const packages = packageDirs[directory] ? [packageDirs[directory]] : []
      const bytes = readFileSync(join(binary, file))

      binaries[file] = {
        bytes: bytes.length,
        sha256: sha(bytes),
        directory: packages.length === 1 ? packages[0] : directory,
      }
    }

    const record = {
      version: 2,
      kind: 'test-executable',
      compiler: run('go', ['version']).trim(),
      target,
      sourceCommit: spawnSync('git', ['rev-parse', 'HEAD'], {
        cwd: root,
        encoding: 'utf8',
      }).stdout.trim(),
      inputs: before,
      binaries,
      binary,
    }

    writeFileSync(binary + '.json', JSON.stringify(record, null, 2) + '\n')
    console.log(JSON.stringify({ ...record, inputs: undefined }))
    process.exit(0)
  }

  const bytes = readFileSync(binary)

  const stage = mkdtempSync(join(work, 'download-'))
  let download

  try {
    const executable = target.startsWith('windows') ? 'xplat-go.exe' : 'xplat-go'

    writeFileSync(join(stage, executable), bytes, { mode: 0o755 })

    const goroot = run('go', ['env', 'GOROOT']).trim()
    const goLicense = existsSync(join(goroot, 'LICENSE'))
      ? join(goroot, 'LICENSE')
      : join(dirname(goroot), 'LICENSE')

    const notices = ['Go standard library\n' + readFileSync(goLicense, 'utf8')]

    notices.push(
      readFileSync(join(moduleDirectory, 'NOTICE.txt'), 'utf8'),
      readFileSync(join(moduleDirectory, 'licenses/tokenizers-js.txt'), 'utf8'),
    )

    for (const [name, version, license] of [
      ['github.com/coder/websocket', 'v1.8.15', 'LICENSE.txt'],
      ['golang.org/x/sys', 'v0.49.0', 'LICENSE'],
      ['golang.org/x/text', 'v0.43.0', 'LICENSE'],
      ['github.com/tailscale/hujson', 'v0.0.0-20260727124030-b80ff77dac4f', 'LICENSE'],
      ['go.yaml.in/yaml/v3', 'v3.0.6', 'LICENSE'],
      ['go.yaml.in/yaml/v3', 'v3.0.6', 'NOTICE'],
      ...(onnx ? [['github.com/yalue/onnxruntime_go', 'v1.38.0', 'LICENSE']] : []),
    ]) {
      notices.push(
        name +
          '@' +
          version +
          '\n' +
          readFileSync(join(env.GOMODCACHE, name + '@' + version, license), 'utf8'),
      )
    }

    writeFileSync(join(stage, 'THIRD-PARTY-NOTICES.txt'), notices.join('\n\n'))
    writeFileSync(join(stage, 'LICENSE'), readFileSync(join(root, 'LICENSE')))
    writeFileSync(
      join(stage, 'README.txt'),
      'Experimental bounded Go CLI feasibility probe, not the production CLI.\nNo Node/Bun or old CLI runtime is bundled. Release upgrade policy and its small Node dependencies are included. Project build engines and ONNX/model assets are separate.\n',
    )

    if (cli) {
      cpSync(join(work, 'release-worker'), join(stage, 'native-worker'), { recursive: true })
      writeFileSync(
        join(stage, 'package.json'),
        JSON.stringify({ name: '@octane-xplat/cli', version }),
      )
    }

    const archive = binary + '.tgz'

    run(
      'tar',
      [
        '--no-xattrs',
        '-czf',
        archive,
        '-C',
        stage,
        executable,
        'THIRD-PARTY-NOTICES.txt',
        'LICENSE',
        'README.txt',
        ...(cli ? ['package.json', 'native-worker'] : []),
      ],
      { env: { ...env, COPYFILE_DISABLE: '1' } },
    )

    const packed = readFileSync(archive)

    download = { file: archive, bytes: packed.length, sha256: sha(packed) }
  } finally {
    rmSync(stage, { recursive: true, force: true })
  }

  const record = {
    version: 2,
    cli,
    cliVersion: version,
    compiler: run('go', ['version']).trim(),
    target,
    onnx,
    cCompiler: onnx ? (env.CC ?? 'host default') : null,
    zigVersion: zig ? '0.17.0' : null,
    sourceCommit: spawnSync('git', ['rev-parse', 'HEAD'], {
      cwd: root,
      encoding: 'utf8',
    }).stdout.trim(),
    inputs: before,
    bytes: bytes.length,
    gzipBytes: gzipSync(bytes, { level: 6 }).length,
    sha256: sha(bytes),
    binary,
    download,
    releaseWorker,
  }

  writeFileSync(binary + '.json', JSON.stringify(record, null, 2) + '\n')
  if (
    cli &&
    !onnx &&
    target ===
      `${process.platform === 'win32' ? 'windows' : process.platform}-${process.arch === 'x64' ? 'amd64' : process.arch}`
  ) {
    installNative(join(root, 'packages/cli'))
    installNative(join(root, 'packages/toolchain'))
  }

  console.log(JSON.stringify(record))
}
