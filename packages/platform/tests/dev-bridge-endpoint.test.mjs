import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript-classic'

for (const platform of ['web', 'macos', 'linux']) {
  const source = ts.transpile(
    await readFile(new URL(`../src/dev-bridge.${platform}.ts`, import.meta.url), 'utf8'),
    { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  )
  const endpoint = (globals) => {
    const context = { exports: {}, ...globals }
    vm.runInNewContext(source, context)
    const value = context.exports.devBridgeEndpoint()
    return value == null ? value : { ...value }
  }

  test(`${platform} endpoint requires a valid token and HTTP origin`, () => {
    assert.equal(endpoint({}), null)
    for (const bridge of [null, 'token', {}, { token: 1 }]) {
      assert.equal(
        endpoint({ __XPLAT_DEV_BRIDGE__: bridge, location: { origin: 'http://localhost:5173' } }),
        null,
      )
    }
    assert.equal(
      endpoint({ __XPLAT_DEV_BRIDGE__: { token: 'test-token' }, location: { origin: 'file://' } }),
      null,
    )
    assert.equal(
      endpoint({ __XPLAT_DEV_BRIDGE__: { token: 'test-token', socket: 42 } }),
      null,
    )
    assert.deepEqual(
      endpoint({
        __XPLAT_DEV_BRIDGE__: { token: 'test-token' },
        location: { origin: 'http://localhost:5173' },
      }),
      {
        origin: 'http://localhost:5173',
        token: 'test-token',
        socket: undefined,
        instanceId: undefined,
        targetId: undefined,
      },
    )
  })
}
