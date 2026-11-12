import { parseAccelerator } from './accelerator.js'
import type { HotkeyBackend } from './backend.js'
import { staticallyReserved } from './reserved.js'
import type {
  Accelerator,
  CreateGlobalShortcutsOptions,
  GlobalShortcut,
  GlobalShortcutError,
  GlobalShortcutOptions,
  GlobalShortcutResult,
  GlobalShortcuts,
  GlobalShortcutSupport,
} from './types.js'

interface Registration {
  readonly token: symbol
  readonly id: string
  readonly accelerator: Accelerator
  readonly trigger: string
  readonly release: () => Promise<void>
  readonly shortcut: GlobalShortcut
}

interface Instance {
  readonly onError: ((error: unknown) => void) | undefined
  readonly records: Map<string, Registration>
  disposed: boolean
  chain: Promise<unknown>
  dispose(): Promise<void>
}

/** Serializes mutating work on one instance. */
function enqueue(instance: Instance, work: () => Promise<void>): void {
  instance.chain = instance.chain.then(work, work)
}

export interface RegistryApi {
  createGlobalShortcuts(options?: CreateGlobalShortcutsOptions): GlobalShortcuts
  getGlobalShortcutSupport(): Promise<GlobalShortcutSupport>
}

const invalidResult = (error: GlobalShortcutError): GlobalShortcutResult => ({ ok: false, error })

/**
 * Builds the public entry-point functions for one platform backend. The
 * registry owns parsing, reserved checks, id/accelerator bookkeeping,
 * serialization, disposal and error routing; the backend only owns the OS.
 */
