import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs'

import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const repo = fileURLToPath(new URL('../', import.meta.url))

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'xplat-patch-scope-'))

  t.after(() => rmSync(root, { recursive: true, force: true }))

  const put = (path, text) => {
    const file = join(root, path)

    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, text)
    return file
  }

  put('scripts/sync-patches.ts', readFileSync(join(repo, 'scripts/sync-patches.ts')))
  put('package.json', '{}\n')
  put('packages/create/template/package.json', '{}\n')
  put('packages/create/library-template/package.json', '{}\n')
  put(
    'packages/cli/patches/manifest.json',
    JSON.stringify({ patches: [{ specifier: 'pkg@1.0.0', file: 'current.patch' }] }),
  )

  put('packages/cli/patches/current.patch', 'canonical patch\n')
  put('packages/create/template/patches/current.patch', 'stale patch\n')
  put('packages/create/template/patches/obsolete.patch', 'obsolete starter patch\n')
  put('packages/create/library-template/patches/current.patch', 'stale patch\n')

  const untouched = [
    put('pnpm-workspace.yaml', 'root workspace sentinel\n'),
    put('packages/create/template/pnpm-workspace.yaml', 'app workspace sentinel\n'),
    put('packages/create/library-template/pnpm-workspace.yaml', 'library workspace sentinel\n'),
    put('packages/create/template/package.json', '{}\n'),
    put('packages/create/library-template/package.json', '{}\n'),
    put('package.json', '{}\n'),
  ]

  symlinkSync(join(repo, 'node_modules'), join(root, 'node_modules'), 'dir')
  symlinkSync(
    join(repo, 'packages/create/compatibility.ts'),
    join(root, 'packages/create/compatibility.ts'),
  )

  return {
    root,
    untouched: untouched.map((file) => [file, readFileSync(file, 'utf8')]),
    run: (...args) =>
      spawnSync(process.execPath, [join(root, 'scripts/sync-patches.ts'), ...args], {
        encoding: 'utf8',
      }),
  }
}

test('template preparation refreshes starter patch files without touching manifests or workspace files', (t) => {
  const { root, untouched, run } = fixture(t)
  const result = run('--templates')

  assert.equal(result.status, 0, result.stderr)

  for (const template of ['template', 'library-template']) {
    assert.equal(
      readFileSync(join(root, `packages/create/${template}/patches/current.patch`), 'utf8'),
      'canonical patch\n',
    )
  }

  assert.equal(existsSync(join(root, 'packages/create/template/patches/obsolete.patch')), false)

  for (const [file, original] of untouched) {
    assert.equal(readFileSync(file, 'utf8'), original)
  }
})

test('template check rejects drift without changing generated files', (t) => {
  const { root, run } = fixture(t)
  const result = run('--templates', '--check')

  assert.equal(result.status, 1, result.stderr)
  assert.match(result.stderr, /starter patch is stale/)
  assert.equal(
    readFileSync(join(root, 'packages/create/template/patches/current.patch'), 'utf8'),
    'stale patch\n',
  )

  assert.equal(existsSync(join(root, 'packages/create/template/patches/obsolete.patch')), true)
})

test('full sync registers canonical patches and refreshes starter files', (t) => {
  const { root, run } = fixture(t)
  const result = run()

  assert.equal(result.status, 0, result.stderr)

  assert.deepEqual(JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')), {
    patchedDependencies: { 'pkg@1.0.0': 'packages/cli/patches/current.patch' },
  })

  for (const template of ['template', 'library-template']) {
    assert.deepEqual(
      JSON.parse(readFileSync(join(root, `packages/create/${template}/package.json`), 'utf8')),
      { patchedDependencies: { 'pkg@1.0.0': 'patches/current.patch' } },
    )
    assert.equal(
      readFileSync(join(root, `packages/create/${template}/patches/current.patch`), 'utf8'),
      'canonical patch\n',
    )
  }
})
