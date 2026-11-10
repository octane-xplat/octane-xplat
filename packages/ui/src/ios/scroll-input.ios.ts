/** NativeScript host shape read at the iOS boundary. */
interface ScrollInputHost {
  isLoaded?: boolean
  nativeViewProtected?: unknown
  _styleHelper?: unknown
  eachChildView?: (visit: (child: object) => boolean) => void
}

interface ScrollInputViewport {
  userScrollEnabled: boolean
}

interface Suspension {
  owners: number
  enabled: boolean
}

function isViewport(value: unknown): value is ScrollInputViewport {
  return (
    !!value &&
    typeof value === 'object' &&
    'userScrollEnabled' in value &&
    typeof value.userScrollEnabled === 'boolean'
  )
}

const suspensions = new WeakMap<ScrollInputViewport, Suspension>()

/**
 * Synchronously suspends user scrolling in the currently mounted Mason subtree.
 * Call on the UI thread after native views are loaded, before moving an ancestor.
 * Returns an idempotent release; overlapping owners must all release before input
 * resumes. Existing disabled flags, offsets, overflow and programmatic seeks are
 * preserved. Ancestor pans and unrelated recognizers are untouched.
 *
 * This snapshots the current subtree: release before detaching/replacing it and
 * reacquire after mounting new descendants. Requires the native Mason
 * userScrollEnabled setter (published in registry core 1.0.0-beta.8); throws
 * before changing any viewport when an unloaded/older Mason host is encountered.
 */
export function suspendScrollInput(root: object): () => void {
  const viewports = new Set<ScrollInputViewport>()
  const visit = (value: object) => {
    // NativeScript hosts are supplied through the portable object ref. Validate
    // the optional bridge members here, once, before accessing native state.
    const host = value as ScrollInputHost
    const native = host.nativeViewProtected

    if (host.isLoaded === false || (host._styleHelper !== undefined && !isViewport(native))) {
      throw new Error(
        'suspendScrollInput requires loaded Mason views with native userScrollEnabled; rebuild with Mason core 1.0.0-beta.8 or later.',
      )
    }

    if (isViewport(native)) {
      viewports.add(native)
    }

    if (typeof host.eachChildView === 'function') {
      host.eachChildView((child) => {
        visit(child)
        return true
      })
    }
  }

  visit(root)
  if (viewports.size === 0) {
    throw new Error('suspendScrollInput requires a loaded Mason scroll subtree.')
  }

  const acquired: ScrollInputViewport[] = []
  const releaseViewport = (viewport: ScrollInputViewport) => {
    const state = suspensions.get(viewport)
    if (!state || --state.owners > 0) {
      return
    }
    suspensions.delete(viewport)
    viewport.userScrollEnabled = state.enabled
  }

  try {
    for (const viewport of viewports) {
      const state = suspensions.get(viewport)
      if (state) {
        state.owners++
      } else {
        const enabled = viewport.userScrollEnabled
        viewport.userScrollEnabled = false
        suspensions.set(viewport, { owners: 1, enabled })
      }
      acquired.push(viewport)
    }
  } catch (error) {
    for (const viewport of acquired.reverse()) {
      releaseViewport(viewport)
    }
    throw error
  }

  let released = false
  return () => {
    if (released) {
      return
    }
    released = true
    for (const viewport of acquired) {
      releaseViewport(viewport)
    }
  }
}
