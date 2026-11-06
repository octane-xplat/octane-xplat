import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { preparePulsar, silenceAudioSimulator } from '../scripts/prepare-ios.mjs'

const upstream = readFileSync(
  new URL('./fixtures/AudioSimulator-1.4.0.swift', import.meta.url),
  'utf8',
)

test('the pinned upstream input is patched for silent Debug and simulator initialization', () => {
  const patched = silenceAudioSimulator(upstream)
  assert.match(patched, /self\._playSound = false/)
  assert.doesNotMatch(patched, /self\._playSound = true/)
  assert.match(patched, /if self\.isEngineConfigured \{ self\.deactivateAudioSession\(\) \}/)
  assert.throws(() => silenceAudioSimulator(upstream + '\n'), /Unexpected Pulsar/)
})

test('preparation reuses a validated offline cache and refuses to overwrite modified work', () => {
  const target = mkdtempSync(join(tmpdir(), 'xplat-pulsar-test-'))
  try {
    const directory = join(target, 'Sources/Pulsar/Audio')
    mkdirSync(directory, { recursive: true })
    const patched = silenceAudioSimulator(upstream)
    const file = join(directory, 'AudioSimulator.swift')
    writeFileSync(file, patched)
    writeFileSync(
      join(target, '.xplat-silent-pulsar.json'),
      JSON.stringify({
        revision: 'f65113a6f1fed7c9737ce85f5ae7ddc5caa5723d',
        patch: 1,
        audioHash: createHash('sha256').update(patched).digest('hex'),
      }),
    )

    assert.equal(preparePulsar(target), target)
    writeFileSync(file, 'local work')
    assert.throws(() => preparePulsar(target), /Choose a fresh destination/)
    assert.equal(readFileSync(file, 'utf8'), 'local work')
  } finally {
    rmSync(target, { recursive: true, force: true })
  }
})
