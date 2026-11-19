import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { build } from 'vite'
import { webHost } from '../src/build/vite.ts'

const root = new URL('..', import.meta.url).pathname
const fixturePackage = root + '/test/fixtures/node_modules/browser-conditional'

test('the client bundle resolves browser export conditions instead of node defaults', async () => {
  // Top-level resolve.conditions replaces the client environment's defaults in
  // Vite 8 — a bare ['web'] list would drop 'browser'/'development|production'
  // and resolve this package's node leaf into the browser bundle. The fixture
  // package is generated because fixture node_modules stay untracked.
  mkdirSync(fixturePackage, { recursive: true })
  writeFileSync(
    fixturePackage + '/package.json',
    JSON.stringify({
      name: 'browser-conditional',
      version: '0.0.0',
      type: 'module',
      exports: {
        '.': {
          browser: './browser.js',
          default: './node.js',
        },
      },
    }),
  )
  writeFileSync(fixturePackage + '/browser.js', 'export const impl = "browser-leaf"\n')
  writeFileSync(fixturePackage + '/node.js', 'export const impl = "node-leaf"\n')

  try {
    const bundle = await build({
      root,
      configFile: false,
      logLevel: 'silent',
      plugins: [webHost()],
      build: {
        write: false,
        minify: false,
        rollupOptions: { input: root + '/test/fixtures/browser-conditions-entry.web.ts' },
      },
    })

    const code = bundle.output.find((entry) => entry.type === 'chunk').code

    assert.match(code, /browser-leaf/, 'the browser leaf is bundled')
    assert.doesNotMatch(code, /node-leaf/)
  } finally {
    rmSync(fixturePackage, { recursive: true, force: true })
  }
})
