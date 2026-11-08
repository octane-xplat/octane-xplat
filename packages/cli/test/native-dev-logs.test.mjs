import assert from 'node:assert/strict'
import { createServer, request } from 'node:http'
import { test } from 'node:test'
import { nativeDevSocketPlugin } from '../dist/mcp/dev-socket.js'

async function fixture(t) {
  const previous = process.env.XPLAT_DEV_APP_BRIDGE
  const token = 'b'.repeat(64),
    instanceId = 'a'.repeat(32)

  process.env.XPLAT_DEV_APP_BRIDGE = JSON.stringify({
    protocol: 'octane-app-debug',
    version: 1,
    token,
    instanceId,
    targetId: 'web',
    socket: `ws://127.0.0.1:12345/app?instance=${instanceId}&target=web`,
  })

  const plugin = nativeDevSocketPlugin()

  if (previous === undefined) {
    delete process.env.XPLAT_DEV_APP_BRIDGE
  } else {
    process.env.XPLAT_DEV_APP_BRIDGE = previous
  }

  let middleware

  plugin.configureServer({
    config: { server: {} },
    middlewares: {
      use(handler) {
        middleware = handler
      },
    },
  })

  const server = createServer((req, res) =>
    middleware(req, res, () => {
      res.statusCode = 404
      res.end()
    }),
  )

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  t.after(
    () =>
      new Promise((resolve) => {
        server.close(resolve)
        server.closeAllConnections()
      }),
  )

  const origin = `http://127.0.0.1:${server.address().port}`
  const call = (body, extra = {}) =>
    fetch(origin + '/__xplat_dev__/logs', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-xplat-dev-token': token },
      body: JSON.stringify(body),
      ...extra,
    })

  return { plugin, origin, token, call }
}

test('native browser logging authenticates atomically and preserves exact stream bytes', async (t) => {
  const { plugin, origin, call } = await fixture(t)

  assert.equal(plugin.apply({}, { command: 'build', mode: 'production' }), false)
  assert.equal(plugin.transformIndexHtml()[0].injectTo, 'head-prepend')
  assert.equal((await call({}, { headers: {} })).status, 403)
  assert.equal((await call({}, { headers: { origin: 'http://foreign.invalid' } })).status, 403)

  const output = [],
    original = process.stderr.write

  process.stderr.write = function (chunk, ...args) {
    if (String(chunk).startsWith('[browser:')) {
      output.push(String(chunk))
      return true
    }

    return original.call(this, chunk, ...args)
  }

  try {
    assert.equal(
      (
        await call({
          records: [
            { level: 'warn', line: 'must not be retained' },
            { level: 'info', line: 'invalid' },
          ],
        })
      ).status,
      400,
    )

    assert.deepEqual(output, [])

    const response = await call(
      { records: [{ level: 'error', line: 'failed\nstack line' }], dropped: 2 },
      { headers: { 'x-xplat-dev-token': 'b'.repeat(64), origin } },
    )

    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), { accepted: 1 })
    assert.equal(
      output.join(''),
      '[browser:warn] 2 browser log records lost before delivery.\n[browser:error] failed\n[browser:error] stack line\n',
    )
  } finally {
    process.stderr.write = original
  }
})

test(
  'native browser logging releases oversized and slow requests and bounds output backpressure',
  { timeout: 10000 },
  async (t) => {
    const { origin, token, call } = await fixture(t)

    await assert.rejects(call({ records: [{ level: 'error', line: 'x'.repeat(160000) }] }))

    const unfinished = request(origin + '/__xplat_dev__/logs', {
      method: 'POST',
      headers: { 'x-xplat-dev-token': token, 'transfer-encoding': 'chunked' },
    })

    const closed = new Promise((resolve) => unfinished.once('error', resolve))

    unfinished.write('{')
    await closed // Native worker request deadline destroys the unfinished body.

    const original = process.stderr.write
    let writes = 0

    process.stderr.write = function (chunk, ...args) {
      if (String(chunk).startsWith('[browser:')) {
        writes++
        return false
      }

      return original.call(this, chunk, ...args)
    }

    try {
      assert.equal(
        (await call({ records: [{ level: 'warn', line: 'bounded write' }] })).status,
        200,
      )

      assert.equal(
        (await call({ records: [{ level: 'error', line: 'not queued while blocked' }] })).status,
        503,
      )

      assert.equal(writes, 1)
      process.stderr.emit('drain')
      assert.equal((await call({ records: [] })).status, 200)
    } finally {
      process.stderr.write = original
      process.stderr.emit('drain')
      unfinished.destroy()
    }
  },
)
