import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { FrameworkClientBatchContext } from '@nativescript/vite/hmr/client/framework.js'
import { getNsHotRegistry } from '@nativescript/vite/hmr/client/framework.js'
import { octaneClientStrategy } from './strategy.js'

// The strategy talks to the real process-wide hot registry; each test uses
// its own module keys so state never leaks between them. `install()` is
// idempotent and wires the full-reload listeners.
octaneClientStrategy.install()

function ctx(): FrameworkClientBatchContext {
  return { setUpdateOverlayStage: vi.fn(), startedAt: 0, graph: new Map() }
}

/** A fresh evaluation of `key`: the injected prelude, then the compiled accept tail. */
function evaluate(key: string, accept?: (...args: unknown[]) => unknown) {
  const hot = getNsHotRegistry().createHotContext(key)
  if (accept) {
    hot.accept(accept)
  }
  return hot
}

describe('octaneClientStrategy — which accept callback fires', () => {
  it('keeps firing the first evaluation’s callback across generations', async () => {
    const key = '/src/gen/app.tsx'
    const gen1 = vi.fn()
    const gen2 = vi.fn()
    const gen3 = vi.fn()
    evaluate(key, gen1)

    // Edit 1: evict, re-evaluate (registers gen2), accept with the fresh namespace.
    octaneClientStrategy.beforeBatchEvict!([key])
    evaluate(key, gen2)
    octaneClientStrategy.afterModuleReimport!(key, { App: 'v2' })
    expect(gen1).toHaveBeenCalledWith({ App: 'v2' })
    expect(gen2).not.toHaveBeenCalled()

    // Edit 2: the registry now holds gen2, but gen2 closes over a wrapper nobody
    // rendered. The live wrapper is gen1's; gen1 must receive v3.
    octaneClientStrategy.beforeBatchEvict!([key])
    evaluate(key, gen3)
    octaneClientStrategy.afterModuleReimport!(key, { App: 'v3' })
    expect(gen1).toHaveBeenLastCalledWith({ App: 'v3' })
    expect(gen2).not.toHaveBeenCalled()
    expect(gen3).not.toHaveBeenCalled()
    await octaneClientStrategy.refreshAfterBatch!([key], ctx())
  })

  it('drops the anchor when an evaluation stops accepting', async () => {
    const key = '/src/gen/stops.tsx'
    const gen1 = vi.fn()
    evaluate(key, gen1)
    octaneClientStrategy.beforeBatchEvict!([key])
    evaluate(key) // no accept any more
    octaneClientStrategy.afterModuleReimport!(key, { App: 'v2' })
    expect(gen1).toHaveBeenCalledTimes(1)

    octaneClientStrategy.beforeBatchEvict!([key])
    evaluate(key)
    octaneClientStrategy.afterModuleReimport!(key, { App: 'v3' })
    expect(gen1).toHaveBeenCalledTimes(1)
    await octaneClientStrategy.refreshAfterBatch!([key], ctx())
  })

  it('keeps the anchor across a failed evaluation so the fix applies in place', async () => {
    const key = '/src/gen/broken.tsx'
    const gen1 = vi.fn()
    evaluate(key, gen1)

    // The broken save: the prelude runs (registry reset), the body throws before
    // `hot.accept`, the queue never calls afterModuleReimport.
    octaneClientStrategy.beforeBatchEvict!([key])
    getNsHotRegistry().createHotContext(key)
    await octaneClientStrategy.refreshAfterBatch!([key], ctx())
    expect(gen1).not.toHaveBeenCalled()

    // The fix: registry still shows no accept for the key, but the live wrapper
    // is untouched and gen1 still reaches it.
    octaneClientStrategy.beforeBatchEvict!([key])
    const gen3 = vi.fn()
    evaluate(key, gen3)
    octaneClientStrategy.afterModuleReimport!(key, { App: 'v3' })
    expect(gen1).toHaveBeenCalledWith({ App: 'v3' })
    expect(gen3).not.toHaveBeenCalled()
    await octaneClientStrategy.refreshAfterBatch!([key], ctx())
  })
})

describe('octaneClientStrategy — modules this realm never loaded', () => {
  const g = globalThis as any
  let previousRequire: unknown

  beforeEach(() => {
    previousRequire = g.require
    g.require = (specifier: string) =>
      specifier === 'ns:module'
        ? {
            getLoadedModuleUrls: () => ['http://localhost:5173/ns/m/src/realm/spawner'],
          }
        : undefined
  })
  afterEach(() => {
    g.require = previousRequire
  })

  it('does not queue a worker script, and routes it to the importer that accepts it by path', () => {
    const onWorkerChange = vi.fn()
    getNsHotRegistry()
      .createHotContext('/src/realm/spawner.ts')
      .accept('./spawner.worker', onWorkerChange)

    expect(octaneClientStrategy.shouldQueueReimport!('/src/realm/spawner.worker.ts')).toBe(false)
    octaneClientStrategy.applyUnqueuedChanges!(['/src/realm/spawner.worker.ts'])
    expect(onWorkerChange).toHaveBeenCalledWith([undefined])
  })

  it('ignores a type-only module nothing accepts', () => {
    expect(octaneClientStrategy.shouldQueueReimport!('/src/realm/intrinsics.ts')).toBe(false)
    expect(() =>
      octaneClientStrategy.applyUnqueuedChanges!(['/src/realm/intrinsics.ts']),
    ).not.toThrow()
  })

  it('queues a module the realm holds, once loaded is remembered across eviction', () => {
    getNsHotRegistry()
      .createHotContext('/src/realm/spawner.ts')
      .accept(() => {})
    expect(octaneClientStrategy.shouldQueueReimport!('/src/realm/spawner.ts')).toBe(true)
    // Mid-cycle the registry no longer lists it; history still says it is ours.
    g.require = (specifier: string) =>
      specifier === 'ns:module' ? { getLoadedModuleUrls: () => [] } : undefined
    expect(octaneClientStrategy.shouldQueueReimport!('/src/realm/spawner.ts')).toBe(true)
  })
})
