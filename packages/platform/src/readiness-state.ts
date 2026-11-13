/** Static diagnostic identity of registered work. Never include customer data. */
export interface ReadinessWork {
  /** Non-sensitive owner/work label, including nested scope prefixes. */
  readonly label: string
  /** Whether this work is required for usable content. */
  readonly blocking: boolean
}

/** Facts about registered work; not a receipt for layout, visibility or pixels. */
export interface ReadinessSnapshot {
  /** Static scope label. */
  readonly scope: string
  /** Changes when registered work or child membership changes. */
  readonly revision: number
  /** Required failures take precedence over required pending work. Background work does not block ready. */
  readonly status: 'ready' | 'pending' | 'blocked'
  /** All running or paused work, including background work. */
  readonly pending: readonly ReadinessWork[]
  /** Failed work, including recoverable background failures. Raw errors are not retained. */
  readonly failures: readonly ReadinessWork[]
}

/** Declarative state of one task. null/undefined error means no failure. */
export interface ReadinessTask {
  /** Static non-sensitive label. */
  readonly label: string
  /** Running or paused work; independent of failure. */
  readonly pending: boolean
  /** Any non-null error value records failure; values never enter snapshots. */
  readonly error?: unknown
  /** Whether usable content requires this task. @default true */
  readonly blocking?: boolean
}

/** Owned task registration. Update the same task on recovery; dispose at its owner's end. */
export interface ReadinessRegistration {
  /** Replace current task state. Inert after registration or scope disposal. */
  update(task: ReadinessTask): void
  /** Remove this task. Idempotent, including after scope disposal. */
  dispose(): void
}

/** A caller-local wait; deadlines are in milliseconds and never cancel registered work. */
export interface ReadinessWaitOptions {
  /** Caller cancellation. */
  signal?: AbortSignal
  /** Positive finite deadline in milliseconds. */
  timeoutMs: number
  /** Also require background work to finish successfully. @default false */
  includeBackground?: boolean
}

/** Renderer-free readiness owner for services and framework integrations. */
export interface ReadinessController {
  /** Current immutable-by-contract snapshot; stable until a change. */
  snapshot(): ReadinessSnapshot
  /** Register one owned task, even if currently ready. */
  register(task: ReadinessTask): ReadinessRegistration
  /** Include a nested owner until the returned cleanup is called. Cycles and duplicate children throw. */
  include(child: ReadinessController): () => void
  /** Observe changes; does not notify immediately. */
  subscribe(notify: () => void): () => void
  /** Wait for selected work to succeed across an event-loop turn. Failures reject promptly. */
  wait(options: ReadinessWaitOptions): Promise<ReadinessSnapshot>
  /** End ownership, reject waits and release subscriptions. Idempotent. */
  dispose(): void
}

/** Readiness failure, deadline, cancellation or disposed owner with safe diagnostics. */
export class ReadinessError extends Error {
  /** Reason the caller could not establish readiness. */
  readonly code:
    | 'readiness_failed'
    | 'readiness_timeout'
    | 'readiness_cancelled'
    | 'readiness_disposed'
  /** Last registered-work snapshot, without raw errors or data. */
  readonly readiness: ReadinessSnapshot

  constructor(code: ReadinessError['code'], readiness: ReadinessSnapshot) {
    super(`${code}: ${readiness.scope}`)
    this.name = 'ReadinessError'
    this.code = code
    this.readiness = readiness
  }
}

interface TaskState extends ReadinessWork {
  pending: boolean
  failed: boolean
}

const scopeChildren = new WeakMap<ReadinessController, Set<ReadinessController>>()

/**
 * Create a renderer-free service owner. Components normally use ReadinessScope.
 * @example
 * import { createReadinessScope } from '@octane-xplat/platform/readiness/controller'
 * const scope = createReadinessScope('Preview service')
 * const task = scope.register({ label: 'Preparing preview', pending: true })
 * task.update({ label: 'Preparing preview', pending: false })
 * await scope.wait({ timeoutMs: 1000 })
 * task.dispose()
 * scope.dispose()
 */
