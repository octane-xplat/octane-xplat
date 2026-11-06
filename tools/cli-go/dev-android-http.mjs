// Host-only reproduction of NativeScript's device-module HTTP lookup.
// Explicit existing project; no SDK compiler, emulator, app or images.
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { readFileSync, realpathSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

// Some project plugins install uncaught-exception handlers. Only an explicitly
// completed probe may succeed, even when such a handler swallows an assertion.
process.exitCode = 1
const root = resolve(import.meta.dirname, '../..')
const app = realpathSync(process.env.XPLAT_GO_ANDROID_HTTP_APP)
const manifest = JSON.parse(readFileSync(join(app, 'package.json')))
assert.ok(manifest.private, 'Use an explicit disposable private project')
const require = createRequire(join(app, 'package.json'))
process.env.NATIVESCRIPT_BUNDLER_ENV = JSON.stringify({ android: true })
process.env.NS_HMR_NO_ADB_REVERSE = '1'
process.argv.push('--', '--env.android', '--env.hmr')
process.chdir(app)
const { createServer } = await import(pathToFileURL(require.resolve('vite')).href)
const server = await createServer({
  root: app,
  server: { host: '127.0.0.1', port: 0 },
  logLevel: 'error',
})

const results = []
try {
  await server.listen()
  const origin = `http://127.0.0.1:${server.httpServer.address().port}`
  for (const path of [
    '/ns/m/node_modules/source-map-js/lib/source-map-generator.js',
    '/ns/m/src/index.ts',
  ]) {
    const response = await fetch(origin + path, { signal: AbortSignal.timeout(20000) })
    const body = await response.text()
    results.push({
      path,
      status: response.status,
      bytes: Buffer.byteLength(body),
      detail: response.ok ? undefined : body.slice(0, 500),
    })
  }
} finally {
  await server.close()
}

writeFileSync(
  join(root, 'research/go-cli/dev-android-http.json'),
  JSON.stringify({ app, results }, null, 2),
)

const failed = results.filter((result) => result.status !== 200)
if (failed.length) {
  console.error(JSON.stringify(failed))
} else {
  console.log('NativeScript device-module HTTP lookups passed on host; no device runtime claim')
}

// The server is already closed; plugin exception handlers must not turn a
// failed assertion into a successful exit or keep a failed probe alive.
process.exit(failed.length ? 1 : 0)
