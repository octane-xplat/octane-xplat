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
export function bindIOSMasonTree(nodes, viewport, nativeViews, { beforeAttach } = {}) {
  const visual = projectVisualTree(nodes)

  requireBinding(
    typeof View.prototype._masonInsertNative === 'function' &&
      typeof View.prototype._masonAdoptForeign === 'function' &&
      typeof View.prototype._masonMeasureForeign === 'function' &&
      typeof View.prototype._nativeAttachIndex === 'function',
    'Mason wrapper adoption hooks are unavailable',
  )

  requireBinding(viewport instanceof MasonUIView, 'native viewport class differs')

  requireBinding(
    nativeViews.length === visual.length &&
      new Set(nativeViews).size === visual.length &&
      !nativeViews.includes(viewport),
    'native binding requires distinct visual objects',
  )

  requireBinding(
    viewport.subviews.count === 1 && viewport.subviews.objectAtIndex(0) === nativeViews[0],
    'native viewport root differs',
  )
  for (const row of visual) {
    const native = nativeViews[row.index]
    const container = row.kind === 'masonview'

    requireBinding(
      container ? native instanceof MasonUIView : native instanceof TNSLabel,
      'native visual class differs',
    )

    const parent = row.parent === null ? viewport : nativeViews[row.parent]

    requireBinding(native.superview === parent, 'native visual parent differs')

    if (container) {
      requireBinding(
        native.subviews.count === row.children.length &&
          row.children.every(
            (index, order) => native.subviews.objectAtIndex(order) === nativeViews[index],
          ),
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

      // Capture one native object, rather than the caller's whole host scope.
      const native = nativeViews[index]

      wrapper.createNativeView = () => native
    }

    return wrapper
  })

  const claims = createNativeClaims(nodes, wrappers)
  const inserts = new Map()
  const pending = new Set(wrappers)
  let attachmentCalls = 0
  function restoreHooks() {
    for (const [wrapper, insert] of inserts) {
      wrapper._masonInsertNative = insert
    }

    for (const [wrapper, factory] of factories) {
      wrapper.createNativeView = factory
    }

    inserts.clear()
    factories.clear()
    pending.clear()
    beforeAttach = undefined
  }

  for (const wrapper of [host, ...wrappers.filter((view) => view instanceof View)]) {
    const insert = wrapper._masonInsertNative

    inserts.set(wrapper, insert)
    wrapper._masonInsertNative = function (child, index) {
      // iOS Mason defers the native insert until the child is loaded; by then
      // the child already has its native view bound and queued. Only its first
      // insert is adoption; later work (including callback moves before commit
      // returns) uses normal Mason insertion.
      if (!pending.has(child)) {
        return insert.call(this, child, index)
      }

      beforeAttach?.(++attachmentCalls)

      const native = child.nativeViewProtected

      requireBinding(
        native && native.superview === this._view,
        'existing native attachment parent differs',
      )

      requireBinding(
        this._view.subviews.objectAtIndex(index) === native,
        'existing native attachment order differs',
      )

      pending.delete(child)
      this._masonAdoptForeign(child)
      this._masonMeasureForeign(child)
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
          // The host must be set up and loaded before commit; otherwise iOS
          // keeps inserts deferred and the pending set stays populated.
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
      releaseIOSMasonOwners(host, wrappers)
      claims.retire()
    },
  }
}

/** Clear adopted caches only after Core has released this generation's native state. */
export function releaseIOSMasonOwners(host, wrappers) {
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
export function releaseIOSMasonTree(host, wrappers) {
  const owned = new Set([host, ...wrappers])

  for (const view of owned) {
    // An accepted failure can leave queued inserts behind. Advancing the head
    // to the end lets Mason's own flush retire the queue and its global
    // pending-host count without replaying inserts against a discarded tree.
    if (view._masonPendingAdds) {
      view._masonPendingHead = view._masonPendingAdds.length
      view._masonFlushNativeAdds()
    }
  }

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
