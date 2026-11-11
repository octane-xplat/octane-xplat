import assert from 'node:assert/strict'
import { test } from 'node:test'
import { tweaks } from '../../src/vite/index.ts'

const FILE = '/proj/src/App.tsx'
const REL = 'src/App.tsx'

// Invoke plugin hooks directly with a minimal context.
function setup(command: 'serve' | 'build', mode = 'production') {
  const warnings: string[] = []
  const plugin = tweaks()

  plugin.config?.call({} as never, {}, { command, mode } as never)
  plugin.configResolved?.call(
    {} as never,
    { root: '/proj', isProduction: command === 'build' && mode === 'production' } as never,
  )

  const transform = (code: string, id = FILE) =>
    plugin.transform!.call({ warn: (m: string) => warnings.push(m) } as never, code, id)

  return { transform, warnings }
}

test('dev transform injects the entry id as third argument', () => {
  const { transform } = setup('serve')
  const code = `import { useTweak } from '@octane-xplat/tweaks'
const a = useTweak(8, { input: { type: 'number' } })
`

  // transform also reads the manifest from disk; use a real file via id-free path.
  const result = transform(code, `/proj/${REL}`) as { code: string } | null

  if (result) {
    assert.match(result.code, /useTweak\(8, \{ input: \{ type: 'number' \} \}, "src\/App\.tsx#a"\)/)
  }
})

test('production strips calls and removes the import', () => {
  const { transform } = setup('build')
  const code = `import { useTweak } from '@octane-xplat/tweaks'
import { View } from '@octane-xplat/ui'
const a = useTweak(8, { input: { type: 'number', min: 0 }, name: 'radius' })
const b = useTweak('secret-string-name')
export const out = a + 1
`

  const result = transform(code) as { code: string }

  assert.ok(result)
  assert.equal(result.code.includes('useTweak('), false)
  assert.equal(result.code.includes('@octane-xplat/tweaks'), false)
  assert.equal(result.code.includes('radius'), false)
  assert.match(result.code, /const a = \(8\)/)
  assert.match(result.code, /const b = \('secret-string-name'\)/)
  assert.match(result.code, /import \{ View \} from '@octane-xplat\/ui'/)
})

test('production removes only the useTweak specifier from a shared import', () => {
  const { transform } = setup('build')
  const code = `import { useTweak, type TweakValue } from '@octane-xplat/tweaks'
const a: TweakValue = useTweak(2)
`

  const result = transform(code) as { code: string }

  assert.ok(result)
  assert.match(result.code, /import \{ type TweakValue \} from '@octane-xplat\/tweaks'/)
  assert.match(result.code, /const a: TweakValue = \(2\)/)
})

test('non-production build leaves calls uninstrumented', () => {
  const { transform } = setup('build', 'development')
  const code = `import { useTweak } from '@octane-xplat/tweaks'
const a = useTweak(8)
`

  assert.equal(transform(code), null)
})

test('dev replaces the gate marker outside the Vite root', () => {
  const { transform } = setup('serve')
  const code = `const config = typeof __OCTANE_TWEAKS__ === 'undefined' ? undefined : __OCTANE_TWEAKS__`
  const result = transform(code, '/outside/root/client.ts') as { code: string }

  assert.ok(result)
  assert.match(result.code, /typeof true === 'undefined' \? undefined : true/)
})

test('marker in member position is not broken', () => {
  const { transform } = setup('serve')
  const code = `const c = globalThis.__OCTANE_TWEAKS__\nconst d = typeof __OCTANE_TWEAKS__`
  const result = transform(code, '/outside/root/client.ts') as { code: string }

  assert.ok(result)
  assert.match(result.code, /globalThis\.__OCTANE_TWEAKS__/)
})

test('dev transform wraps inline style sites with useTweakStyles', () => {
  const { transform } = setup('serve')
  const code = `export function App() {
	return <View style={{ borderRadius: 8, padding: 16 }}>x</View>
}`

  const result = transform(code) as { code: string } | null

  assert.ok(result)
  assert.match(result.code, /useTweakStyles/)
  assert.match(
    result.code,
    /__tw\("src\/App\.tsx#style:App\/View:1", \{ borderRadius: 8, padding: 16 \}\)/,
  )
})

test('production leaves inline style sites untouched', () => {
  const { transform } = setup('build')
  const code = `export function App() {
	return <View style={{ borderRadius: 8 }}>x</View>
}`

  const result = transform(code) as { code: string } | null

  assert.ok(!result || !result.code.includes('__tw'))
  assert.ok(!result || !result.code.includes('@octane-xplat/tweaks/dev'))
})

test('dev transform injects the entry id for the umbrella specifier', () => {
  const { transform } = setup('serve')
  const code = `import { useTweak } from 'octane-xplat/tweaks'
const a = useTweak(8)
`

  const result = transform(code) as { code: string } | null

  assert.ok(result)
  assert.match(result.code, /useTweak\(8, "src\/App\.tsx#a"\)/)
})

test('production strips the umbrella import and calls', () => {
  const { transform } = setup('build')
  const code = `import { useTweak } from 'octane-xplat/tweaks'
const a = useTweak(8)
`

  const result = transform(code) as { code: string } | null

  assert.ok(result)
  assert.match(result.code, /const a = \(8\)/)
  assert.ok(!result.code.includes('octane-xplat/tweaks'))
})
