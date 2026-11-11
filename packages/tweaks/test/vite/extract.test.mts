import assert from 'node:assert/strict'
import { test } from 'node:test'
import { extract } from '../../src/vite/extract.ts'
import { serializeLiteral } from '../../src/vite/serialize.ts'

const FILE = 'src/App.tsrx'

test('extracts ids, inference, and writability', () => {
  const code = `
import { useTweak } from '@octane-xplat/tweaks'
const a = useTweak(8, { input: { type: 'number', min: 0, max: 40 } })
const b = useTweak('#fff')
const c = useTweak(true)
const d = useTweak('plain')
const e = useTweak('named', { name: 'custom', group: 'g' })
const f = useTweak(DEFAULT)
const g = useTweak(-3.5)
`

  const { tweaks, warnings } = extract(code, FILE)

  assert.equal(warnings.length, 0)

  const byId = new Map(tweaks.map((t) => [t.id, t]))

  assert.equal(byId.get(`${FILE}#a`)?.input.type, 'number')
  assert.deepEqual(byId.get(`${FILE}#a`)?.input, {
    type: 'number',
    min: 0,
    max: 40,
    step: undefined,
  })

  assert.equal(byId.get(`${FILE}#b`)?.input.type, 'color')
  assert.equal(byId.get(`${FILE}#c`)?.input.type, 'boolean')
  assert.equal(byId.get(`${FILE}#d`)?.input.type, 'string')
  assert.equal(byId.get(`${FILE}#g/custom`)?.name, 'custom')
  assert.equal(byId.get(`${FILE}#g/custom`)?.group, 'g')
  assert.equal(byId.get(`${FILE}#f`)?.writable, false)
  assert.match(byId.get(`${FILE}#f`)?.reason ?? '', /literal/)
  assert.equal(byId.get(`${FILE}#f`)?.value, null)
  assert.equal(byId.get(`${FILE}#g`)?.value, -3.5)
  assert.equal(byId.get(`${FILE}#g`)?.writable, true)
})

test('aliased import names are instrumented', () => {
  const code = `
import { useTweak as tw } from '@octane-xplat/tweaks'
const a = tw(1)
const b = useTweak(2)
`

  const { tweaks } = extract(code, FILE)

  assert.deepEqual(
    tweaks.map((t) => t.name),
    ['a'],
  )
})

test('namespace import warns and is not instrumented', () => {
  const code = `
import * as tweaks from '@octane-xplat/tweaks'
const a = tweaks.useTweak(1)
`

  const { tweaks, warnings } = extract(code, FILE)

  assert.equal(tweaks.length, 0)
  assert.match(warnings.join('\n'), /namespace import/)
})

test('duplicate id within a file warns, second call skipped', () => {
  const code = `
import { useTweak } from '@octane-xplat/tweaks'
const a = useTweak(1)
const b = useTweak(2, { name: 'a' })
`

  const { tweaks, warnings } = extract(code, FILE)

  assert.equal(tweaks.length, 1)
  assert.match(warnings.join('\n'), /duplicate tweak id/)
})

test('missing name warns and skips instrumentation', () => {
  const code = `
import { useTweak } from '@octane-xplat/tweaks'
foo(useTweak(1))
`

  const { tweaks, warnings } = extract(code, FILE)

  assert.equal(tweaks.length, 0)
  assert.match(warnings.join('\n'), /options\.name/)
})

test('non-literal options warn and infer what is possible', () => {
  const code = `
import { useTweak } from '@octane-xplat/tweaks'
const OPTS = { name: 'dyn' }
const a = useTweak(5, OPTS)
const b = useTweak(6, { input: dynamic })
`

  const { tweaks, warnings } = extract(code, FILE)

  assert.equal(tweaks.length, 2)
  assert.equal(tweaks[0].name, 'a')
  assert.match(warnings.join('\n'), /object literal/)
  assert.match(warnings.join('\n'), /options\.input/)
})

test('.tsrx files parse and ranges slice the source correctly', () => {
  const code = `import { useTweak } from '@octane-xplat/tweaks'
export function App() @{
	const a = useTweak(12)
	return <div style={{ padding: a }} />
}`

  const { tweaks } = extract(code, 'App.tsrx')

  assert.equal(tweaks.length, 1)
  assert.equal(tweaks[0].id, 'App.tsrx#a')

  const { valueRange } = tweaks[0]

  assert.equal(code.slice(valueRange!.start, valueRange!.end), '12')
  assert.equal(code.slice(tweaks[0].call.start, tweaks[0].call.end), 'useTweak(12)')
})

test('offsets are UTF-16 code units (non-ASCII before the call)', () => {
  const code = `import { useTweak } from '@octane-xplat/tweaks'
const café = '☕️ emoji 😀'
const a = useTweak(42)
`

  const { tweaks } = extract(code, 'f.ts')
  const { valueRange } = tweaks[0]

  assert.equal(code.slice(valueRange!.start, valueRange!.end), '42')
})

test('serializer preserves quote style and escapes', () => {
  assert.equal(serializeLiteral(12), '12')
  assert.equal(serializeLiteral(-3.5), '-3.5')
  assert.equal(serializeLiteral(true), 'true')
  assert.equal(serializeLiteral('a"b', '"'), '"a\\"b"')
  assert.equal(serializeLiteral("a'b", "'"), "'a\\'b'")
  assert.equal(serializeLiteral('a"b', "'"), "'a\"b'")
  assert.equal(serializeLiteral('line\nbreak', '"'), '"line\\nbreak"')
  assert.equal(serializeLiteral('back\\slash', "'"), "'back\\\\slash'")
})

test('umbrella specifier octane-xplat/tweaks instruments and reports the import', () => {
  const code = `import { useTweak } from 'octane-xplat/tweaks'
const a = useTweak(8)
`

  const result = extract(code, 'src/a.tsx')

  assert.equal(result.tweaks.length, 1)
  assert.ok(result.imports.declaration)
  assert.ok(result.imports.specifier)
})

test('mixed specifiers from both packages are collected', () => {
  const code = `import { useTweak } from '@octane-xplat/tweaks'
import { useTweak as tw } from 'octane-xplat/tweaks'
const a = useTweak(1)
const b = tw(2)
`

  const result = extract(code, 'src/a.tsx')

  assert.equal(result.tweaks.length, 2)
})
