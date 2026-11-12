import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

// Run this Turbo task inside a native_builds reservation. No device is started.
const root = join(homedir(), 'agent-scratch/octane-xplat/native-prerender-home-codec')
mkdirSync(root, { recursive: true })
const work = mkdtempSync(join(root, 'run-'))
const binary = join(work, 'home-artifact-check')
const source = join(import.meta.dirname, 'home-native')
const hash = (path) => createHash('sha256').update(readFileSync(path)).digest('hex')
const inputs = [
  join(source, 'HomeArtifact.swift'),
  join(source, 'HomeArtifactCheck.swift'),
  ...['home-codec.mjs', 'home-codec.test.mjs', 'check-home-codec.mjs'].map((name) =>
    join(import.meta.dirname, name),
  ),
  ...(process.env.XPLAT_HOME_CODEC_INPUT ? [process.env.XPLAT_HOME_CODEC_INPUT] : []),
]
const inputHashes = Object.fromEntries(inputs.map((path) => [path, hash(path)]))
const commands = []
for (const [command, args, env] of [
  [
    'xcrun',
    [
      'swiftc',
      join(source, 'HomeArtifact.swift'),
      join(source, 'HomeArtifactCheck.swift'),
      '-o',
      binary,
    ],
    process.env,
  ],
  [
    process.execPath,
    ['--test', join(import.meta.dirname, 'home-codec.test.mjs')],
    { ...process.env, XPLAT_HOME_CODEC_NATIVE: binary, XPLAT_HOME_CODEC_WORK: work },
  ],
]) {
  commands.push({ command, args })
  const result = spawnSync(command, args, { env, stdio: 'inherit', timeout: 180000 })
  if (result.status !== 0)
    throw new Error(command + ': ' + (result.error?.message ?? result.status))
}
for (const [path, expected] of Object.entries(inputHashes))
  if (hash(path) !== expected) throw new Error('Codec input changed during verification: ' + path)
writeFileSync(
  join(work, 'build.json'),
  JSON.stringify(
    {
      inputHashes,
      binaryHash: hash(binary),
      commands,
      scope: 'Host-native codec checks only; no simulator or runtime hydration qualification',
    },
    null,
    2,
  ),
)
console.log('Native Home codec evidence: ' + work)
