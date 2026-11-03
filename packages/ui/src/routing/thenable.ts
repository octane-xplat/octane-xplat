/**
 * Detect a thenable without asserting its payload type. A callable `then`
 * only proves `PromiseLike<unknown>` — the caller decides what a resolved
 * value would mean. Callable thenables (functions carrying `then`) count.
 */
export function isThenable(value: unknown): value is PromiseLike<unknown> {
  return (
    (typeof value === 'object' || typeof value === 'function') &&
    value !== null &&
    'then' in value &&
    typeof value.then === 'function'
  )
}
