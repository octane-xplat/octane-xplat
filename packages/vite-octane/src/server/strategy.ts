import * as path from 'node:path'
import {
  purgeTransformCachesForHotUpdate,
  runHotUpdatePrologue,
  typescriptServerStrategy,
  type FrameworkServerStrategy,
} from '@nativescript/vite/framework'

/**
 * Octane server strategy.
 *
 * Octane needs no server-side HMR transform of its own: `@octanejs/vite-plugin`
 * compiles each component module with `import.meta.hot.accept` wiring while the
 * dev server is serving, and the device pipeline serves that output as-is. The
 * generic TypeScript strategy supplies the device-module pipeline; what Octane
 * adds is the broadcast ordering the client's accept cycle depends on. The
 * client applies an edit by evicting and re-fetching the changed module, so
 * the shared + Vite transform caches for the file and its transitive importers
 * must be purged, and the module re-transformed, BEFORE the delta goes out —
 * otherwise the re-fetch can be served from the previous save's transform and
 * the screen ends up one save behind.
 */

interface HmrSocket {
  readyState?: number
  OPEN?: number
}

const SCRIPT_FILE_RE = /\.(?:[mc]?[jt]sx?|tsrx)$/i

export const octaneServerStrategy: FrameworkServerStrategy = {
  ...typescriptServerStrategy,
  flavor: 'octane',
  matchesFile(id) {
    // Shared sources have workspace/@fs identities rather than /src IDs.
    // Source-root gating remains in runHotUpdatePrologue; dependency and
    // type/test files must not enter executable transaction batches.
    const clean = id.replace(/[?#].*$/, '')
    return (
      SCRIPT_FILE_RE.test(clean) &&
      !/(?:^|\/)(?:node_modules|__tests__|__mocks__)(?:\/|$)|\.(?:spec|test)\.[^/]+$|\.d\.(?:ts|mts|cts)$/i.test(
        clean,
      )
    )
  },
  deferDeltaBroadcast: true,
  async handleHotUpdate(ctx, deps) {
    const state = await runHotUpdatePrologue(ctx, deps)
    if (!state) {
      return
    }
    const { root, metrics, emitSummary } = state
    const { moduleGraph, verbose, sharedTransformRequest, wss, isSocketClientOpen } = deps
    const { file, server } = ctx
    if (!SCRIPT_FILE_RE.test(file)) {
      emitSummary()
      return
    }
    metrics.tAfterFramework = Date.now()
    try {
      const rel = '/' + path.posix.normalize(path.relative(root, file)).split(path.sep).join('/')
      const normalizedId = moduleGraph.normalizeGraphId(file)
      if (!moduleGraph.get(normalizedId)) {
        moduleGraph.upsert(normalizedId, `/* octane-hmr ${Date.now()} */`, [], {
          emitDeltaOnInsert: true,
        })
      }
      purgeTransformCachesForHotUpdate({
        file,
        server,
        sharedTransformRequest,
        verbose,
        label: 'octane',
      })
      try {
        const transformId = path.relative(root, file).startsWith('..' + path.sep)
          ? '/@fs/' + file.replace(/\\/g, '/')
          : rel
        const fresh = await sharedTransformRequest(transformId, 30000)
        if (fresh?.code) {
          const viteModule = server.moduleGraph.getModuleById(file)
          const deps = viteModule
            ? Array.from(viteModule.importedModules)
                .map((m) => (m.id || '').replace(/\?.*$/, ''))
                .filter(Boolean)
            : (moduleGraph.get(normalizedId)?.deps ?? [])
          moduleGraph.upsert(normalizedId, fresh.code, deps, {
            broadcastDelta: false,
          })
        }
      } catch (e) {
        if (verbose) {
          console.warn('[hmr-ws][octane] post-invalidation re-transform failed', e)
        }
      }
      const gm = moduleGraph.get(normalizedId)
      if (gm) {
        moduleGraph.emitDelta([gm], [])
      }
      // The ns:hmr-delta broadcast IS the update delivery for this flavor —
      // count open sockets so the always-on summary reflects reality
      // instead of reporting recipients=0 for a delivered update.
      try {
        wss?.clients?.forEach((client: HmrSocket) => {
          if (isSocketClientOpen?.(client)) {
            metrics.recipients += 1
          }
        })
      } catch {}
    } catch (e) {
      if (verbose) {
        console.warn('[hmr-ws][octane] failed to handle hot update for', file, e)
      }
    }
    emitSummary()
  },
}
