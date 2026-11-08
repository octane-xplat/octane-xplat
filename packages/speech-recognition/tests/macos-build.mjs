// Arm64-only mirror of buildMacOSNative's per-leaf steps, used by the macOS
// verification scripts because the shared pipeline's hardcoded 180 s
// generator timeout kills the full-SDK metadata scan on this machine's
// macOS 27 SDK (tool exits SIGTERM mid-scan). Same compile/link/generator
// invocations as cli/src/macos/native.ts, minus the x86_64 half — these
// fixtures only ever run on the build host's own architecture.
import { execFile } from 'node:child_process'
import { mkdir, mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, extname, join } from 'node:path'
import { promisify } from 'node:util'
import { inspectMacOSNative } from '../../cli/src/macos/native.ts'

const execute = promisify(execFile)

const run = async (command, args, stage, env = process.env) => {
  try {
    const result = await execute(command, args, {
      timeout: 900_000,
      maxBuffer: 64 * 1024 * 1024,
      env,
    })

    return result.stdout.trim()
  } catch (error) {
    throw new Error(
      `[macos-speech-build] ${stage}: ${command} exited ${error.code ?? error.signal ?? 'unsuccessfully'}\n${(error.stderr ?? error.message).slice(-4000)}`,
    )
  }
}

export async function buildMacOSSpeechArm64(appRoot) {
  const inspection = await inspectMacOSNative(appRoot)
  const { leaves, prebuilt, toolchain } = inspection
  const minimumSystemVersion = '13.5'
  const arch = 'arm64'
  const target = `${arch}-apple-macos${minimumSystemVersion}`

  const staging = await mkdtemp(join(tmpdir(), 'xplat-speech-native-'))
  const libraries = []
  const headers = []

  for (const leaf of leaves) {
    const outputName = `${leaf.id}.dylib`
    const objects = []
    const includePaths = [
      ...new Set([leaf.nativeRoot, ...leaf.headers.map(dirname), ...leaf.includePaths]),
    ]

    const common = [
      '-target',
      target,
      '-isysroot',
      toolchain.sdk,
      '-O2',
      '-fPIC',
      ...includePaths.flatMap((path) => ['-I', path]),
      ...leaf.defines.map((define) => `-D${define}`),
    ]

    for (const [index, source] of leaf.sources.entries()) {
      if (extname(source) === '.swift' || extname(source) === '.zig') {
        throw new Error(`unsupported source kind for this fixture: ${source}`)
      }

      const object = join(staging, `${leaf.id}-${index}.o`)
      await run(
        toolchain.clang,
        [
          ...common,
          ...(extname(source) === '.m' || extname(source) === '.mm' ? ['-fobjc-arc'] : []),
          '-c',
          source,
          '-o',
          object,
        ],
        `${leaf.name}: compile`,
      )

      objects.push(object)
    }

    await run(
      toolchain.clang,
      [
        '-dynamiclib',
        ...common,
        ...objects,
        ...leaf.frameworks.flatMap((name) => ['-framework', name]),
        ...leaf.libraries.map((name) => `-l${name}`),
        '-Wl,-install_name',
        `-Wl,@rpath/${outputName}`,
        '-Wl,-rpath,@loader_path',
        '-o',
        join(staging, outputName),
      ],
      `${leaf.name}: link dylib`,
    )

    libraries.push({ name: leaf.name, file: outputName })
    headers.push(...leaf.headers)
  }

  await mkdir(join(staging, 'types'), { recursive: true })
  await mkdir(join(staging, 'json'), { recursive: true })
  const includeArgs = [
    ...new Set([...headers.map(dirname), ...leaves.flatMap((leaf) => leaf.includePaths)]),
  ].map((path) => `include=${path}`)

  const generatorEnv = {
    ...process.env,
    PATH: `${dirname(toolchain.clang)}:${process.env.PATH ?? ''}`,
  }

  await run(
    toolchain.generator,
    [
      `types=${join(staging, 'types')}`,
      `json=${join(staging, 'json')}`,
      ...headers.map((path) => `leaf-import=${JSON.stringify(path)}`),
      ...includeArgs,
      '-output-bin',
      join(staging, 'metadata.arm64.nsmd'),
      '-output-umbrella',
      join(staging, 'umbrella.arm64.h'),
      'Xclang',
      '-isysroot',
      toolchain.sdk,
      '-target',
      target,
      ...leaves.flatMap((leaf) => leaf.defines.map((define) => `-D${define}`)),
      ...[...new Set(leaves.flatMap((leaf) => leaf.includePaths))].flatMap((path) => ['-I', path]),
    ],
    'generate combined SDK and leaf metadata (arm64)',
    generatorEnv,
  )

  return {
    leaves: leaves.map((leaf) => leaf.name),
    libraries,
    prebuilt,
    directory: staging,
    metadata: { arm64: join(staging, 'metadata.arm64.nsmd') },
  }
}
