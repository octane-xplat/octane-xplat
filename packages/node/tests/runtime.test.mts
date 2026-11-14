import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { run } from './conformance.ts'
import { requireNode, installNode } from '../dist/index.js'

test('shared builtin behavior and constructor identity', async () => {
  let count = 0

  await run({
    assert(name, actual, expected = true) {
      assert.equal(actual, expected, name)
      count++
    },
    record() {},
  })

  assert.ok(count >= 30)
})

test('importing and resolving modules does not replace Node globals', () => {
  assert.equal(globalThis.Buffer, Buffer)
  assert.notEqual(requireNode('node:buffer').Buffer, Buffer)
  assert.throws(() => installNode(), /no NativeScript require hook/)
})

test('original vendored sources and specs match their recorded provenance', () => {
  const root = new URL('../vendor/ns-node/', import.meta.url)
  const provenance = JSON.parse(readFileSync(new URL('provenance.json', root), 'utf8'))

  for (const [path, hash] of Object.entries(provenance.files)) {
    assert.equal(
      createHash('sha256')
        .update(readFileSync(new URL(path, root)))
        .digest('hex'),
      hash,
      path,
    )
  }
})

test('bundled third-party packages carry license notices', () => {
  const pkg = new URL('../', import.meta.url)
  const mapUrl = new URL('dist/engine.js.map', pkg)
  const { sources } = JSON.parse(readFileSync(mapUrl, 'utf8'))
  const bundled = new Map<string, string>()

  for (const source of sources) {
    const resolved = fileURLToPath(new URL(source, mapUrl))
    const marker = '/node_modules/'
    const index = resolved.lastIndexOf(marker)

    if (index === -1) {
      continue
    }

    const [first, second] = resolved.slice(index + marker.length).split('/')
    const name = first.startsWith('@') ? `${first}/${second}` : first

    bundled.set(name, resolved.slice(0, index + marker.length) + name)
  }

  const licenses = new URL('vendor/licenses/', pkg)
  const manifest = JSON.parse(readFileSync(new URL('manifest.json', licenses), 'utf8'))

  assert.deepEqual([...bundled.keys()].sort(), Object.keys(manifest).sort())
  for (const [name, directory] of bundled) {
    assert.ok(existsSync(new URL(manifest[name].file, licenses)), `${name} license`)

    const { version } = JSON.parse(readFileSync(join(directory, 'package.json'), 'utf8'))

    assert.equal(manifest[name].version, version, `${name} version`)
  }
})
