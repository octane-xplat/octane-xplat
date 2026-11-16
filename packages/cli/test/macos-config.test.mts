import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { tmpdir } from 'node:os'
import test from 'node:test'
import { inspectMacOSDevConfig, inspectMacOSPackageConfig } from '../dist/macos/config.js'

function project(t) {
  const root = mkdtempSync(join(tmpdir(), 'xplat-macos-config-'))

  t.after(() => rmSync(root, { recursive: true, force: true }))
  return root
}

function write(root, path) {
  const file = join(root, path)

  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, '')
}

test('macOS AppKit configuration keeps its existing Vite bundle contract', (t) => {
  const root = project(t)

  write(root, 'vite.config.mjs')

  const config = inspectMacOSDevConfig(root, {
    viteConfig: 'vite.config.mjs',
    bundleFile: 'dist/app.cjs',
  })

  assert.deepEqual(config.issues, [])
  assert.equal(config.viteConfig, join(root, 'vite.config.mjs'))
  assert.equal(config.bundleFile, join(root, 'dist/app.cjs'))
})

test('macOS development and packaging reject retired renderer and build fields', (t) => {
  const root = project(t)

  write(root, 'vite.config.mjs')

  const settings = {
    viteConfig: 'vite.config.mjs',
    bundleFile: 'dist/app.cjs',
    webViteConfig: 'vite.web.config.mjs',
    hostViteConfig: 'vite.host.config.mjs',
    hostBundleFile: 'dist/host.cjs',
    webOutDir: 'dist/web',
  }

  for (const inspect of [inspectMacOSDevConfig, inspectMacOSPackageConfig]) {
    const config = inspect(root, settings, 'webview')

    assert.match(config.issues.join('; '), /desktop WebView hosting has been removed/)
    for (const key of ['webViteConfig', 'hostViteConfig', 'hostBundleFile', 'webOutDir']) {
      assert.ok(config.issues.some((issue) => issue.includes(`${key} is no longer supported`)))
    }
  }
})

test('macOS renderer selection rejects unknown names', (t) => {
  const root = project(t)
  const config = inspectMacOSDevConfig(root, {}, 'cef')

  assert.match(config.issues.join('; '), /renderer must be "appkit"/)
})
