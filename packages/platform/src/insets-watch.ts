/** @internal Shared Android decor-view insets dispatch for safe-area readers. */

type InsetsCallback = (insets: any) => void

interface DecorEntry {
  listener: any
  subscribers: Set<InsetsCallback>
}

// View.setOnApplyWindowInsetsListener is a single slot with no getter: a
// second install silently replaces the first, and the current owner cannot
// be read back. Every reader therefore shares one installed listener per
// decor view. The listener is never written off — after the last release it
// stays installed as an inert pass-through, so teardown can never strip a
// listener that replaced ours.
const entries = new WeakMap<object, DecorEntry>()

function install(decorView: object): DecorEntry {
  const existing = entries.get(decorView)

  if (existing) {
    return existing
  }

  const subscribers = new Set<InsetsCallback>()
  const Listener = (globalThis as any).android.view.View.OnApplyWindowInsetsListener
  const listener = new Listener({
    onApplyWindowInsets(_view: any, insets: any) {
      for (const notify of subscribers) {
        notify(insets)
      }

      return insets
    },
  })

  const entry: DecorEntry = { listener, subscribers }

  entries.set(decorView, entry)

  ;(decorView as any).setOnApplyWindowInsetsListener(listener)

  return entry
}

/** Deliver decor-view window-insets applications to one reader until release. */
export function observeDecorInsets(decorView: object, notify: InsetsCallback): () => void {
  const entry = install(decorView)

  entry.subscribers.add(notify)

  ;(decorView as any).requestApplyInsets?.()

  let active = true

  return () => {
    if (!active) {
      return
    }

    active = false
    entry.subscribers.delete(notify)
  }
}
