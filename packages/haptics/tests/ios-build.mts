// Build evidence only: this does not qualify audible or physical device output.
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readdirSync, rmSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { verifyNativeConfig } from './native-config.mts'

if (process.platform !== 'darwin') {
  throw new Error('iOS build qualification requires macOS and Xcode')
}

const self = fileURLToPath(import.meta.url)

if (!process.argv.includes('--reserved')) {
  execFileSync(
    'goddard-agent',
    [
      'resource',
      'run',
      '--json',
      JSON.stringify({
        resources: { native_builds: 1 },
        purpose: 'Build patched Pulsar and haptics bridge for iOS',
      }),
      '--',
      process.execPath,
      self,
      '--reserved',
    ],
    { stdio: 'inherit' },
  )
} else {
  const scratch = join(homedir(), 'agent-scratch/octane-xplat/haptics-auto-ios')

  mkdirSync(scratch, { recursive: true })

  const work = mkdtempSync(join(scratch, 'build-'))

  try {
    const packageRoot = fileURLToPath(new URL('..', import.meta.url))
    const pack = join(work, 'pack')
    const extracted = join(work, 'extracted')

    mkdirSync(pack)
    mkdirSync(extracted)
    execFileSync('bun', ['pm', 'pack', '--ignore-scripts', '--destination', pack], {
      cwd: packageRoot,
      stdio: 'inherit',
    })

    const archive = readdirSync(pack).find((name) => name.endsWith('.tgz'))

    execFileSync('tar', ['-xzf', join(pack, archive), '-C', extracted])

    const installed = join(extracted, 'package')
    const pulsar = await verifyNativeConfig(installed)
    const swiftFiles = (directory) =>
      readdirSync(directory, { withFileTypes: true }).flatMap((entry) =>
        entry.isDirectory()
          ? swiftFiles(join(directory, entry.name))
          : entry.name.endsWith('.swift')
            ? [join(directory, entry.name)]
            : [],
      )

    const sdk = execFileSync('xcrun', ['--sdk', 'iphonesimulator', '--show-sdk-path'], {
      encoding: 'utf8',
    }).trim()

    const flags = ['-sdk', sdk, '-target', 'arm64-apple-ios13.0-simulator', '-swift-version', '6']

    for (const debug of [true, false]) {
      const output = join(work, debug ? 'Debug' : 'Release')

      mkdirSync(output)

      const mode = debug ? ['-D', 'DEBUG'] : []

      execFileSync(
        'xcrun',
        [
          'swiftc',
          ...flags,
          ...mode,
          '-emit-module',
          '-module-name',
          'Pulsar',
          '-emit-module-path',
          join(output, 'Pulsar.swiftmodule'),
          ...swiftFiles(join(pulsar, 'Sources')),
        ],
        { stdio: 'inherit' },
      )

      execFileSync(
        'xcrun',
        [
          'swiftc',
          ...flags,
          ...mode,
          '-typecheck',
          '-I',
          output,
          resolve(installed, 'platforms/ios/src/XplatPulsarBridge.swift'),
        ],
        { stdio: 'inherit' },
      )

      console.log(
        `Patched Pulsar and bridge: ${debug ? 'Debug' : 'Release'} iOS arm64 simulator compile passed`,
      )
    }
  } finally {
    rmSync(work, { recursive: true, force: true })
  }
}
