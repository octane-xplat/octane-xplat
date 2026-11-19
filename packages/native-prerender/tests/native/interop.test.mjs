import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import test from 'node:test'
import { fixture, treesFixture, expected, resign } from '../fixture.mjs'
import {
  validateArtifact,
  projectVisualTree,
  checkLaunchEnvironment,
  selectLaunchTree,
} from '../../src/index.ts'
import { encodeStartupArtifact, decodeStartupArtifact } from '../../src/codec.ts'

const readers = JSON.parse(process.env.XPLAT_PRERENDER_NATIVE_READERS ?? 'null')
const work = process.env.XPLAT_PRERENDER_NATIVE_WORK
assert.ok(readers?.length && work, 'Use the reserved test:codec:native Turbo task')
let sequence = 0
const plain = (value) => JSON.parse(JSON.stringify(value))
function invoke(reader, bytes, identity = expected, extra = []) {
  const path = join(work, 'input-' + sequence++ + '.bin')
  writeFileSync(path, bytes)
  return spawnSync(
    reader.program,
    [...reader.args, path, identity.build, identity.platform, ...extra],
    {
      encoding: 'utf8',
      timeout: 15000,
      maxBuffer: 8 * 1024 * 1024,
    },
  )
}
for (const reader of readers) {
  test(
    reader.name + ': independent native parser, logical ownership and native projection agree',
    () => {
      for (const texts of [[], ['Hello, 世界'], [3, 1e21, false, null], ['e', '\u0301', '😀']]) {
        const artifact = validateArtifact(fixture(texts))
        const encoded = encodeStartupArtifact(artifact)
        const result = invoke(reader, encoded)
        assert.equal(result.status, 0, result.stderr)
        assert.deepEqual(JSON.parse(result.stdout), plain(artifact))
        const visual = invoke(reader, encoded, expected, ['visual'])
        assert.equal(visual.status, 0, visual.stderr)
        assert.deepEqual(JSON.parse(visual.stdout), plain(projectVisualTree(artifact.nodes)))
      }
    },
  )
  test(
    reader.name + ': Unicode dictionary keys and numeric initial data retain their exact meaning',
    () => {
      const artifact = fixture()
      artifact.seed = {
        é: 'composed',
        'e\u0301': 'decomposed',
        '😀': 'astral',
        10: 1e21,
        2: -0,
        tiny: 1e-7,
      }
      const encoded = encodeStartupArtifact(artifact)
      const result = invoke(reader, encoded)
      assert.equal(result.status, 0, result.stderr)
      assert.deepEqual(JSON.parse(result.stdout), plain(decodeStartupArtifact(encoded, expected)))
    },
  )
  test(
    reader.name + ': native launch predicates use the same inclusive boundaries and fallback rules',
    () => {
      const artifact = validateArtifact(fixture()),
        bytes = encodeStartupArtifact(artifact)
      for (const env of [
        { platform: 'android', fontScale: 1, width: 320, height: 800, reducedMotion: false },
        { platform: 'android', fontScale: 1, width: 800, height: 800, reducedMotion: false },
        { platform: 'android', fontScale: 1, width: 801, height: 800, reducedMotion: false },
        { platform: 'android', fontScale: 1.3, width: 402, height: 800, reducedMotion: false },
        {
          platform: 'android',
          fontScale: 1,
          width: 320,
          height: 800,
          reducedMotion: false,
          safeAreaInsets: { top: 24, right: 0, bottom: 16, left: 0 },
        },
        {
          platform: 'android',
          fontScale: 1,
          width: 320,
          height: 800,
          reducedMotion: false,
          safeAreaInsets: { top: 32, right: 0, bottom: 16, left: 0 },
        },
      ]) {
        const result = invoke(
          reader,
          bytes,
          expected,
          [
            env.fontScale,
            env.width,
            env.height,
            env.reducedMotion,
            env.safeAreaInsets?.top ?? 0,
            env.safeAreaInsets?.right ?? 0,
            env.safeAreaInsets?.bottom ?? 0,
            env.safeAreaInsets?.left ?? 0,
          ].map(String),
        )
        assert.equal(result.status, 0, result.stderr)
        assert.equal(JSON.parse(result.stdout), checkLaunchEnvironment(artifact, env).supported)
      }

      const insetBytes = encodeStartupArtifact(
        validateArtifact({
          ...fixture(),
          constraints: [
            ...fixture().constraints,
            { input: 'safeAreaTop', equals: 24 },
            { input: 'safeAreaBottom', equals: 16 },
          ],
        }),
      )
      for (const [top, bottom, expectedSupported] of [
        [24, 16, true],
        [32, 16, false],
        [24, 0, false],
      ]) {
        const result = invoke(
          reader,
          insetBytes,
          expected,
          [1, 320, 800, false, top, 0, bottom, 0].map(String),
        )
        assert.equal(result.status, 0, result.stderr)
        assert.equal(JSON.parse(result.stdout), expectedSupported)
      }
    },
  )
  test(
    reader.name + ': malformed packets and semantic corruption with valid checksums are rejected',
    () => {
      const encoded = Buffer.from(encodeStartupArtifact(fixture()))
      const cases = [
        encoded.subarray(0, 79),
        encoded.subarray(0, -1),
        resign(Buffer.concat([encoded, Buffer.from([0])])),
      ]
      for (const offset of [0, 4, 6, 8, 12, 16, 48, encoded.length - 1]) {
        const value = Buffer.from(encoded)
        value[offset] ^= 1
        cases.push(value)
      }
      const highBit = Buffer.from(encoded)
      highBit[0] ^= 128
      cases.push(highBit)
      const large = Buffer.from(encoded)
      large.writeUInt32LE(0xffffffff, 81)
      cases.push(resign(large))
      const tag = Buffer.from(encoded)
      tag[80] = 255
      cases.push(resign(tag))
      for (const [from, to] of [
        ['masonview', 'webviewxx'],
        ['fontScale', 'fontScalz'],
        ['fontSize', 'fontSizx'],
        ['0/0', '0/9'],
      ]) {
        const value = Buffer.from(encoded),
          offset = value.indexOf(Buffer.from(from), 80)
        assert.ok(offset >= 80 && Buffer.byteLength(from) === Buffer.byteLength(to))
        value.write(to, offset)
        cases.push(resign(value))
      }
      const utf8 = Buffer.from(encoded),
        text = utf8.indexOf(Buffer.from('Hello, 世界'), 80)
      assert.ok(text >= 80)
      utf8[text] = 255
      cases.push(resign(utf8))
      for (const bytes of cases) {
        const result = invoke(reader, bytes)
        assert.equal(result.status, 1, result.stderr)
        assert.match(result.stderr, /Native startup rejected/)
      }
      assert.equal(invoke(reader, encoded, { ...expected, platform: 'ios' }).status, 1)
      assert.equal(invoke(reader, encoded, { ...expected, build: 'cd'.repeat(32) }).status, 1)
    },
  )
  test(
    reader.name + ': launch-input artifacts decode, and native selection agrees with the schema resolver',
    () => {
      const artifact = validateArtifact(treesFixture())
      const encoded = encodeStartupArtifact(artifact)
      const result = invoke(reader, encoded)
      assert.equal(result.status, 0, result.stderr)
      assert.deepEqual(JSON.parse(result.stdout), plain(artifact))
      // The implicit systemAppearance bind resolves through the same pair
      // resolver: an absent or out-of-domain answer matches no tree.
      const cases = [
        [
          ['theme-preference=dark', 'systemAppearance=light'],
          { 'theme-preference': 'dark', systemAppearance: 'light' },
        ],
        [
          ['theme-preference=light', 'systemAppearance=dark'],
          { 'theme-preference': 'light', systemAppearance: 'dark' },
        ],
        [['systemAppearance=light'], { systemAppearance: 'light' }],
        [[], {}],
        [
          ['theme-preference=sepia', 'systemAppearance=light'],
          { 'theme-preference': 'sepia', systemAppearance: 'light' },
        ],
        [
          ['theme-preference=dark', 'systemAppearance=sepia'],
          { 'theme-preference': 'dark', systemAppearance: 'sepia' },
        ],
        [
          ['theme-preference=', 'systemAppearance=dark'],
          { 'theme-preference': '', systemAppearance: 'dark' },
        ],
        [
          ['unrelated=ignored', 'systemAppearance=light'],
          { unrelated: 'ignored', systemAppearance: 'light' },
        ],
      ]
      for (const [pairs, stored] of cases) {
        const selected = selectLaunchTree(artifact, (name) => stored[name] ?? null)
        const index = selected ? artifact.trees.indexOf(selected) : -1
        const result = invoke(reader, encoded, expected, ['select', ...pairs])
        assert.equal(result.status, 0, `${JSON.stringify(stored)}: ${result.stderr}`)
        assert.equal(JSON.parse(result.stdout), index, JSON.stringify(stored))
      }
    },
  )
  const producer = process.env.XPLAT_HOME_CODEC_PRODUCER
  if (producer)
    {test(
      reader.name + ': actual shared JSX producer decodes with its exact native projection',
      () => {
        const artifact = JSON.parse(readFileSync(join(producer, 'startup.json'), 'utf8'))
        const bytes = readFileSync(join(producer, 'startup.bin'))
        const identity = { build: artifact.build, platform: artifact.platform }
        const result = invoke(reader, bytes, identity)
        assert.equal(result.status, 0, result.stderr)
        assert.deepEqual(JSON.parse(result.stdout), plain(validateArtifact(artifact)))
        const visual = invoke(reader, bytes, identity, ['visual'])
        assert.equal(visual.status, 0, visual.stderr)
        assert.deepEqual(JSON.parse(visual.stdout), plain(projectVisualTree(artifact.nodes)))
      },
    )}
}
