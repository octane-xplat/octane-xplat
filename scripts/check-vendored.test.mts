import assert from 'node:assert/strict'
import { test } from 'node:test'
import { normalize } from './check-vendored.ts'

test('relative specifier depth does not count as drift', () => {
  const source = `import { helper } from '../../props'\nexport const value = helper\n`
  const copy = `import { helper } from './props'\nexport const value = helper\n`

  assert.equal(normalize(copy), normalize(source))
})

test('a different imported module still counts as drift', () => {
  const source = `import { helper } from '../../props'\n`
  const copy = `import { helper } from './other'\n`

  assert.notEqual(normalize(copy), normalize(source))
})

test('bare specifier changes count as drift', () => {
  const source = `import { helper } from 'octane/props'\n`
  const copy = `import { helper } from 'octane/other'\n`

  assert.notEqual(normalize(copy), normalize(source))
})

test('identifier renames count as drift', () => {
  assert.notEqual(normalize('export const kept = 1\n'), normalize('export const renamed = 1\n'))
})

test('comments do not count as drift', () => {
  assert.equal(
    normalize('/** VENDORED — keep in sync. */\nexport const value = 1\n'),
    normalize('export const value = 1\n'),
  )
})
