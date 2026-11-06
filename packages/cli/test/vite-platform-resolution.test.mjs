import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, it } from 'node:test'
import { nativeRelativeResolution } from '../dist/vite.js'

// An unsuffixed relative import must prefer the platform leaf over the shared
// default — the ns platform resolver only knows .ios/.android, so `./svg`
// used to resolve `svg.ts` in dev and skip registerElement side effects.
const dirs = []
const vitePath = (path) => path.replaceAll('\\', '/')

const track = (path) => {
  dirs.push(path)

  return path
}

const makeDir = (files) => {
  const dir = track(mkdtempSync(join(tmpdir(), 'xplat-resolve-')))

  for (const name of files) {
    writeFileSync(join(dir, name), '')
  }

  return dir
}

const handler = nativeRelativeResolution().resolveId.handler

afterEach(() => {
  for (const dir of dirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

describe('nativeRelativeResolution', () => {
  it('prefers .mobile.ts over the unsuffixed default for relative imports', () => {
    const dir = makeDir(['svg.ts', 'svg.mobile.ts'])
    const resolved = handler('./svg', join(dir, 'Image.tsrx'), {})

    assert.equal(resolved, vitePath(join(dir, 'svg.mobile.ts')))
    assert.ok(!resolved.includes('\\'))
  })

  it('resolves the shared default directly when no platform leaf exists', () => {
    const dir = makeDir(['svg.ts'])

    assert.equal(handler('./svg', join(dir, 'Image.tsrx'), {}), vitePath(join(dir, 'svg.ts')))
  })

  it('ignores bare and absolute specifiers', () => {
    const dir = makeDir(['dep.ts', 'dep.mobile.ts'])

    assert.equal(handler('@scope/dep', join(dir, 'main.ts'), {}), null)
    assert.equal(handler('/dep', join(dir, 'main.ts'), {}), null)
  })

  it('recognizes a Windows-only bundler environment flag', () => {
    const previous = process.env.NATIVESCRIPT_BUNDLER_ENV
    try {
      process.env.NATIVESCRIPT_BUNDLER_ENV = JSON.stringify({ windows: true })
      const dir = makeDir(['screen.ts', 'screen.ios.ts', 'screen.windows.ts'])
      const resolve = nativeRelativeResolution().resolveId.handler
      assert.equal(
        resolve('./screen', join(dir, 'main.ts'), {}),
        vitePath(join(dir, 'screen.windows.ts')),
      )
    } finally {
      if (previous === undefined) {
        delete process.env.NATIVESCRIPT_BUNDLER_ENV
      } else {
        process.env.NATIVESCRIPT_BUNDLER_ENV = previous
      }
    }
  })

  const withWindowsEnv = (run) => {
    const previous = process.env.NATIVESCRIPT_BUNDLER_ENV
    try {
      process.env.NATIVESCRIPT_BUNDLER_ENV = JSON.stringify({ windows: true })
      return run(nativeRelativeResolution().resolveId.handler)
    } finally {
      if (previous === undefined) {
        delete process.env.NATIVESCRIPT_BUNDLER_ENV
      } else {
        process.env.NATIVESCRIPT_BUNDLER_ENV = previous
      }
    }
  }

  // The explicit TSRX contract spells unsuffixed specifiers with their
  // extension (`./Pressable.tsrx`). Vite resolves an extensioned specifier
  // literally, which skipped every platform leaf — the Windows peer
  // registrations never loaded (octane-xplat#163). The authored extension
  // is a contract name; the platform chain still selects the leaf.
  it('prefers the platform leaf for an explicit unsuffixed .tsrx specifier', () =>
    withWindowsEnv((resolve) => {
      const dir = makeDir(['Pressable.tsrx', 'Pressable.windows.tsrx'])
      assert.equal(
        resolve('./Pressable.tsrx', join(dir, 'index.shared.ts'), {}),
        vitePath(join(dir, 'Pressable.windows.tsrx')),
      )
    }))

  it('prefers the .mobile leaf for an explicit unsuffixed .tsrx specifier', () => {
    const dir = makeDir(['Tooltip.tsrx', 'Tooltip.mobile.tsrx'])
    assert.equal(
      handler('./Tooltip.tsrx', join(dir, 'index.shared.ts'), {}),
      vitePath(join(dir, 'Tooltip.mobile.tsrx')),
    )
  })

  it('resolves the literal unsuffixed file when no platform leaf exists', () => {
    const dir = makeDir(['Icon.tsrx'])
    assert.equal(
      handler('./Icon.tsrx', join(dir, 'index.shared.ts'), {}),
      vitePath(join(dir, 'Icon.tsrx')),
    )
  })

  it('does not inherit the .mobile tier on Windows', () =>
    withWindowsEnv((resolve) => {
      const dir = makeDir(['Widget.tsrx', 'Widget.mobile.tsrx'])
      assert.equal(
        resolve('./Widget.tsrx', join(dir, 'index.shared.ts'), {}),
        vitePath(join(dir, 'Widget.tsrx')),
      )
    }))

  it('leaves platform-tagged and non-script specifiers to literal resolution', () =>
    withWindowsEnv((resolve) => {
      const dir = makeDir(['screen.ios.tsrx', 'theme.css'])
      assert.equal(resolve('./screen.ios.tsrx', join(dir, 'main.ts'), {}), null)
      assert.equal(resolve('./theme.css', join(dir, 'main.ts'), {}), null)
    }))
})
