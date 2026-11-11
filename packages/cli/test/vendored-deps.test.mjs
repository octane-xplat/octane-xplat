import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import {
  cpSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  mkdirSync,
  rmSync,
  existsSync,
} from 'node:fs'

import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { it } from 'node:test'

// The published CLI bundles @octane-xplat/lib and create-octane-xplat's
// compatibility module into dist/vendor/ so the tarball carries no runtime
// dependency on them (preview releases decouple from their versions).
const cli = join(dirname(fileURLToPath(import.meta.url)), '..')
const root = join(cli, '..', '..')
const scratch = mkdtempSync(join(tmpdir(), 'cli-vendored-'))

const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter((e) => e.isFile())
    .map((e) => join(e.parentPath ?? e.path, e.name))

it('dist emits no bare @octane-xplat/lib or create-octane-xplat imports', () => {
  const offenders = []

  for (const file of walk(join(cli, 'dist'))) {
    if (!file.endsWith('.js')) {
      continue
    }

    const body = readFileSync(file, 'utf8')

    // Only module specifiers count: require.resolve and string literals like
    // the add worker's project-side create-octane-xplat lookup stay bare.
    for (const spec of body.matchAll(
      /\b(?:from|import)\s*(?:\(\s*)?['"](@octane-xplat\/lib|create-octane-xplat)['"/]/g,
    )) {
      offenders.push(`${file}: ${spec[1]}`)
    }
  }

  assert.deepEqual(offenders, [])
})

it('packed manifest drops the vendored packages and the bundle works outside the workspace', async () => {
  const tarball = join(scratch, 'cli.tgz')

  execFileSync('bun', ['pm', 'pack', '--ignore-scripts', '--filename', tarball], { cwd: cli })
  execFileSync('tar', ['-xzf', tarball, '-C', scratch])

  const packed = JSON.parse(readFileSync(join(scratch, 'package/package.json'), 'utf8'))

  assert.equal(packed.dependencies['@octane-xplat/lib'], undefined)
  assert.equal(packed.dependencies['create-octane-xplat'], undefined)

  // The bundled compatibility module reads its JSON beside dist/ and only
  // resolves `yaml` from the dependency set — install just that for the check.
  const yaml = dirname(
    fileURLToPath(
      import.meta.resolve('yaml/package.json', pathToFileURL(join(cli, 'package.json'))),
    ),
  )

  mkdirSync(join(scratch, 'package/node_modules'), { recursive: true })
  cpSync(yaml, join(scratch, 'package/node_modules/yaml'), { recursive: true })

  const bundled = join(scratch, 'package/dist/vendor/create-octane-xplat/dist/compatibility.js')

  assert.ok(existsSync(bundled), 'bundled compatibility module missing from tarball')

  const mod = await import(pathToFileURL(bundled))
  const expected = JSON.parse(
    readFileSync(join(root, 'packages/create/compatibility.json'), 'utf8'),
  )

  assert.equal(mod.compatibility.frameworkVersion, expected.frameworkVersion)
})

process.on('exit', () => rmSync(scratch, { recursive: true, force: true }))
