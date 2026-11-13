import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'

const source = join(import.meta.dirname, 'appkit-measurement/MeasureMatrix.swift')
const hash = (path) => createHash('sha256').update(readFileSync(path)).digest('hex')
function command(program, args) {
  const result = spawnSync(program, args, { encoding: 'utf8', timeout: 180000 })
  if (result.status !== 0)
    throw new Error(program + ': ' + (result.error?.message ?? result.stderr ?? result.status))
  return result.stdout
}

if (process.platform !== 'darwin') throw new Error('AppKit measurement requires macOS')
const mode = process.argv[2]
if (mode === 'build') {
  // Reserve native_builds for this phase only. The run phase creates no window.
  const root = join(homedir(), 'agent-scratch/octane-xplat/native-prerender-appkit-measurement')
  mkdirSync(root, { recursive: true })
  const work = mkdtempSync(join(root, 'run-'))
  const binary = join(work, 'measure-matrix')
  const sourceHash = hash(source)
  const args = ['swiftc', '-parse-as-library', source, '-o', binary]
  command('xcrun', args)
  if (hash(source) !== sourceHash) throw new Error('Measurement source changed during build')
  writeFileSync(
    join(work, 'build.json'),
    JSON.stringify(
      { source, sourceHash, binary, binaryHash: hash(binary), command: ['xcrun', ...args] },
      null,
      2,
    ),
  )
  console.log('AppKit measurement build: ' + work)
} else if (mode === 'run') {
  const work = process.env.XPLAT_APPKIT_MEASUREMENT_BUILD
  const library = process.env.XPLAT_APPKIT_MEASUREMENT_LIBRARY
  if (!work || !library)
    throw new Error('Set XPLAT_APPKIT_MEASUREMENT_BUILD and XPLAT_APPKIT_MEASUREMENT_LIBRARY')
  const manifest = JSON.parse(readFileSync(join(work, 'build.json'), 'utf8'))
  if (
    manifest.source !== source ||
    hash(source) !== manifest.sourceHash ||
    hash(manifest.binary) !== manifest.binaryHash
  )
    throw new Error('Measurement source or executable differs from build manifest')
  const libraryPath = resolve(library)
  const libraryHash = hash(libraryPath)
  const evidence = mkdtempSync(join(work, 'evidence-'))
  const resultPath = join(evidence, 'result.json')
  command(manifest.binary, [libraryPath, resultPath])
  const result = JSON.parse(readFileSync(resultPath, 'utf8'))
  if (
    hash(source) !== manifest.sourceHash ||
    hash(manifest.binary) !== manifest.binaryHash ||
    hash(libraryPath) !== libraryHash
  )
    throw new Error('Measurement input changed during execution')
  writeFileSync(
    join(evidence, 'inputs.json'),
    JSON.stringify({ ...manifest, library: libraryPath, libraryHash }, null, 2),
  )
  console.log('AppKit measurement evidence: ' + evidence)
  if (
    result.applicationJSRuntimeCreated !== false ||
    result.windowCreated !== false ||
    result.results?.length !== 19 ||
    result.passed !== true ||
    !result.results.every((row) => row.matches === true && row.preferredWidthRestored === true)
  )
    throw new Error('AppKit measurement failed; inspect ' + resultPath)
  console.log('AppKit measurement: 19 checks passed; native-only, no window or JS runtime')
} else {
  throw new Error('Expected build or run')
}
