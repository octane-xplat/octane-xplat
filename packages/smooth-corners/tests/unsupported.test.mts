import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import { runInNewContext } from 'node:vm'
import { test } from 'node:test'

for (const target of ['windows', 'gtk', 'default']) {
  test(`${target}: unsupported renderer fails instead of drawing ordinary corners`, () => {
    const leaf = target === 'default' ? 'SmoothCorners.tsrx' : `SmoothCorners.${target}.tsrx`
    const source = stripTypeScriptTypes(
      readFileSync(new URL(`../src/${leaf}`, import.meta.url), 'utf8'),
    )
      .replace(/^import .*$/gm, '')
      .replace(/^export /gm, '')

    const context = {}

    runInNewContext(source, context)
    assert.throws(() => context.SmoothCorners({ corners: 24 }), /SmoothCorners is unavailable/)
  })
}
