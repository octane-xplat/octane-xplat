import { Label } from '@nativescript/core'
import { View } from '@octane-xplat/nativescript-mason-core/view'
import { native_, style_ } from '@octane-xplat/nativescript-mason-core/symbols'
import {
  ArtifactError,
  createNativeClaims,
  projectVisualTree,
} from '@octane-xplat/native-prerender'

function requireBinding(value, message) {
  if (!value) {
    throw new ArtifactError(message)
  }
}

/** Bind a backend-validated, already-mounted tree; the caller owns Core/window lifecycle. */
export function bindAndroidMasonTree(nodes, viewport, nativeViews, { beforeAttach } = {}) {
  const visual = projectVisualTree(nodes)

  requireBinding(
    typeof View.prototype._nativeAttachIndex === 'function' &&
      typeof View.prototype._masonAdoptForeign === 'function',
    'Mason wrapper adoption hooks are unavailable',
  )

  requireBinding(
    viewport instanceof org.nativescript.mason.masonkit.View,
    'native viewport class differs',
  )

  requireBinding(
    nativeViews.length === visual.length &&
      new Set(nativeViews).size === visual.length &&
      !nativeViews.includes(viewport),
    'native binding requires distinct visual objects',
  )

  requireBinding(viewport.getChildCount() === 1, 'native viewport root count differs')
  for (const row of visual) {
    const native = nativeViews[row.index]
    const container = row.kind === 'masonview'

    requireBinding(
      container
        ? native instanceof org.nativescript.mason.masonkit.View
        : native instanceof org.nativescript.widgets.StyleableTextView,
      'native visual class differs',
    )

    const parent = row.parent === null ? viewport : nativeViews[row.parent]

    requireBinding(native.getParent() === parent, 'native visual parent differs')
    if (row.parent === null) {
      requireBinding(viewport.getChildAt(0) === native, 'native root differs')
    }

    if (container) {
      requireBinding(
        native.getChildCount() === row.children.length &&
          row.children.every((index, order) => native.getChildAt(order) === nativeViews[index]),
        'native visual child order differs',
      )
    }
  }

  const host = new View()

  host[native_] = viewport

  const factories = new Map()
  const wrappers = visual.map((row, index) => {
    const wrapper = row.kind === 'label' ? new Label() : new View()

    if (wrapper instanceof View) {
      wrapper[native_] = nativeViews[index]
    } else {
      factories.set(wrapper, wrapper.createNativeView)

      // Capture one native object, rather than the caller's whole Activity scope.
      const native = nativeViews[index]

      wrapper.createNativeView = () => native
    }

    return wrapper
  })

  const claims = createNativeClaims(nodes, wrappers)
  const attaches = new Map()
  const pending = new Set(wrappers)
  let attachmentCalls = 0
  function restoreHooks() {
    for (const [wrapper, attach] of attaches) {
      wrapper._addViewToNativeVisualTree = attach
    }

    for (const [wrapper, factory] of factories) {
      wrapper.createNativeView = factory
    }

    attaches.clear()
    factories.clear()
    pending.clear()
    beforeAttach = undefined
  }

  for (const wrapper of [host, ...wrappers.filter((view) => view instanceof View)]) {
    const attach = wrapper._addViewToNativeVisualTree

    attaches.set(wrapper, attach)
    wrapper._addViewToNativeVisualTree = function (child, atIndex = -1) {
      // A ref/layout callback may move an initial child before commit returns.
      // Only its first attachment is adoption; later work uses normal Mason.
      if (!pending.has(child)) {
        return attach.call(this, child, atIndex)
      }

      beforeAttach?.(++attachmentCalls)

      const native = child.nativeViewProtected

      requireBinding(
        native && native.getParent() === this._view,
        'existing native attachment parent differs',
      )

      const { nativeIndex } = this._nativeAttachIndex(child, atIndex)

      requireBinding(
        this._view.getChildAt(nativeIndex) === native,
        'existing native attachment order differs',
      )

      pending.delete(child)
      child._hasNativeView = true
      child._isMasonChild = true
      this._masonAdoptForeign(child)
      return true
    }
  }

  return {
    host,
    wrappers,
    claims,
    commit(apply) {
      try {
        claims.commit(() => {
          const result = apply()

          requireBinding(result === undefined, 'native binding requires a synchronous commit')
          requireBinding(pending.size === 0, 'native visual attachments were not fully consumed')
        })
      } finally {
        // Neither success nor accepted failure may leave native factory closures
        // installed on logical owners. Failed scopes still require host cleanup.
        restoreHooks()
      }
    },
    retire() {
      restoreHooks()
      releaseAndroidMasonOwners(host, wrappers)
      claims.retire()
    },
  }
}

/** Clear adopted caches only after Core has released this generation's native state. */
export function releaseAndroidMasonOwners(host, wrappers) {
  const owners = [host, ...wrappers]

  requireBinding(
    owners.every((view) => !view._context && !view.nativeViewProtected && !view.isLoaded),
    'native owners must be torn down before cache retirement',
  )

  for (const wrapper of owners) {
    if (wrapper instanceof View) {
      wrapper[native_] = undefined
      wrapper[style_] = undefined
    }
  }
}

/** Release Core parent links left outside Mason's collection by a failed insertion. */
export function releaseAndroidMasonTree(host, wrappers) {
  const owned = new Set([host, ...wrappers])

  for (const view of wrappers.slice().reverse()) {
    const parent = view.parent

    if (parent) {
      requireBinding(
        owned.has(parent) && parent instanceof View,
        'failed claim escaped its owner scope',
      )

      if (parent.getChildIndex(view) >= 0) {
        parent.removeChild(view)
      } else {
        parent._removeView(view)
      }
    }

    if (view.isLoaded) {
      view.callUnloaded()
    }

    if (view._context) {
      view._tearDownUI(true)
    }
  }
}
