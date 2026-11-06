// Real Node/Vite proxy plus native-leaf resolver; no NativeScript device claim.
import assert from 'node:assert/strict'
import test from 'node:test'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import http from 'node:http'
import vm from 'node:vm'
import { readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import ts from 'typescript'
import { createServer } from 'vite'
import { nativeDevSocketPlugin } from '../src/mcp/dev-socket.ts'
import { scratchRun } from '../../../tools/cli-go/scratch.mjs'

const root = resolve(import.meta.dirname, '../../..')
const bridgeSource = ts.transpile(
  readFileSync(join(root, 'packages/platform/src/dev-bridge.ts'), 'utf8'),
  {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
)

function leaf(origin, bridge, Constructor = WebSocket) {
  const sandbox = {
    exports: {},
    URL,
    WebSocket: Constructor,
    __NS_HTTP_ORIGIN__: origin,
    __XPLAT_DEV_BRIDGE__: bridge,
    require(name) {
      assert.equal(name, '@nativescript/core')
      return { Device: { os: 'Android' } }
    },
  }
  sandbox.globalThis = sandbox
  vm.runInNewContext(bridgeSource, sandbox)
  return sandbox.exports
}

function upgraded(url, origin) {
  return new Promise((resolve, reject) => {
    const request = http.request(url, {
      headers: {
        Connection: 'Upgrade',
        Upgrade: 'websocket',
        'Sec-WebSocket-Key': 'MDEyMzQ1Njc4OWFiY2RlZg==',
        'Sec-WebSocket-Version': '13',
        Origin: origin,
      },
    })
    request.setTimeout(3000, () => request.destroy(new Error('Upgrade timed out')))
    request.on('error', reject)
    request.on('response', (response) => {
      response.resume()
      reject(new Error('Upgrade refused: ' + response.statusCode))
    })
    request.on('upgrade', (response, socket) => {
      socket.destroy()
      resolve(response.statusCode)
    })
    request.end()
  })
}

test(
  'device app relay uses the reachable origin and forwards only its fixed app channel',
  { timeout: 30000 },
  async (t) => {
    const scratch = scratchRun(root, 'device-relay')
    const ready = join(scratch, 'ready.json'),
      requests = join(scratch, 'requests.json')
    const upstream = spawn(
      'bun',
      [join(root, 'tools/cli-go/device-relay-fixture.mjs'), ready, requests],
      { stdio: 'ignore' },
    )
    const exited = once(upstream, 'close')
    let vite
    const trapRequests = []
    const trap = http.createServer((request, response) => {
      trapRequests.push(request.url)
      response.writeHead(404).end()
    })
    await new Promise((resolve) => trap.listen(0, '127.0.0.1', resolve))
    t.after(async () => {
      if (upstream.exitCode === null && upstream.signalCode === null) {
        upstream.kill('SIGTERM')
      }
      await exited
      await vite?.close()
      trap.closeAllConnections?.()
      await new Promise((resolve) => trap.close(resolve))
      rmSync(scratch, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 })
    })
    const deadline = Date.now() + 5000
    while (!existsSync(ready)) {
      assert.equal(upstream.exitCode, null, 'Upstream fixture exited')
      assert.ok(Date.now() < deadline, 'Upstream fixture readiness timed out')
      await delay(20)
    }
    const port = JSON.parse(readFileSync(ready)).port
    const socket = `ws://127.0.0.1:${port}/app?target=android%3Adevice%2Bid&instance=${'a'.repeat(32)}`
    const bridge = {
      protocol: 'octane-app-debug',
      version: 1,
      socket,
      targetId: 'android:device+id',
      instanceId: 'a'.repeat(32),
      token: 'b'.repeat(64),
    }
    const previous = process.env.XPLAT_DEV_APP_BRIDGE
    process.env.XPLAT_DEV_APP_BRIDGE = JSON.stringify(bridge)
    let plugin, direct
    try {
      plugin = nativeDevSocketPlugin({ deviceRelay: true })
      direct = nativeDevSocketPlugin()
    } finally {
      if (previous === undefined) {
        delete process.env.XPLAT_DEV_APP_BRIDGE
      } else {
        process.env.XPLAT_DEV_APP_BRIDGE = previous
      }
    }
    assert.equal(JSON.parse(direct.config().define.__XPLAT_DEV_BRIDGE__).socket, socket)
    assert.equal(direct.config().server, undefined)
    const define = JSON.parse(plugin.config().define.__XPLAT_DEV_BRIDGE__)
    assert.ok(define.socket.startsWith('/__xplat_dev__/app?'))
    assert.equal(define.socket.includes(bridge.token), false)
    vite = await createServer({
      configFile: false,
      root: scratch,
      logLevel: 'silent',
      plugins: [plugin],
      server: {
        host: '127.0.0.1',
        port: 0,
        hmr: false,
        proxy: { '/': { target: `http://127.0.0.1:${trap.address().port}`, ws: true } },
      },
    })
    await vite.listen()
    const origin = `http://127.0.0.1:${vite.httpServer.address().port}`
    const client = leaf(origin, define).devBridgeSocket(define.socket)
    assert.equal(new URL(client.url).host, new URL(origin).host)
    const echoed = new Promise((resolve, reject) => {
      client.onopen = () => client.send('native-app-frame')
      client.onmessage = (event) => resolve(event.data)
      client.onerror = () =>
        reject(
          new Error(`Relayed WebSocket failed; project proxy requests: ${trapRequests.length}`),
        )
    })
    try {
      assert.equal(await echoed, 'native-app-frame')
    } finally {
      if (client.readyState !== WebSocket.CLOSED) {
        const closed = new Promise((resolve) =>
          client.addEventListener('close', resolve, { once: true }),
        )

        client.close()
        await closed
      }
    }
    assert.equal(await upgraded(origin + define.socket, 'http://caller.example'), 101)
    assert.deepEqual(
      JSON.parse(readFileSync(requests)).map((item) => item.path),
      [
        new URL(socket).pathname + new URL(socket).search,
        new URL(socket).pathname + new URL(socket).search,
      ],
    )
    assert.equal(
      JSON.parse(readFileSync(requests))[1].origin,
      'http://caller.example',
      'Do not forge Origin to bypass Go validation',
    )
    for (const path of [
      '/rpc',
      define.socket + '&extra=1',
      define.socket.replace('device%2Bid', 'another'),
      '/__xplat_dev__/app/../../rpc',
    ]) {
      await fetch(origin + path)
    }
    assert.equal(
      JSON.parse(readFileSync(requests)).length,
      2,
      'Other paths and identities must not reach the upstream',
    )
    assert.equal(
      trapRequests.length,
      4,
      'Preserve ordinary project proxies while reserving the exact app channel',
    )
    let resolved
    class RecordingSocket {
      constructor(url) {
        resolved = url
      }
    }
    leaf('https://device-host.example:8443', define, RecordingSocket).devBridgeSocket(define.socket)
    assert.equal(new URL(resolved).protocol, 'wss:')
    assert.equal(new URL(resolved).host, 'device-host.example:8443')
    assert.throws(
      () => leaf(origin, define, RecordingSocket).devBridgeSocket('//other.example/app'),
      /Invalid app debug relay/,
    )
    writeFileSync(
      join(root, 'research/go-cli/device-relay-node.json'),
      JSON.stringify(
        {
          passed: true,
          scope:
            'Actual Node/Vite WebSocket proxy, Bun upstream, NativeScript leaf with mocked Device and Node WebSocket; no device, native app auth, UI, TLS handshake or platform qualification.',
          node: process.version,
          requests: JSON.parse(readFileSync(requests)),
        },
        null,
        2,
      ) + '\n',
    )
  },
)
