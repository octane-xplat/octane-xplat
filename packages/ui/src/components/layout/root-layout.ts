import { getRootLayout, RootLayout } from '@nativescript/core'

// NS keeps an internal rootLayoutStack (mounted order) — but the module is
// private and can duplicate when deep imports split bundles, so Screen
// self-registers here on loaded/unloaded instead. registry order = mount
// order; last = most recently mounted screen shell.
const registry: RootLayout[] = []

/** Called by the Screen leaf's <rootlayout> onLoaded/onUnloaded. */
export function registerRootLayout(rl: RootLayout | undefined | null): void {
  if (rl && !registry.includes(rl)) {
    registry.push(rl)
  }
}

export function unregisterRootLayout(rl: RootLayout | undefined | null): void {
  const i = rl ? registry.indexOf(rl) : -1

  if (i >= 0) {
    registry.splice(i, 1)
  }
}

// Mobile Screen shells are Mason views; each owns one overlay RootLayout
// attached outside reconciliation (see Screen.tsrx).
const screenHosts = new WeakMap<object, RootLayout>()

/** Called by the Screen leaf when its shell attaches or replaces its overlay host. */
export function registerScreenOverlayHost(shell: object, host: RootLayout): void {
  screenHosts.set(shell, host)
}

export function unregisterScreenOverlayHost(shell: object): void {
  screenHosts.delete(shell)
}

/** The most recently mounted rootlayout — the top of the push stack. For
 *  imperative services (toast, sheet) there is no invoking component to
 *  walk from; last-mounted is the pushed page when one exists. Caveat: tabs
 *  keep visited panes mounted — last is the newest, not the visible tab. */
export function topRootLayout(): RootLayout | undefined {
  return registry[registry.length - 1] ?? getRootLayout()
}

/** Resolve the overlay host for `view` by walking the parent chain: inside an
 *  overlay, the enclosing RootLayout; under a Screen, that shell's overlay
 *  host. Falls back to the top registry entry outside any Screen. */
export function rootLayoutFor(view: any): RootLayout | undefined {
  for (let v = view?.parent; v; v = v.parent) {
    if (v instanceof RootLayout) {
      return v
    }

    const host = screenHosts.get(v)

    if (host) {
      return host
    }
  }

  return topRootLayout()
}

/** A long-lived service outlet can stay on a hidden backstack Page. Present
 * in that Frame's visible Page while retaining the outlet's logical context. */
export function currentRootLayoutFor(view: any): RootLayout | undefined {
  const page = view?.page
  const current = page?.frame?.currentPage

  if (!current || current === page) {
    return rootLayoutFor(view)
  }

  const walk = (node: any): RootLayout | undefined => {
    if (node instanceof RootLayout && node.isLoaded) {
      return node
    }

    let result: RootLayout | undefined

    node?.eachChildView?.((child: any) => {
      result = walk(child)
      return !result
    })

    return result
  }

  return walk(current)
}

/** Search every registered rootlayout for a view by id — overlays/sheets/
 *  toasts land on different rootlayouts depending on which screen's shell
 *  mounted last. Unloaded subtrees are skipped: a covered page unloads its
 *  views (NativeScript detaches their native recognizers while the JS views
 *  stay parented), so an unloaded match is a dead twin that can swallow
 *  interaction probes — the live view either doesn't exist here yet or sits
 *  under a loaded branch. */
export function findInRootLayouts(id: string): any {
  const walk = (view: any): any => {
    if (!view) {
      return null
    }

    if (view.id === id) {
      return view
    }

    let hit: any = null

    view.eachChildView?.((c: any) => {
      if (c?.isLoaded === false) {
        return true
      }

      const found = walk(c)

      if (found) {
        hit = found
        return false
      }

      return true
    })

    return hit
  }

  for (let i = registry.length - 1; i >= 0; i--) {
    const hit = walk(registry[i])

    if (hit) {
      return hit
    }
  }

  const rl = getRootLayout()

  return rl ? walk(rl) : null
}
