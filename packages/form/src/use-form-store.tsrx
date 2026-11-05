import { useMemo, useSyncExternalStore } from 'octane'

/** Structural TanStack store contract; no React adapter or DOM is required. */
export interface FormStore<T> {
  readonly state: T
  subscribe(listener: () => void): { unsubscribe(): void }
}

/** Subscribe the calling component to a form/field store, optionally selecting
 * a stable slice. Every reader needs its own subscription on native.
 * Return a primitive or an existing object from select, not a fresh object.
 */
export function useFormStore<T>(store: FormStore<T>): T
export function useFormStore<T, S>(store: FormStore<T>, select: (state: T) => S): S
export function useFormStore<T, S>(store: FormStore<T>, select?: (state: T) => S): T | S {
  const subscribe = useMemo(
    () => (notify: () => void) => {
      const subscription = store.subscribe(notify)
      return () => subscription.unsubscribe()
    },
    [store],
  )

  return useSyncExternalStore(subscribe, () => (select ? select(store.state) : store.state))
}
