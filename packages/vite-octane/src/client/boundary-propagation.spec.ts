import { describe, expect, it } from 'vitest'
import {
  normalizeDepGraphKey,
  propagateToAcceptingBoundaries,
  type DepGraphModuleLike,
} from './boundary-propagation.js'

function makeGraph(entries: Array<[string, string[]]>): Map<string, DepGraphModuleLike> {
  return new Map(entries.map(([id, deps]) => [id, { id, deps }]))
}

const accepting = (...keys: string[]) => {
  const set = new Set(keys)
  return {
    acceptsSelf: (key: string) => set.has(key),
    acceptsDep: () => false,
  }
}
const self = (key: string) => ({ kind: 'self' as const, key })

describe('normalizeDepGraphKey', () => {
  it('strips queries and script extensions, ensures a leading slash', () => {
    expect(normalizeDepGraphKey('/src/app.tsx')).toBe('/src/app')
    expect(normalizeDepGraphKey('/src/app.tsx?t=1')).toBe('/src/app')
    expect(normalizeDepGraphKey('src/octane/elements.ts')).toBe('/src/octane/elements')
    expect(normalizeDepGraphKey('')).toBe('')
  })
})

describe('propagateToAcceptingBoundaries', () => {
  // The app shape: index.ts (entry, never accepts) mounts App from app.tsx
  // (compiled self-accepting); app.tsx imports theme.ts (plain module).
  const graph = makeGraph([
    ['/src/index.ts', ['/src/app.tsx', '/src/octane/driver.ts']],
    ['/src/app.tsx', ['/src/theme.ts', '/src/octane/renderer.ts']],
    ['/src/theme.ts', []],
    ['/src/octane/renderer.ts', ['/src/octane/driver.ts']],
    ['/src/octane/driver.ts', ['/src/octane/elements.ts']],
    ['/src/octane/elements.ts', []],
  ])

  it('treats a self-accepting changed module as its own boundary', () => {
    const plan = propagateToAcceptingBoundaries(['/src/app.tsx'], graph, accepting('/src/app'))
    expect(plan).toEqual({
      boundaries: [self('/src/app')],
      evict: ['/src/app'],
      dead: [],
    })
  })

  it('walks a plain dependency up to the nearest accepting importer', () => {
    const plan = propagateToAcceptingBoundaries(['/src/theme.ts'], graph, accepting('/src/app'))
    expect(plan.boundaries).toEqual([self('/src/app')])
    expect(plan.evict).toEqual(['/src/theme', '/src/app'])
    expect(plan.dead).toEqual([])
  })

  it('reports a change whose importer chain reaches the entry as dead', () => {
    // driver.ts is imported by the entry directly; nothing can accept it.
    const plan = propagateToAcceptingBoundaries(
      ['/src/octane/driver.ts'],
      graph,
      accepting('/src/app'),
    )
    expect(plan.boundaries).toEqual([self('/src/app')])
    expect(plan.dead).toEqual(['/src/octane/driver'])
  })

  it('a self-accepting registry module short-circuits the walk (the element-vocabulary case)', () => {
    const plan = propagateToAcceptingBoundaries(
      ['/src/octane/elements.ts'],
      graph,
      accepting('/src/app', '/src/octane/elements'),
    )
    expect(plan).toEqual({
      boundaries: [self('/src/octane/elements')],
      evict: ['/src/octane/elements'],
      dead: [],
    })
  })

  it('reports an orphan (no importers, not accepting) as dead', () => {
    const plan = propagateToAcceptingBoundaries(['/src/orphan.ts'], graph, accepting('/src/app'))
    expect(plan).toEqual({
      boundaries: [],
      evict: ['/src/orphan'],
      dead: ['/src/orphan'],
    })
  })

  it('matches regardless of which side carries the extension', () => {
    const g = makeGraph([['/src/app.tsx', ['/src/theme']]])
    expect(
      propagateToAcceptingBoundaries(['/src/theme.ts'], g, accepting('/src/app')).boundaries,
    ).toEqual([self('/src/app')])
  })

  it('terminates a boundary-less cycle and reports it dead', () => {
    const g = makeGraph([
      ['/src/a.ts', ['/src/b.ts']],
      ['/src/b.ts', ['/src/a.ts']],
    ])
    const plan = propagateToAcceptingBoundaries(['/src/a.ts'], g, accepting())
    expect(plan.boundaries).toEqual([])
    expect(plan.dead).toEqual(['/src/a'])
  })

  it('deduplicates boundaries shared by several changed modules', () => {
    const g = makeGraph([
      ['/src/app.tsx', ['/src/a.ts', '/src/b.ts']],
      ['/src/a.ts', []],
      ['/src/b.ts', []],
    ])
    const plan = propagateToAcceptingBoundaries(
      ['/src/a.ts', '/src/b.ts'],
      g,
      accepting('/src/app'),
    )
    expect(plan.boundaries).toEqual([self('/src/app')])
    expect(plan.evict).toEqual(['/src/a', '/src/app', '/src/b'])
  })

  it('an importer accepting the dependency by path consumes the update without re-evaluating', () => {
    const g = makeGraph([
      ['/src/index.ts', ['/src/flame.ts']],
      ['/src/flame.ts', ['/src/flame.worker.ts']],
      ['/src/flame.worker.ts', []],
    ])
    const plan = propagateToAcceptingBoundaries(['/src/flame.worker.ts'], g, {
      acceptsSelf: () => false,
      acceptsDep: (importer, dep) => importer === '/src/flame' && dep === '/src/flame.worker',
    })
    expect(plan.boundaries).toEqual([{ kind: 'dep', key: '/src/flame', dep: '/src/flame.worker' }])
    // The acceptor is not re-imported, so it is not on the eviction list.
    expect(plan.evict).toEqual(['/src/flame.worker'])
    expect(plan.dead).toEqual([])
  })
})
