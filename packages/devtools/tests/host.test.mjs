import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { listDevtoolsServers, serveDevtools } from '../src/node.ts'

const RECORD = {
  protocol: 'octane-dev-server',
  version: 1,
  appRoot: '/apps/fixture',
  endpoint: 'http://127.0.0.1:59999/rpc',
  instanceId: 'a'.repeat(32),
  token: 'b'.repeat(64),
  devtoolsToken: 'c'.repeat(64),
}

function withRecordsDir(fn) {
  const dir = mkdtempSync(join(tmpdir(), 'devtools-records-'))
  const previous = process.env.XPLAT_DEV_RECORDS_DIR
  process.env.XPLAT_DEV_RECORDS_DIR = dir

  return Promise.resolve()
    .then(() => fn(dir))
    .finally(() => {
      if (previous === undefined) delete process.env.XPLAT_DEV_RECORDS_DIR
      else process.env.XPLAT_DEV_RECORDS_DIR = previous
      rmSync(dir, { recursive: true, force: true })
    })
}

test('records enumeration returns valid records and omits the RPC token', () =>
  withRecordsDir((dir) => {
    mkdirSync(join(dir, 'key-good'))
    writeFileSync(join(dir, 'key-good', 'server.json'), JSON.stringify(RECORD))
    mkdirSync(join(dir, 'key-bad'))
    writeFileSync(join(dir, 'key-bad', 'server.json'), '{not json')

    const servers = listDevtoolsServers()

    assert.equal(servers.length, 1)
    assert.deepEqual(servers[0], {
      key: 'key-good',
      appRoot: '/apps/fixture',
      endpoint: 'http://127.0.0.1:59999/rpc',
      instanceId: RECORD.instanceId,
      devtoolsToken: RECORD.devtoolsToken,
    })
    assert.ok(!('token' in servers[0]))
  }))

test('the host serves the panel, client module, and live records over loopback', () =>
  withRecordsDir(async (dir) => {
    mkdirSync(join(dir, 'key-good'))
    writeFileSync(join(dir, 'key-good', 'server.json'), JSON.stringify(RECORD))

    const host = await serveDevtools()
    try {
      assert.match(host.endpoint, /^http:\/\/127\.0\.0\.1:\d+$/)

      const servers = await (await fetch(`${host.endpoint}/devtools/servers`)).json()
      assert.equal(servers.servers.length, 1)
      assert.equal(servers.servers[0].appRoot, '/apps/fixture')

      const page = await fetch(`${host.endpoint}/`)
      assert.equal(page.status, 200)
      assert.match(await page.text(), /Octane Xplat Devtools/)

      const panel = await fetch(`${host.endpoint}/app/panel.js`)
      assert.equal(panel.status, 200)
      assert.match(panel.headers.get('content-type'), /javascript/)

      const client = await fetch(`${host.endpoint}/dist/client.js`)
      assert.equal(client.status, 200)
      assert.match(await client.text(), /connectDevtools/)

      // Traversal and unknown paths stay out.
      assert.equal((await fetch(`${host.endpoint}/../package.json`)).status, 404)
      assert.equal((await fetch(`${host.endpoint}/dist/../../package.json`)).status, 404)
      assert.equal((await fetch(`${host.endpoint}/devtools/servers/../x`)).status, 404)
      assert.equal((await fetch(`${host.endpoint}/nope`)).status, 404)
    } finally {
      await host.close()
    }
  }))
