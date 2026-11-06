import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { createServer } from 'vite'
import { nativeDevSocketPlugin } from '../dist/mcp/dev-socket.js'

const identity = { version: 1, instanceId: 'a'.repeat(32), targetId: 'web' }
const token = 'b'.repeat(64)
async function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'xplat-native-stacks-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  mkdirSync(join(root, 'src'))
  writeFileSync(
    join(root, 'src/failure.ts'),
    'export function failure(value: number) {\n  throw new Error("mapped failure");\n}\n',
  )
  const previous = process.env.XPLAT_DEV_APP_BRIDGE
  process.env.XPLAT_DEV_APP_BRIDGE = JSON.stringify({
    ...identity,
    protocol: 'octane-app-debug',
    token,
    socket: `ws://127.0.0.1:12345/app?instance=${identity.instanceId}&target=web`,
  })
  let plugin
  try {
    plugin = nativeDevSocketPlugin()
  } finally {
    if (previous === undefined) {
      delete process.env.XPLAT_DEV_APP_BRIDGE
    } else {
      process.env.XPLAT_DEV_APP_BRIDGE = previous
    }
  }
  const server = await createServer({
    root,
    configFile: false,
    logLevel: 'silent',
    plugins: [plugin],
    server: { host: '127.0.0.1', port: 0 },
  })
  t.after(() => server.close())
  await server.listen()
  const origin = `http://127.0.0.1:${server.httpServer.address().port}`
  const call = (body, headers = {}) =>
    fetch(origin + '/__xplat_dev__/stacks', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-xplat-dev-token': token, ...headers },
      body: JSON.stringify(body),
    })
  return { server, origin, call }
}

test('native source endpoint resolves served Vite maps and preserves unsupported frames', async (t) => {
  const { server, origin, call } = await fixture(t)
  const transformed = await server.transformRequest('/src/failure.ts')
  const lines = transformed.code.split('\n')
  const line = lines.findIndex((line) => line.includes('throw new Error')) + 1
  assert.ok(line > 0)
  const raw = `Error: mapped failure\n    at failure (${origin}/src/failure.ts:${line}:3)\n    at raw (file:///app/bundle.mjs:1:1)`
  const response = await call({
    ...identity,
    stacks: [raw, `at foreign (http://foreign.invalid/src/failure.ts:${line}:3)`],
  })
  assert.equal(response.status, 200)
  const result = await response.json()
  assert.equal(result.instanceId, identity.instanceId)
  assert.match(result.sourceStacks[0], /at failure \(src\/failure.ts:2:\d+\)/)
  assert.match(result.sourceStacks[0], /file:\/\/\/app\/bundle.mjs:1:1/)
  assert.equal(result.sourceStacks[1], null)
  // A readable file with no served module must not trigger a compiler request.
  let transforms = 0
  server.transformRequest = () => {
    transforms++
    throw new Error('unexpected transform')
  }
  const unknown = await (
    await call({ ...identity, stacks: [`at unseen (${origin}/src/unseen.ts:1:1)`] })
  ).json()
  assert.deepEqual(unknown.sourceStacks, [null])
  assert.equal(transforms, 0)
})

test('native source endpoint rejects cross-origin, stale identity and oversized stack requests', async (t) => {
  const { call, origin } = await fixture(t)
  const body = { ...identity, stacks: ['at raw (file:///app/bundle.mjs:1:1)'] }
  assert.equal((await call(body, { 'x-xplat-dev-token': 'wrong' })).status, 403)
  assert.equal((await call(body, { origin: 'https://foreign.invalid' })).status, 403)
  assert.equal((await call(body, { origin })).status, 403)
  assert.equal((await call({ ...body, instanceId: 'c'.repeat(32) })).status, 400)
  assert.equal((await call({ ...body, stacks: Array(21).fill('raw') })).status, 400)
  assert.equal((await call({ ...body, stacks: ['x'.repeat(8193)] })).status, 400)
  assert.equal((await call({ ...body, stacks: Array(4).fill('x'.repeat(8192)) })).status, 400)
})
