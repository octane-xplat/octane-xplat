import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { appFor, dependencies, fingerprint, json, repo } from './project.ts'

// These are host imports, so a case must not need --dep to activate their
// native binaries. A devDependency makes JS resolvable but skips ns prepare.
for (const target of ['ios', 'android']) {
  test(`${target} host declares and fingerprints the renderer's native plugin`, async () => {
    const deps = await dependencies(target, join(repo, 'examples/probes/hello.tsrx'), [])
    const name = '@octane-xplat/nativescript-mason-core'

    assert.ok(deps.names.has(name))
    assert.ok(!deps.names.has('@octane-xplat/nativescript-masonkit'))
    assert.ok(deps.nativeFiles.includes(join(deps.resolved.get(name), 'package.json')))
    assert.ok(
      deps.nativeFiles.some((file) => file.startsWith(join(deps.resolved.get(name), 'platforms'))),
    )

    assert.ok((await json(join(appFor(target), 'package.json'))).dependencies[name])
  })
}

test('mobile host fingerprint follows renderer source changes while case content stays reloadable', async () => {
  const root = await mkdtemp(join(tmpdir(), 'probe-renderer-fingerprint-'))
  try {
    const renderer = join(root, 'node_modules/@octane-xplat/nativescript-octane')
    await mkdir(join(renderer, 'src'), { recursive: true })
    await writeFile(join(renderer, 'package.json'), JSON.stringify({
      name: '@octane-xplat/nativescript-octane', version: '0.0.0',
      exports: { '.': { '@nativescript/source': './src/index.ts' } },
    }))
    const source = join(renderer, 'src/index.ts')
    const fixture = join(root, 'case.tsrx')
    await writeFile(source, 'export const value = 1\n')
    await writeFile(fixture, 'export default function Example() {}\n')
    const deps = await dependencies('ios', fixture, [])
    const before = await fingerprint(deps)
    await writeFile(source, 'export const value = 2\n')
    const after = await fingerprint(deps)
    assert.notEqual(after.key, before.key)
    await writeFile(fixture, 'export default function UpdatedExample() {}\n')
    assert.equal((await fingerprint(deps)).key, after.key)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('native preset folds the Windows branch in host builds', async () => {
  const cwd = process.cwd()

  try {
    process.chdir(appFor('ios'))

    const require = createRequire(join(process.cwd(), 'package.json'))
    const { native } = await import(require.resolve('@octane-xplat/cli/vite'))
    const config = await native('production')

    assert.equal(config.define.__WINDOWS__, 'false')
  } finally {
    process.chdir(cwd)
  }
})
