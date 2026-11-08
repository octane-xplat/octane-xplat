import assert from 'node:assert/strict'
import { chmodSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import {
  decidePackageManager,
  installedManagers,
  managerFromUserAgent,
  managerVersion,
} from '../dist/package-manager.js'

test('managerFromUserAgent reads the invoking tool', () => {
  assert.equal(managerFromUserAgent('bun/1.4.4 npm/? node/v26.3.0 darwin arm64'), 'bun')
  assert.equal(managerFromUserAgent('pnpm/11.24.0 npm/? node/? darwin arm64'), 'pnpm')
  assert.equal(managerFromUserAgent('npm/11.0.0 node/v22.0.0 darwin arm64'), undefined)
  assert.equal(managerFromUserAgent('yarn/1.22.0 npm/? node/? darwin arm64'), undefined)
  assert.equal(managerFromUserAgent(''), undefined)
  assert.equal(managerFromUserAgent(undefined), undefined)
  assert.equal(managerFromUserAgent('garbage'), undefined)
  assert.equal(managerFromUserAgent('bunx'), undefined)
})

test('decidePackageManager honors the flag above everything else', () => {
  for (const manager of ['bun', 'pnpm']) {
    const decision = decidePackageManager({
      flag: manager,
      userAgent: 'pnpm/11.24.0 npm/? node/? darwin arm64',
      installed: [],
      interactive: false,
    })

    assert.deepEqual(decision, { kind: 'use', manager, source: 'flag', installed: [] })
  }

  assert.throws(
    () => decidePackageManager({ flag: 'npm', installed: [], interactive: false }),
    /--package-manager must be bun or pnpm/,
  )
})

test('decidePackageManager uses a recognized user agent', () => {
  for (const manager of ['bun', 'pnpm']) {
    const decision = decidePackageManager({
      userAgent: `${manager}/9.9.9 npm/? node/? darwin arm64`,
      installed: ['bun'],
      interactive: true,
    })

    assert.deepEqual(decision, {
      kind: 'use',
      manager,
      source: 'user-agent',
      installed: ['bun'],
    })
  }
})

test('decidePackageManager probes installs for other user agents', () => {
  for (const userAgent of [undefined, 'npm/11.0.0 node/? darwin arm64', 'yarn/1.22.0']) {
    assert.deepEqual(decidePackageManager({ userAgent, installed: ['pnpm'], interactive: true }), {
      kind: 'use',
      manager: 'pnpm',
      source: 'only-installed',
      installed: ['pnpm'],
    })

    assert.deepEqual(
      decidePackageManager({ userAgent, installed: ['bun', 'pnpm'], interactive: true }),
      { kind: 'prompt', options: ['bun', 'pnpm'] },
    )

    // Non-interactive with both installed keeps the Bun default.
    assert.deepEqual(
      decidePackageManager({ userAgent, installed: ['bun', 'pnpm'], interactive: false }),
      { kind: 'use', manager: 'bun', source: 'fallback', installed: ['bun', 'pnpm'] },
    )

    assert.deepEqual(decidePackageManager({ userAgent, installed: [], interactive: true }), {
      kind: 'missing',
      manager: 'bun',
    })
  }
})

function stubManagers(t, entries) {
  const dir = mkdtempSync(join(tmpdir(), 'xplat-pm-stub-'))

  t.after(() => rmSync(dir, { recursive: true, force: true }))
  for (const [name, script] of Object.entries(entries)) {
    const file = join(dir, name)

    writeFileSync(file, script)
    chmodSync(file, 0o755)
  }

  const before = process.env.PATH

  process.env.PATH = dir
  t.after(() => {
    process.env.PATH = before
  })

  return dir
}

test('installedManagers runs <pm> --version and treats failures as absent', (t) => {
  stubManagers(t, {
    bun: '#!/bin/sh\necho 1.4.4\n',
    pnpm: '#!/bin/sh\nexit 1\n',
  })

  assert.deepEqual(installedManagers(), ['bun'])
  assert.equal(managerVersion('bun'), '1.4.4')
  assert.equal(managerVersion('pnpm'), undefined)
})

test('installedManagers reports nothing when PATH has no managers', (t) => {
  stubManagers(t, {})
  assert.deepEqual(installedManagers(), [])
})
