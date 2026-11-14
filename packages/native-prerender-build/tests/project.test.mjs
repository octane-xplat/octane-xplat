import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, realpathSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { resolveProject } from '../src/project-dependencies.mjs'
import { produceNativeStartup } from '@octane-xplat/native-prerender-build'

function app(t, dependencies = {}) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'native-startup-project-')))

  t.after(() => rmSync(root, { recursive: true, force: true }))
  writeFileSync(join(root, 'package.json'), JSON.stringify({ name: 'startup-test', dependencies }))
  return root
}

function module(root, name, exports) {
  const directory = join(root, 'node_modules', name)

  mkdirSync(directory, { recursive: true })
  writeFileSync(join(directory, 'package.json'), JSON.stringify({ name, type: 'module', exports }))
  writeFileSync(join(directory, 'index.js'), 'export {}')
  return directory
}

test('project tools are resolved from the selected project, without worker fallback', (t) => {
  const root = app(t, { '@octane-xplat/build': '0.20.0' })

  assert.throws(() => resolveProject(root), /@octane-xplat\/ui/)

  const ui = module(root, '@octane-xplat/ui', { '.': './index.js' })
  const build = module(root, '@octane-xplat/build', { './vite': './index.js' })
  const project = resolveProject(root)

  assert.equal(project.uiRoot, ui)
  assert.equal(project.normalizerPath, join(build, 'index.js'))
  assert.throws(() => project.require.resolve('vite'), /Cannot find module/)
})

test('a declared broken build package does not fall back to a working CLI', (t) => {
  const root = app(t, { '@octane-xplat/build': '0.20.0', '@octane-xplat/cli': '0.20.0' })

  module(root, '@octane-xplat/ui', { '.': './index.js' })
  module(root, '@octane-xplat/cli', { './vite': './index.js' })
  module(root, '@octane-xplat/build', { '.': './index.js' })
  assert.throws(() => resolveProject(root), /not defined by "exports"/)
})

test('invalid output does not delete or initialize an existing destination', async (t) => {
  const root = app(t)
  const file = join(root, 'keep.txt')

  writeFileSync(file, 'user-owned')
  await assert.rejects(
    produceNativeStartup({
      projectDir: '/missing',
      configurationFile: 'startup.json',
      outputDir: root,
      platform: 'android',
    }),
    /new or empty/,
  )

  assert.equal(readFileSync(file, 'utf8'), 'user-owned')
})
