#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs'

import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const revision = 'f65113a6f1fed7c9737ce85f5ae7ddc5caa5723d'
const upstreamHash = 'e713f05d3e80e7c14076c72df805cdd366819ea308a0d333bd3364eb76e19cc3'
const patchedHash = '1049967fb0ba5a80e3822bcf763a980fc294275d5a436a975b4d528289f27492'
const audioPath = 'Sources/Pulsar/Audio/AudioSimulator.swift'
const hash = (source) => createHash('sha256').update(source).digest('hex')

// Pin both the package revision and exact patch input. An upstream change must
// be reviewed rather than silently accepting a partially applied workaround.
export function silenceAudioSimulator(source) {
  if (hash(source) !== upstreamHash) {
    throw new Error('Unexpected Pulsar AudioSimulator source; refusing to patch')
  }
  return (
    source
      .replace(/    #if DEBUG\n[\s\S]*?    #endif\n/, '    self._playSound = false\n')
      .replace('    if (isSimulatorDevice) {\n      self._playSound = true\n    }\n', '')
      .replace(
        '        self.deactivateAudioSession()',
        '        if self.isEngineConfigured { self.deactivateAudioSession() }',
      ) +
    `
// Xplat's bridge requires this factory so an unpatched remote package fails to
// compile rather than silently retaining the shared audio-session side effect.
public extension Pulsar {
  static func xplatSilent() -> Pulsar {
    let instance = Pulsar()
    instance.enableSound(state: false)
    return instance
  }
}
`
  )
}

export function preparePulsar(destination) {
  const target = resolve(destination)
  const marker = join(target, '.xplat-silent-pulsar.json')
  const validate = () => {
    const stamp = JSON.parse(readFileSync(marker, 'utf8'))
    if (
      stamp.revision !== revision ||
      stamp.patch !== 1 ||
      stamp.audioHash !== patchedHash ||
      patchedHash !== hash(readFileSync(join(target, audioPath)))
    ) {
      throw new Error(
        `Pulsar cache differs from the prepared source: ${target}. Choose a fresh destination.`,
      )
    }
    return target
  }
  if (existsSync(target)) {
    return validate()
  }
  mkdirSync(dirname(target), { recursive: true })
  const temporary = mkdtempSync(join(dirname(target), '.pulsar-'))
  const checkout = join(temporary, 'package')
  try {
    execFileSync(
      'git',
      [
        'clone',
        '--quiet',
        '--depth',
        '1',
        '--branch',
        '1.4.0',
        'https://github.com/software-mansion-labs/pulsar-ios',
        checkout,
      ],
      { stdio: ['ignore', 'ignore', 'pipe'], timeout: 120_000 },
    )

    const actual = execFileSync('git', ['-C', checkout, 'rev-parse', 'HEAD'], {
      encoding: 'utf8',
    }).trim()

    if (actual !== revision) {
      throw new Error('Pulsar 1.4.0 revision changed; refusing to patch')
    }

    const audio = join(checkout, audioPath)
    const patched = silenceAudioSimulator(readFileSync(audio, 'utf8'))
    writeFileSync(audio, patched)
    rmSync(join(checkout, '.git'), { recursive: true })
    writeFileSync(
      join(checkout, '.xplat-silent-pulsar.json'),
      JSON.stringify({ revision, patch: 1, audioHash: hash(patched) }),
    )

    try {
      renameSync(checkout, target)
    } catch (error) {
      // Concurrent preparations can publish only a complete, validated package.
      if (!existsSync(target)) {
        throw error
      }
    }

    return validate()
  } finally {
    rmSync(temporary, { recursive: true, force: true })
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    console.log(preparePulsar(process.argv[2] ?? '.xplat/pulsar-ios'))
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
