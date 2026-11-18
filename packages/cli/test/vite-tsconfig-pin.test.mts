import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, test } from 'node:test'
import { createServer } from 'vite'
import { boundary, transformTsconfig, tsrx } from '../dist/vite.js'

const temporary = []
function fixture(files) {
  const root = mkdtempSync(join(tmpdir(), 'xplat-tsconfig-pin-'))

  temporary.push(root)
  for (const [file, contents] of Object.entries(files)) {
    mkdirSync(dirname(join(root, file)), { recursive: true })
    writeFileSync(join(root, file), contents)
  }

  return root
}

afterEach(() =>
  temporary.splice(0).forEach((root) => rmSync(root, { recursive: true, force: true })),
)

const generated = 'node_modules/.cache/xplat-typecheck/web.json'
const dangling = (envs = '{"compilerOptions":{"strict":true}}') => ({
  'tsconfig.json': JSON.stringify({
    references: [{ path: './node_modules/.cache/xplat-typecheck/web.json' }],
  }),
  'tsconfig.envs.json': envs,
  'entry.ts': 'export const answer: number = 42',
})

async function serve(root, plugins, extra = {}) {
  let resolved
  const server = await createServer({
    configFile: false,
    root,
    logLevel: 'silent',
    ...extra,
    plugins: [...plugins, { name: 'probe', configResolved: (config) => (resolved = config) }],
    server: { middlewareMode: true },
  })

  return { server, resolved }
}

// Vite 8's oxc transform follows tsconfig project references — a
// references-style config pointing at ungenerated env programs used to fail
// every plain-source transform with TSCONFIG_ERROR outside app presets.
test('tsrx pins the transform tsconfig to the committed env manifest', async () => {
  const root = fixture(dangling())
  const { server, resolved } = await serve(root, [tsrx('web')])

  try {
    assert.equal(resolved.tsconfig, join(root, 'tsconfig.envs.json'))
    // The pinned transform actually compiles plain source (annotation gone).
    const result = await server.transformRequest('/entry.ts')
    assert.match(result.code, /answer\s*=\s*42/)
    assert.doesNotMatch(result.code, /answer\s*:\s*number/)
  } finally {
    await server.close()
  }
})

test('without an xplat plugin the dangling reference still fails loudly', async () => {
  const root = fixture(dangling())
  const { server } = await serve(root, [])

  try {
    await assert.rejects(server.transformRequest('/entry.ts'), /tsconfig/i)
  } finally {
    await server.close()
  }
})

test('the pin reaches nested roots through the nearest governing tsconfig', async () => {
  const root = fixture(dangling())
  const nested = join(root, 'test/.boundary-fixture')
  mkdirSync(nested, { recursive: true })
  writeFileSync(join(nested, 'package.json'), '{"type":"module"}')
  writeFileSync(join(nested, 'entry.ts'), 'export const answer: number = 42')

  const { server, resolved } = await serve(nested, [tsrx('web')])

  try {
    assert.equal(resolved.tsconfig, join(root, 'tsconfig.envs.json'))
    assert.match((await server.transformRequest('/entry.ts')).code, /answer\s*=\s*42/)
  } finally {
    await server.close()
  }
})

test('boundary keeps the server boundary config fragment alongside the pin', async () => {
  const root = fixture(dangling())
  const { server, resolved } = await serve(root, [boundary('web')])

  try {
    assert.equal(resolved.tsconfig, join(root, 'tsconfig.envs.json'))
    assert.equal(resolved.build.rollupOptions.output.sourcemapExcludeSources, true)
    assert.match((await server.transformRequest('/entry.ts')).code, /answer\s*=\s*42/)
  } finally {
    await server.close()
  }
})

test('an explicit tsconfig wins and generated programs resume discovery', async () => {
  const root = fixture(dangling())

  let probe = await serve(root, [tsrx('web')], { tsconfig: 'app-tsconfig.json' })
  try {
    assert.match(probe.resolved.tsconfig, /app-tsconfig\.json$/)
  } finally {
    await probe.server.close()
  }

  mkdirSync(dirname(join(root, generated)), { recursive: true })
  writeFileSync(join(root, generated), '{}')
  assert.equal(transformTsconfig(root), undefined)

  probe = await serve(root, [tsrx('web')])
  try {
    assert.notEqual(probe.resolved.tsconfig, join(root, 'tsconfig.envs.json'))
    assert.match((await probe.server.transformRequest('/entry.ts')).code, /answer\s*=\s*42/)
  } finally {
    await probe.server.close()
  }
})

test('transformTsconfig resolves only beside a manifest', () => {
  const root = fixture(dangling())
  assert.equal(transformTsconfig(root), join(root, 'tsconfig.envs.json'))
  assert.equal(transformTsconfig(join(root, 'deeply/nested/fixture')), join(root, 'tsconfig.envs.json'))

  rmSync(join(root, 'tsconfig.envs.json'))
  assert.equal(transformTsconfig(root), undefined)
  assert.equal(transformTsconfig(join(tmpdir(), 'xplat-tsconfig-pin-absent')), undefined)
})
