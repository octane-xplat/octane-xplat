/**
 * Reverse-import-graph propagation to the nearest self-accepting boundaries
 * (Vite's `propagateUpdate`, expressed over the client's module graph).
 *
 * Octane compiles every module that exports a renderer-owned component into a
 * self-accepting module (`import.meta.hot.accept(m => Comp[HMR].update(...))`),
 * so a component edit is applied in place by the module's own accept callback.
 * A plain dependency edit (a util, a theme module, the driver's element
 * registry) produces no accept callback of its own: the fresh body sits in the
 * runtime registry while every live importer still holds the previous
 * instance. This walk finds the importers that DO accept, so the strategy can
 * evict the path and re-import those boundaries — and reports the changes for
 * which no accepting importer exists, which is the full-reload signal.
 *
 * Pure (graph in, decision out) so the propagation policy is unit testable
 * without booting the device runtime.
 */

export interface DepGraphModuleLike {
  id: string
  deps: string[]
}

export interface AcceptPredicates {
  /** The module's current evaluation called the self form of `hot.accept`. */
  acceptsSelf(key: string): boolean
  /** `importer`'s current evaluation accepts updates to `dep` by path. */
  acceptsDep(importer: string, dep: string): boolean
}

export type Boundary =
  /** Re-import `key`, then fire its own accept callbacks. */
  | { kind: 'self'; key: string }
  /** Fire `key`'s dependency acceptor for `dep`; `key` itself stays as is. */
  | { kind: 'dep'; key: string; dep: string }

export interface BoundaryPropagation {
  /** Accepting modules, nearest first, deduplicated per (kind, key, dep). */
  boundaries: Boundary[]
  /**
   * Every module on a changed→boundary path, the changed modules and the
   * boundaries included. All of them must be evicted before the boundaries
   * are re-imported, or the boundary's fresh evaluation links against the
   * stale intermediate bodies still registered under their canonical keys.
   */
  evict: string[]
  /**
   * Changed modules with at least one importer chain that ends at a
   * non-accepting root (the app entry) or is closed by a cycle with no
   * boundary. Nothing can apply these in place; the caller must reload the
   * module graph.
   */
  dead: string[]
}

// Keep in sync with the client utils' canonical-URL extension stripping: the
// graph may record a dep as `/src/theme.ts` while the changed id arrives as
// `/src/theme` — both must key identically.
const SCRIPT_EXT_RE = /\.(ts|tsx|js|jsx|mjs|mts|cts)$/i

export function normalizeDepGraphKey(id: string): string {
  let key = String(id || '').split('?')[0]
  if (!key) {
    return ''
  }
  if (!key.startsWith('/')) {
    key = '/' + key
  }
  return key.replace(SCRIPT_EXT_RE, '')
}

export function propagateToAcceptingBoundaries(
  changedIds: readonly string[],
  graph: ReadonlyMap<string, DepGraphModuleLike>,
  accepts: AcceptPredicates,
): BoundaryPropagation {
  const result: BoundaryPropagation = { boundaries: [], evict: [], dead: [] }
  if (!changedIds?.length) {
    return result
  }

  // Reverse index: normalized dep key → normalized importer keys.
  const importersOf = new Map<string, Set<string>>()
  for (const [id, mod] of graph) {
    const importer = normalizeDepGraphKey(id)
    if (!importer) {
      continue
    }
    for (const dep of Array.isArray(mod?.deps) ? mod.deps : []) {
      const key = normalizeDepGraphKey(dep)
      if (!key || key === importer) {
        continue
      }
      let set = importersOf.get(key)
      if (!set) {
        set = new Set()
        importersOf.set(key, set)
      }
      set.add(importer)
    }
  }

  const boundarySeen = new Set<string>()
  const addBoundary = (boundary: Boundary) => {
    const id =
      boundary.kind === 'self' ? `self:${boundary.key}` : `dep:${boundary.key}:${boundary.dep}`
    if (boundarySeen.has(id)) {
      return
    }
    boundarySeen.add(id)
    result.boundaries.push(boundary)
  }
  const evictSeen = new Set<string>()
  const addEvict = (key: string) => {
    if (evictSeen.has(key)) {
      return
    }
    evictSeen.add(key)
    result.evict.push(key)
  }

  for (const raw of changedIds) {
    const start = normalizeDepGraphKey(raw)
    if (!start) {
      continue
    }
    addEvict(start)
    if (accepts.acceptsSelf(start)) {
      addBoundary({ kind: 'self', key: start })
      continue
    }

    // BFS upward from the changed module. An importer that accepts the
    // node by path consumes the update without re-evaluating; one that
    // accepts itself is re-imported; any other importer is walked through.
    // A branch with no importers has reached a root.
    const visited = new Set<string>([start])
    const queue: string[] = [start]
    let reachedRoot = false
    let foundBoundary = false
    while (queue.length) {
      const key = queue.shift()!
      const importers = importersOf.get(key)
      if (!importers || importers.size === 0) {
        reachedRoot = true
        continue
      }
      for (const importer of importers) {
        if (accepts.acceptsDep(importer, key)) {
          foundBoundary = true
          addBoundary({ kind: 'dep', key: importer, dep: key })
          continue
        }
        if (visited.has(importer)) {
          continue
        }
        visited.add(importer)
        addEvict(importer)
        if (accepts.acceptsSelf(importer)) {
          foundBoundary = true
          addBoundary({ kind: 'self', key: importer })
          continue
        }
        queue.push(importer)
      }
    }
    if (reachedRoot || !foundBoundary) {
      result.dead.push(start)
    }
  }

  return result
}
