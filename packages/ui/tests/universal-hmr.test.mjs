import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, test } from 'node:test'
import { pathToFileURL } from 'node:url'

const require = createRequire(import.meta.url)
const runtimeUrl = pathToFileURL(require.resolve('octane/universal/native')).href
const { compile } = await import(pathToFileURL(require.resolve('octane/compiler')))
const {
  UNIVERSAL_HMR,
  createObjectContainer,
  createObjectDriver,
  createUniversalRoot,
  flushUniversalAct,
  flushUniversalSync,
} = await import(runtimeUrl)

// octane-xplat#152 — the universal compiler assigns hook slots by global
// ordinal, so inserting an earlier hook shifts every later slot onto a
// different hook's record. A live update must not let a revised component
// inherit another hook's storage: an incompatible signature starts a fresh
// owner, running old ref/effect cleanups against the old hooks.
const directory = mkdtempSync(join(tmpdir(), 'xplat-universal-hmr-'))
after(() => rmSync(directory, { recursive: true, force: true }))

const compiledModule = (name, source) => {
  const code = compile(source, 'probe.tsx', {
    dev: true,
    hmr: 'vite',
    renderer: { id: 'test', module: runtimeUrl, target: 'universal' },
  }).code.replace(/from\s*(['"])([^'"]+)\1/g, (match, quote, specifier) =>
    specifier === 'octane/universal/native' ? `from ${JSON.stringify(runtimeUrl)}` : match,
  )
  const path = join(directory, name + '.mjs')
  writeFileSync(path, code)
  return pathToFileURL(path).href
}

const version1 = `import { useRef, useEffect } from 'octane'
export function Probe() {
  const timer = useRef(null)
  const tiles = useRef(new Map())
  const feed = useRef(null)
  useEffect(() => {
    globalThis.__hmrProbe.push(['effect', 'mount'])
    if (timer.current) { clearTimeout(timer.current); timer.current = null }
    return () => globalThis.__hmrProbe.push(['effect', 'cleanup'])
  }, [])
  return <feed ref={feed}><tile version={1} ref={v => {
    globalThis.__hmrProbe.push(['tile-ref', v === null ? 'detach' : 'attach'])
    if (v) tiles.current.set('clip', v)
    else tiles.current.delete('clip')
  }} /></feed>
}
`

// The added leading effect shifts every later hook slot one ordinal.
const version2 = `import { useRef, useEffect } from 'octane'
export function Probe() {
  useEffect(() => {
    globalThis.__hmrProbe.push(['effect', 'v2-mount'])
    return () => globalThis.__hmrProbe.push(['effect', 'v2-cleanup'])
  }, [])
  const timer = useRef(null)
  const tiles = useRef(new Map())
  const feed = useRef(null)
  useEffect(() => {
    globalThis.__hmrProbe.push(['effect', 'mount'])
    if (timer.current) { clearTimeout(timer.current); timer.current = null }
    return () => globalThis.__hmrProbe.push(['effect', 'cleanup'])
  }, [])
  return <feed ref={feed}><tile version={2} ref={v => {
    globalThis.__hmrProbe.push(['tile-ref', v === null ? 'detach' : 'attach'])
    if (v) tiles.current.set('clip', v)
    else tiles.current.delete('clip')
  }} /></feed>
}
`

const outer = `import { Probe } from './version-one.mjs'
export function Outer() {
  return <outer><Probe /></outer>
}
`

const compiledOuter = (name, probeSpecifier) => {
  const code = compile(outer, 'outer.tsx', {
    dev: true,
    hmr: 'vite',
    renderer: { id: 'test', module: runtimeUrl, target: 'universal' },
  }).code.replace(/from\s*(['"])([^'"]+)\1/g, (match, quote, specifier) => {
    if (specifier === 'octane/universal/native') {
      return `from ${JSON.stringify(runtimeUrl)}`
    }
    if (specifier === './version-one.mjs') {
      return `from ${JSON.stringify(probeSpecifier)}`
    }
    return match
  })
  const path = join(directory, name + '.mjs')
  writeFileSync(path, code)
  return pathToFileURL(path).href
}

const mount = (component, props) => {
  const container = createObjectContainer('test')
  const root = createUniversalRoot(container, createObjectDriver('test'), {
    scheduleMicrotask: (task) => queueMicrotask(task),
  })
  flushUniversalAct(() => root.render(component, props))
  const nodes = () => {
    const visit = (children) => children.flatMap((node) => [node, ...visit(node.children ?? [])])
    return visit(container.children)
  }
  return { container, root, nodes }
}

let sequence = 0
const mountProbe = async () => {
  globalThis.__hmrProbe = []
  const id = ++sequence
  const one = compiledModule(`version-one-${id}`, version1)
  const two = compiledModule(`version-two-${id}`, version2)
  const v1 = await import(one)
  const v2 = await import(two)
  const { Outer } = await import(compiledOuter(`outer-${id}`, one))
  return { v1, v2, Outer }
}

test('universal HMR remounts a root component when its hook signature shifts', async () => {
  const { v1, v2 } = await mountProbe()
  const mounted = mount(v1.Probe)
  assert.equal(mounted.nodes()[0].type, 'feed')
  assert.equal(mounted.nodes()[1].type, 'tile')
  assert.equal(mounted.nodes()[1].props.version, 1)
  assert.deepEqual(globalThis.__hmrProbe, [
    ['tile-ref', 'attach'],
    ['effect', 'mount'],
  ])

  globalThis.__hmrProbe.length = 0
  const revision = v1.Probe[UNIVERSAL_HMR]
  flushUniversalAct(() => flushUniversalSync(() => revision.update(v2.Probe)))

  // The old revision's cleanups ran against its own hooks; the new revision
  // mounted independently with fresh ref storage.
  assert.deepEqual(globalThis.__hmrProbe, [
    ['tile-ref', 'detach'],
    ['tile-ref', 'attach'],
    ['effect', 'cleanup'],
    ['effect', 'v2-mount'],
    ['effect', 'mount'],
  ])
  const retiled = mounted.nodes().find((node) => node.type === 'tile')
  assert.equal(retiled.props.version, 2)

  // A further commit still routes ref cleanup through the live Map.
  globalThis.__hmrProbe.length = 0
  flushUniversalAct(() => mounted.root.render(v1.Probe))
  assert.ok(
    globalThis.__hmrProbe.every((entry) => entry[0] === 'tile-ref' || entry[0] === 'effect'),
    'ref cleanup must not crash',
  )
})

test('universal HMR remounts a nested component when its hook signature shifts', async () => {
  const { v1, v2, Outer } = await mountProbe()
  const mounted = mount(Outer)
  assert.equal(mounted.nodes()[0].type, 'outer')
  assert.equal(mounted.nodes()[2].type, 'tile')

  globalThis.__hmrProbe.length = 0
  flushUniversalAct(() => flushUniversalSync(() => v1.Probe[UNIVERSAL_HMR].update(v2.Probe)))

  assert.deepEqual(globalThis.__hmrProbe, [
    ['tile-ref', 'detach'],
    ['tile-ref', 'attach'],
    ['effect', 'cleanup'],
    ['effect', 'v2-mount'],
    ['effect', 'mount'],
  ])
  const retiled = mounted.nodes().find((node) => node.type === 'tile')
  assert.equal(retiled.props.version, 2)
  assert.equal(mounted.nodes()[0].type, 'outer')
})
