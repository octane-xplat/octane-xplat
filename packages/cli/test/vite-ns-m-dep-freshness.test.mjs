import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { pathToFileURL } from 'node:url'

// octane-xplat#161 — a patch install rewrites a source-served dependency
// under node_modules without a Vite file event, so /ns/m kept serving the
// pre-install transform. The request pipeline now fingerprints resolved
// dependency files (mtime+size) and lets the route purge both cache layers
// when the on-disk bytes drift.
const require = createRequire(import.meta.url)
const viteEntry = require.resolve('@nativescript/vite')
const viteRoot = dirname(viteEntry)
const serverFile = (name) => pathToFileURL(join(viteRoot, 'hmr/server', name)).href

const { createNsMRequestContext, resolveNsMTransformedModule } = await import(
  serverFile('websocket-ns-m-request.js')
)
const { servedDependencyFileChanged, purgeTransformCachesForHotUpdate } = await import(
  serverFile('transform-cache-invalidation.js')
)

const makeProject = () => {
  const root = mkdtempSync(join(tmpdir(), 'xplat-nsm-freshness-'))
  const depDir = join(root, 'node_modules', '@scope', 'dep')
  mkdirSync(depDir, { recursive: true })
  const depFile = join(depDir, 'leaf.ts')
  writeFileSync(depFile, 'export const value = 1\n')
  return { root, depFile }
}

const contextFor = (root) =>
  createNsMRequestContext('/ns/m/node_modules/@scope/dep/leaf.ts', root, '/app/', null)

test('/ns/m reports resolved dependency files through notifyServedDependencyFile', async () => {
  const { root, depFile } = makeProject()
  try {
    const context = contextFor(root)
    assert.equal(context.kind, 'context')
    const seen = []
    const result = await resolveNsMTransformedModule({
      context: context.value,
      transformRequest: async (url) => ({ code: `// transformed ${url}` }),
      resolveId: async () => null,
      loadVirtualId: async () => null,
      notifyServedDependencyFile: (file) => seen.push(file),
    })
    assert.match(result.transformed.code, /transformed/)
    assert.deepEqual(seen, [depFile])
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('servedDependencyFileChanged only fires after the fingerprinted baseline drifts', async () => {
  const { root, depFile } = makeProject()
  try {
    assert.equal(servedDependencyFileChanged(depFile), false, 'first serve records the baseline')
    assert.equal(servedDependencyFileChanged(depFile), false, 'unchanged file stays cached')
    // A patch install rewrites content: mtime moves forward.
    const future = Date.now() / 1000 + 5
    writeFileSync(depFile, 'export const value = 2\n')
    const { utimesSync } = await import('node:fs')
    utimesSync(depFile, future, future)
    assert.equal(servedDependencyFileChanged(depFile), true, 'rewritten file invalidates')
    assert.equal(servedDependencyFileChanged(depFile), false, 'new baseline is recorded')
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('stale dependency serve re-transforms after purgeTransformCachesForHotUpdate', async () => {
  const { root, depFile } = makeProject()
  try {
    const context = contextFor(root)
    let generation = 0
    const transformRequest = async (url) => ({ code: `// gen${generation} ${url}` })
    const invalidated = []
    const cleared = []
    const server = {
      config: { root },
      moduleGraph: {
        getModulesByFile: () => [],
        onFileChange: (file) => invalidated.push(file),
        invalidateModule: () => {},
      },
    }
    const sharedTransformRequest = {
      invalidateMany: (urls) => cleared.push([...urls]),
      clear: () => cleared.push('clear'),
    }
    const notify = (file) => {
      if (!servedDependencyFileChanged(file)) {
        return
      }
      purgeTransformCachesForHotUpdate({
        file,
        server,
        sharedTransformRequest,
        verbose: false,
        label: 'ns:m-deps',
      })
    }

    // First serve caches generation 0.
    const first = await resolveNsMTransformedModule({
      context: context.value,
      transformRequest,
      resolveId: async () => null,
      loadVirtualId: async () => null,
      notifyServedDependencyFile: notify,
    })
    assert.match(first.transformed.code, /gen0/)
    assert.deepEqual(cleared, [])

    // Patch install rewrites the dep; the next serve must invalidate before
    // transforming so the response carries generation 1.
    writeFileSync(depFile, 'export const value = 2 /* patched */\n')
    const future = Date.now() / 1000 + 5
    const { utimesSync } = await import('node:fs')
    utimesSync(depFile, future, future)
    generation = 1
    const second = await resolveNsMTransformedModule({
      context: contextFor(root).value,
      transformRequest,
      resolveId: async () => null,
      loadVirtualId: async () => null,
      notifyServedDependencyFile: notify,
    })
    assert.deepEqual(invalidated, [depFile])
    assert.deepEqual(cleared.at(-1), 'clear')
    assert.match(second.transformed.code, /gen1/)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
