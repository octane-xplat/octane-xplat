// Explicit optional native-inference qualification. Never installs globally.
import { createHash, randomUUID } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync, mkdirSync, renameSync, rmSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'
import { prepareModelFixtures } from './model-fixtures.mjs'

export const runtimePin = JSON.parse(readFileSync(new URL('./ort-runtime.json', import.meta.url)))
export const runtimeWork = resolve(import.meta.dirname, '../../research/go-cli/runtime-fixtures')
export const runtimeTarget = runtimePin.targets[`${process.platform}-${process.arch}`]
export const runtimeDir = runtimeTarget && join(runtimeWork, runtimeTarget.directory)

const sha = (bytes) => createHash('sha256').update(bytes).digest('hex')

export async function prepareOrtFixtures() {
  if (!runtimeTarget) {
    throw Error('Native inference qualification currently requires macOS arm64')
  }

  mkdirSync(runtimeWork, { recursive: true })

  const archive = join(runtimeWork, `${runtimeTarget.directory}.tgz`)

  if (!existsSync(archive) || sha(readFileSync(archive)) !== runtimeTarget.sha256) {
    const response = await fetch(runtimeTarget.url, { signal: AbortSignal.timeout(120_000) })

    if (!response.ok) {
      throw Error(`Runtime fixture download failed (${response.status})`)
    }

    const bytes = new Uint8Array(await response.arrayBuffer())

    if (bytes.length !== runtimeTarget.bytes || sha(bytes) !== runtimeTarget.sha256) {
      throw Error('Runtime fixture checksum mismatch')
    }

    const staging = `${archive}.${randomUUID()}.tmp`

    try {
      writeFileSync(staging, bytes)
      renameSync(staging, archive)
    } finally {
      rmSync(staging, { force: true })
    }

    console.log(`Prepared pinned native runtime archive: ${bytes.length} bytes`)
  }

  // Re-extract verified bytes so mutable extracted headers/libraries are not a
  // substitute for the archive identity. Only this task's pinned folder is owned.
  rmSync(runtimeDir, { force: true, recursive: true })

  const members = [
    ...Object.keys(runtimePin.headers).map((name) => 'include/' + name),
    runtimeTarget.library,
    'LICENSE',
    'ThirdPartyNotices.txt',
  ].map((file) => `${runtimeTarget.directory}/${file}`)

  const run = spawnSync('tar', ['-xzf', archive, '-C', runtimeWork, ...members], {
    encoding: 'utf8',
  })

  if (run.status !== 0) {
    throw Error(run.stderr || 'Runtime fixture extraction failed')
  }

  await prepareModelFixtures({ tokenizerOnly: false })
  return runtimeDir
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await prepareOrtFixtures()
}
