import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'
import { inspectCompatibility } from '../dist/compatibility-check.js'

test('doctor checks the authored npm alias pin instead of the tarball package name', (t) => {
  const root = mkdtempSync(join(tmpdir(), 'xplat-compiler-alias-'))

  t.after(() => rmSync(root, { recursive: true, force: true }))
  writeFileSync(
    join(root, 'package.json'),
    JSON.stringify({
      name: 'compiler-alias-fixture',
      packageManager: 'bun@1.4.4',
      devDependencies: { 'typescript-classic': 'npm:typescript@5.9.3' },
    }),
  )

  mkdirSync(join(root, 'node_modules'))
  symlinkSync(
    dirname(fileURLToPath(import.meta.resolve('typescript-classic/package.json'))),
    join(root, 'node_modules/typescript-classic'),
    'junction',
  )

  const rows = inspectCompatibility(root, { node: process.version, bun: '1.4.4' })
  const alias = rows.find((row) => row.name === 'compatibility installed typescript-classic')

  assert.ok(alias, JSON.stringify(rows))
  assert.equal(alias.ok, true, alias.detail)
  assert.equal(
    rows.some((row) => row.name === 'compatibility installed typescript'),
    false,
  )
})