export function createReadinessScope(label: string): ReadinessController {
  const tasks = new Map<object, TaskState>()
  const children = new Map<ReadinessController, () => void>()
  const listeners = new Set<() => void>()
  let revision = 0
  let disposed = false
  const read = (): ReadinessSnapshot => {
    const pending: ReadinessWork[] = []
    const failures: ReadinessWork[] = []

    for (const task of tasks.values()) {
      const work = { label: task.label, blocking: task.blocking }

      if (task.pending) {
        pending.push(work)
      }

      if (task.failed) {
        failures.push(work)
      }
    }

    for (const child of children.keys()) {
      const state = child.snapshot()
      const prefix = (work: ReadinessWork): ReadinessWork => ({
        label: `${state.scope}: ${work.label}`,
        blocking: work.blocking,
      })

      pending.push(...state.pending.map(prefix))
      failures.push(...state.failures.map(prefix))
    }

    return {
      scope: label,
      revision,
      status: failures.some((work) => work.blocking)
        ? 'blocked'
        : pending.some((work) => work.blocking)
          ? 'pending'
          : 'ready',
      pending,
      failures,
    }
  }

  let current = read()
  const notify = () => {
    revision++
    current = read()

    // A callback may add/remove subscriptions during this notification.
    const observers = [...listeners]

    for (const listener of observers) {
      listener()
    }
  }

  const assertLive = () => {
    if (disposed) {
      throw new ReadinessError('readiness_disposed', current)
    }
  }

  const scope: ReadinessController = {
    snapshot: () => current,
    register(task) {
      assertLive()

      const key = {}
      const update = (value: ReadinessTask) => {
        if (disposed || !tasks.has(key)) {
          return
        }

        const next = {
          label: value.label,
          pending: value.pending,
          failed: value.error !== undefined && value.error !== null,
          blocking: value.blocking !== false,
        }

        const previous = tasks.get(key)!

        if (
          previous.label === next.label &&
          previous.pending === next.pending &&
          previous.failed === next.failed &&
          previous.blocking === next.blocking
        ) {
          return
        }

        tasks.set(key, next)
        notify()
      }

      tasks.set(key, {
        label: task.label,
        pending: task.pending,
        failed: task.error !== undefined && task.error !== null,
        blocking: task.blocking !== false,
      })

      notify()
      return {
        update,
        dispose() {
          if (tasks.delete(key) && !disposed) {
            notify()
          }
        },
      }
    },
    include(child) {
      assertLive()

      const reaches = (node: ReadinessController): boolean =>
        node === scope || [...(scopeChildren.get(node) ?? [])].some(reaches)

      if (reaches(child) || children.has(child)) {
        throw new Error('Readiness scopes must be acyclic')
      }

      const stop = child.subscribe(notify)

      children.set(child, stop)
      scopeChildren.get(scope)!.add(child)
      notify()
      return () => {
        if (children.delete(child)) {
          scopeChildren.get(scope)!.delete(child)
          stop()
          if (!disposed) {
            notify()
          }
        }
      }
    },
    subscribe(listener) {
      if (disposed) {
        return () => {}
      }

      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    wait({ signal, timeoutMs, includeBackground = false }) {
      if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
        return Promise.reject(new RangeError('timeoutMs must be positive and finite'))
      }

      return new Promise((resolve, reject) => {
        let settled = false
        let stable: ReturnType<typeof setTimeout> | undefined
        let deadline: ReturnType<typeof setTimeout> | undefined
        const finish = (code?: ReadinessError['code']) => {
          if (settled) {
            return
          }

          settled = true
          clearTimeout(stable)
          clearTimeout(deadline)
          listeners.delete(check)
          signal?.removeEventListener('abort', abort)
          if (code) {
            reject(new ReadinessError(code, current))
          } else {
            resolve(current)
          }
        }

        const abort = () => finish('readiness_cancelled')
        const relevant = (work: ReadinessWork) => includeBackground || work.blocking
        const check = () => {
          clearTimeout(stable)
          if (disposed) {
            return finish('readiness_disposed')
          }

          if (signal?.aborted) {
            return abort()
          }

          if (current.failures.some(relevant)) {
            return finish('readiness_failed')
          }

          if (!current.pending.some(relevant)) {
            const observed = revision

            stable = setTimeout(() => {
              if (revision === observed && !disposed && !signal?.aborted) {
                finish()
              } else {
                check()
              }
            }, 0)
          }
        }

        listeners.add(check)
        signal?.addEventListener('abort', abort, { once: true })
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
      tasks.clear()
    },
  }

  scopeChildren.set(scope, new Set())
  return scope
}
