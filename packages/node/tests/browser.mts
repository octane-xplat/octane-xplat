import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { build, createServer, preview } from 'vite'
import { chromium } from 'playwright'
import { nodeBuiltins } from '../dist/vite.js'

const root = fileURLToPath(new URL('./.runtime/browser', import.meta.url))
const packageRoot = fileURLToPath(new URL('..', import.meta.url))

await mkdir(join(root, 'node_modules/node-builtin-fixture'), { recursive: true })
await writeFile(
  join(root, 'package.json'),
  JSON.stringify({
    private: true,
    type: 'module',
    dependencies: { 'node-builtin-fixture': '1.0.0' },
  }),
)

await writeFile(
  join(root, 'node_modules/node-builtin-fixture/package.json'),
  JSON.stringify({ name: 'node-builtin-fixture', version: '1.0.0', main: 'index.cjs' }),
)

await writeFile(
  join(root, 'node_modules/node-builtin-fixture/index.cjs'),
  `exports.Buffer = require('node:buffer').Buffer; exports.EventEmitter = require('events').EventEmitter`,
)

await writeFile(
  join(root, 'index.html'),
  '<!doctype html><script type="module" src="/entry.js"></script>',
)

await writeFile(join(root, 'ssr.js'), `export { Buffer } from 'node:buffer'`)
await writeFile(
  join(root, 'entry.js'),
  `
import events from 'node:events'
import { Buffer } from 'buffer'
import stream from 'node:stream'
import fixture from 'node-builtin-fixture'
import { requireNode } from ${JSON.stringify(join(packageRoot, 'dist/index.js'))}
import { run } from ${JSON.stringify(join(packageRoot, 'tests/conformance.ts'))}
globalThis.__nodeResult = (async () => {
  let count = 0
  const check = (name, actual, expected = true) => { if (!Object.is(actual, expected)) throw Error(name); count++ }
  check('static Buffer identity', Buffer === requireNode('buffer').Buffer)
  check('static events identity', events === requireNode('events'))
  check('static stream identity', stream === requireNode('stream'))
  check('CJS Buffer identity', fixture.Buffer === Buffer)
  check('CJS events identity', fixture.EventEmitter === events)
  await run({ assert: check, record() {} })
  return count
})()
`,
)

const config = {
  root,
  configFile: false,
  plugins: [nodeBuiltins()],
  logLevel: 'error' as const,
  optimizeDeps: { include: ['node-builtin-fixture'], force: true },
  server: { host: '127.0.0.1', port: 0, fs: { allow: [packageRoot] } },
}

const browser = await chromium.launch()
let server
let production

try {
  server = await createServer(config)
  await server.listen()

  const ssr = await server.ssrLoadModule('/ssr.js')

  assert.equal(ssr.Buffer, Buffer, 'Node SSR retains its real builtin')
  for (const mode of ['development', 'production']) {
    if (mode === 'production') {
      await build({ ...config, build: { target: 'es2022' } })
      production = await preview({
        root,
        configFile: false,
        preview: { host: '127.0.0.1', port: 0 },
        logLevel: 'error',
      })
    }

    const page = await browser.newPage()

    try {
      await page.goto((mode === 'development' ? server : production).resolvedUrls.local[0])
      await page.waitForFunction(() => '__nodeResult' in globalThis)

      const count = await page.evaluate(() => globalThis.__nodeResult)

      assert.ok(count >= 35)
      console.log(`Chromium ${mode}: ${count} builtin assertions; ESM/CJS identities agree.`)
    } finally {
      await page.close()
    }
  }
} finally {
  await browser.close()
  await server?.close()
  await new Promise<void>((resolve) =>
    production ? production.httpServer.close(() => resolve()) : resolve(),
  )
}
