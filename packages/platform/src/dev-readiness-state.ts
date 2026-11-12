/** Registered work in one development-action subtree; this is not a paint receipt. */
export interface DevReadinessSnapshot {
  /** Static, non-sensitive scope label. */
  scope: string
  /** Changes whenever registered work or child membership changes. */
  revision: number
  /** Labels of pending work, including nested scopes. */
  pending: string[]
}

/** Context-owned readiness controller. Each wait has its own cancellation and deadline. */
export interface DevReadinessScope {
  /** Read registered work without waiting. */
  snapshot(): DevReadinessSnapshot
  /** Register pending work; releasing the returned lease is idempotent. */
  hold(label: string): () => void
  /** Include a nested scope until the returned subscription is released. */
  include(child: DevReadinessScope): () => void
  /** Observe changes to registered work. */
  subscribe(notify: () => void): () => void
  /** Wait for registered work to settle across an event-loop turn. Does not prove native presentation. */
  wait(options: { signal: AbortSignal; timeoutMs: number }): Promise<DevReadinessSnapshot>
  /** End this owner, aborting its waits. */
  dispose(): void
}

/** A readiness deadline, cancellation, or disposed owner, with pending-work diagnostics. */
export class DevReadinessError extends Error {
  /** Why readiness could not be established. */
  readonly code: 'readiness_timeout' | 'readiness_cancelled' | 'readiness_disposed'
  /** Last observed registered work. */
  readonly readiness: DevReadinessSnapshot

  constructor(code: DevReadinessError['code'], readiness: DevReadinessSnapshot) {
    super(
      `${code}: ${readiness.scope}${readiness.pending.length ? ` (${readiness.pending.join(', ')})` : ''}`,
    )

    this.name = 'DevReadinessError'
    this.code = code
    this.readiness = readiness
  }
}

const scopeChildren = new WeakMap<DevReadinessScope, Set<DevReadinessScope>>()

/**
 * Create an isolated readiness owner. Prefer DevActionScope in components;
 * non-component services can hold/release work directly. Labels must not contain user data.
 * @example
 * import { createDevReadinessScope } from '@octane-xplat/platform/dev-actions'
 * const scope = createDevReadinessScope('Fixture')
 * const release = scope.hold('Loading fixture')
 * release()
 * scope.dispose()
 */
export function createDevReadinessScope(label: string): DevReadinessScope {
  const pending = new Map<object, string>()
  const children = new Map<DevReadinessScope, () => void>()
  const listeners = new Set<() => void>()
  let revision = 0
  let disposed = false
  const notify = () => {
    revision++

    // Snapshot membership: callbacks can register or remove listeners.
    const current = [...listeners]

    for (const listener of current) {
      listener()
    }
  }

  const snapshot = (): DevReadinessSnapshot => ({
    scope: label,
    revision,
    pending: [
      ...pending.values(),
      ...[...children.keys()].flatMap((child) => {
        const state = child.snapshot()

        return state.pending.map((item) => `${state.scope}: ${item}`)
      }),
    ],
  })

  const assertLive = () => {
    if (disposed) {
      throw new DevReadinessError('readiness_disposed', snapshot())
    }
  }

  const scope: DevReadinessScope = {
    snapshot,
    hold(work) {
      assertLive()

      const key = {}

      pending.set(key, work)
      notify()
      return () => {
        if (pending.delete(key)) {
          notify()
        }
      }
    },
    include(child) {
      assertLive()

      const reaches = (node: DevReadinessScope): boolean =>
        node === scope || [...(scopeChildren.get(node) ?? [])].some(reaches)

      if (reaches(child) || children.has(child)) {
        throw new Error('Readiness scopes must form an acyclic tree')
      }

      const stop = child.subscribe(notify)

      children.set(child, stop)
      scopeChildren.get(scope)!.add(child)
      notify()
      return () => {
        if (children.delete(child)) {
          scopeChildren.get(scope)!.delete(child)
          stop()
          notify()
        }
      }
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    wait({ signal, timeoutMs }) {
      if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
        return Promise.reject(new RangeError('timeoutMs must be positive and finite'))
      }

      return new Promise((resolve, reject) => {
        let settled = false
        let stable: ReturnType<typeof setTimeout> | undefined
        let deadline: ReturnType<typeof setTimeout> | undefined
        const finish = (code?: DevReadinessError['code']) => {
          if (settled) {
            return
          }

          settled = true
          clearTimeout(stable)
          clearTimeout(deadline)
          listeners.delete(check)
          signal.removeEventListener('abort', abort)
          if (code) {
            reject(new DevReadinessError(code, snapshot()))
          } else {
            resolve(snapshot())
          }
        }

        const abort = () => finish('readiness_cancelled')
        const check = () => {
          clearTimeout(stable)
          if (disposed) {
            return finish('readiness_disposed')
          }

          if (signal.aborted) {
            return abort()
          }

          if (!snapshot().pending.length) {
            const observed = revision

            stable = setTimeout(() => {
              if (revision === observed && !snapshot().pending.length) {
                finish()
              } else {
                check()
              }
            }, 0)
          }
        }

        listeners.add(check)
        signal.addEventListener('abort', abort, { once: true })
        deadline = setTimeout(() => finish('readiness_timeout'), timeoutMs)
        check()
      })
    },
    dispose() {
      if (disposed) {
        return
      }

      disposed = true
      for (const stop of children.values()) {
        stop()
      }

      children.clear()
      scopeChildren.get(scope)!.clear()
      notify()
      listeners.clear()
    },
  }

  scopeChildren.set(scope, new Set())
  return scope
}
