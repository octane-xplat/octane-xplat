// Build evidence only: this does not qualify audible or physical device output.
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { preparePulsar } from '../scripts/prepare-ios.mjs'

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
  const scratch = join(homedir(), 'agent-scratch/octane-xplat/crisp-cricket/ios-haptics')
  mkdirSync(scratch, { recursive: true })
  const work = mkdtempSync(join(scratch, 'build-'))
  const pulsar = preparePulsar(join(work, 'Pulsar'))
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
        resolve(
          fileURLToPath(new URL('../platforms/ios/src/XplatPulsarBridge.swift', import.meta.url)),
        ),
      ],
      { stdio: 'inherit' },
    )
    console.log(
      `Patched Pulsar and bridge: ${debug ? 'Debug' : 'Release'} iOS arm64 simulator compile passed`,
    )
  }
}