export function createRegistry(backend: HotkeyBackend): RegistryApi {
  /** accelerator text → registration token, process-wide across instances. */
  const processAccelerators = new Map<string, symbol>()
  const instances = new Set<Instance>()
  let nextKey = 1

  backend.onExit(() => {
    for (const instance of Array.from(instances)) {
      void instance.dispose()
    }
  })

  const getGlobalShortcutSupport = () => backend.support()

  function createGlobalShortcuts(createOptions?: CreateGlobalShortcutsOptions): GlobalShortcuts {
    const onError = createOptions?.onError
    const records = new Map<string, Registration>()

    const report = (error: unknown): void => {
      if (onError) {
        try {
          onError(error)
        } catch {
          // An onError hook that throws must not take down delivery.
        }

        return
      }

      // Rethrown asynchronously; works in hosts without timers (GJS workers).
      void Promise.reject(error)
    }

    const instance: Instance = {
      onError,
      records,
      disposed: false,
      chain: Promise.resolve(),
      dispose() {
        return disposePromise ?? (disposePromise = doDispose())
      },
    }

    let disposePromise: Promise<void> | null = null
    let cleanup: Promise<void> | null = null
    const doDispose = (): Promise<void> => {
      if (instance.disposed) {
        return cleanup ?? Promise.resolve()
      }

      instance.disposed = true
      // Release records outside the serialized chain: a register call may be
      // parked inside a slow OS bind, and disposal must not wait on it.
      // Post-dispose doRegister releases its own outcome and never mutates
      // records, and queued unregisters find their record already gone.
      cleanup = (async () => {
        const releases: Promise<void>[] = []

        for (const record of records.values()) {
          records.delete(record.id)
          if (processAccelerators.get(record.accelerator.text) === record.token) {
            processAccelerators.delete(record.accelerator.text)
          }

          releases.push(record.release().catch(report))
        }

        await Promise.all(releases)
        instances.delete(instance)
      })()

      return cleanup
    }

    instances.add(instance)

    const releaseRecord = (record: Registration): Promise<boolean> => {
      const result = instance.chain.then(async () => {
        if (records.get(record.id) !== record) {
          return false
        }

        records.delete(record.id)
        if (processAccelerators.get(record.accelerator.text) === record.token) {
          processAccelerators.delete(record.accelerator.text)
        }

        await record.release().catch(report)
        return true
      })

      instance.chain = result
      return result
    }

    const doRegister = async (options: GlobalShortcutOptions): Promise<GlobalShortcutResult> => {
      if (instance.disposed) {
        return invalidResult({
          code: 'disposed',
          message: 'These global shortcuts have been disposed.',
          id: options.id,
          accelerator: options.accelerator,
        })
      }

      const parsed = parseAccelerator(options.accelerator, {
        platform: backend.platform ?? undefined,
      })

      if (!parsed.ok) {
        return invalidResult({ ...parsed.error, id: options.id, accelerator: options.accelerator })
      }

      const accelerator = parsed.accelerator
      const reserved =
        (backend.platform ? staticallyReserved(backend.platform, accelerator) : null) ??
        backend.reserved?.(accelerator) ??
        null

      if (reserved !== null) {
        return invalidResult({
          code: 'reserved',
          message: reserved,
          id: options.id,
          accelerator: accelerator.text,
        })
      }

      if (records.has(options.id)) {
        return invalidResult({
          code: 'duplicate-id',
          message: `A global shortcut with id '${options.id}' is already registered on this instance.`,
          id: options.id,
          accelerator: accelerator.text,
        })
      }

      if (processAccelerators.has(accelerator.text)) {
        return invalidResult({
          code: 'conflict',
          message: `The accelerator '${accelerator.text}' is already held by a global shortcut in this process.`,
          id: options.id,
          accelerator: accelerator.text,
        })
      }

      const token = Symbol(options.id)
      const deliver = (): void => {
        if (records.get(options.id)?.token !== token) {
          return
        }

        try {
          options.onPress({ id: options.id, accelerator: accelerator.text, timestamp: Date.now() })
        } catch (error) {
          report(error)
        }
      }

      const outcome = await backend.bind(
        {
          key: nextKey++,
          id: options.id,
          accelerator,
          description: options.description ?? options.id,
          appId: createOptions?.appId,
        },
        deliver,
      )

      if (!outcome.ok) {
        return invalidResult({
          ...outcome.error,
          id: outcome.error.id ?? options.id,
          accelerator: outcome.error.accelerator ?? accelerator.text,
        })
      }

      // Dispose may have run while the OS bind was in flight: release the
      // fresh binding immediately and report the registration as disposed.
      if (instance.disposed) {
        await outcome.release().catch(report)
        return invalidResult({
          code: 'disposed',
          message: 'These global shortcuts have been disposed.',
          id: options.id,
          accelerator: accelerator.text,
        })
      }

      const record: Registration = {
        token,
        id: options.id,
        accelerator,
        trigger: outcome.trigger,
        release: outcome.release,
        shortcut: {
          id: options.id,
          accelerator: accelerator.text,
          trigger: outcome.trigger,
          unregister() {
            return releaseRecord(record)
          },
        },
      }

      records.set(options.id, record)
      processAccelerators.set(accelerator.text, token)
      return { ok: true, shortcut: record.shortcut }
    }

    const register = (options: GlobalShortcutOptions): Promise<GlobalShortcutResult> => {
      if (typeof options !== 'object' || options === null) {
        throw new TypeError('register options must be an object')
      }

      if (typeof options.id !== 'string' || options.id === '') {
        throw new TypeError('register requires a non-empty string id')
      }

      if (typeof options.accelerator !== 'string') {
        throw new TypeError('register requires a string accelerator')
      }

      if (typeof options.onPress !== 'function') {
        throw new TypeError('register requires an onPress function')
      }

      const result = instance.chain.then(() => doRegister(options))

      instance.chain = result
      return result
    }

    const unregister = (id: string): Promise<boolean> => {
      const record = records.get(id)

      if (!record) {
        return Promise.resolve(false)
      }

      return releaseRecord(record)
    }

    const unregisterAll = async (): Promise<void> => {
      enqueue(instance, async () => {
        const releases: Promise<void>[] = []

        for (const record of records.values()) {
          records.delete(record.id)
          if (processAccelerators.get(record.accelerator.text) === record.token) {
            processAccelerators.delete(record.accelerator.text)
          }

          releases.push(record.release().catch(report))
        }

        await Promise.all(releases)
      })

      await instance.chain.then(
        () => undefined,
        () => undefined,
      )
    }

    return {
      register,
      unregister,
      unregisterAll,
      list: () => [...records.values()].map((record) => record.shortcut),
      dispose: () => instance.dispose(),
      get disposed() {
        return instance.disposed
      },
    }
  }

  return { createGlobalShortcuts, getGlobalShortcutSupport }
}
