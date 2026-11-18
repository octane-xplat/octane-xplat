import { Scroll } from '@octane-xplat/nativescript-mason-core/scroll'
import { View } from '@octane-xplat/nativescript-mason-core/view'
import {
  bindNativeView,
  cancelAttachedNative,
  discardPendingNativeAdds,
  expectAttachedNative,
  isAttachedNativeExpected,
  releaseNativeView,
} from '@octane-xplat/nativescript-mason-core/adoption'
import { native_ } from '@octane-xplat/nativescript-mason-core/symbols'
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

export { requireBinding }

const isMasonContainer = (view) => view instanceof View || view instanceof Scroll

/**
 * Bind a backend-validated, already-mounted tree through Mason's adoption API.
 * `validateNativeTree(visual, viewport, nativeViews)` performs the platform's
 * native class/parent/order checks; the caller owns Core/window lifecycle.
 */
export function bindMasonTree(nodes, viewport, nativeViews, { beforeAttach, createLabel, validateNativeTree } = {}) {
  const visual = projectVisualTree(nodes)

  validateNativeTree(visual, viewport, nativeViews)

  const host = new View()
  bindNativeView(host, viewport)

  const factories = new Map()
  const wrappers = visual.map((row, index) => {
    const wrapper =
      row.kind === 'label' ? createLabel() : row.kind === 'scrollview' ? new Scroll() : new View()

    if (row.kind !== 'label') {
      bindNativeView(wrapper, nativeViews[index])
    } else {
      factories.set(wrapper, wrapper.createNativeView)

      // Capture one native object, rather than the caller's whole host scope.
      const native = nativeViews[index]

      wrapper.createNativeView = () => native
    }

    return wrapper
  })

  const claims = createNativeClaims(nodes, wrappers)
  let attachmentCalls = 0

  // Each wrapper's first native attach under a Mason View must find its bound
  // native already in place; Mason verifies parent/index, skips the insert and
  // runs ordinary adoption. Later attaches of the same wrapper are ordinary.
  for (const wrapper of wrappers) {
    expectAttachedNative(wrapper, { onAttach: () => beforeAttach?.(++attachmentCalls) })
  }

  function restore() {
    for (const wrapper of wrappers) {
      cancelAttachedNative(wrapper)
    }

    for (const [wrapper, factory] of factories) {
      wrapper.createNativeView = factory
    }

    factories.clear()
    beforeAttach = undefined
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
          // iOS keeps inserts deferred until the host loads; every expectation
          // must be consumed by the time commit returns on both platforms.
          requireBinding(
            wrappers.every((wrapper) => !isAttachedNativeExpected(wrapper)),
            'native visual attachments were not fully consumed',
          )
        })
      } finally {
        // Neither success nor accepted failure may leave expectations or native
        // factory closures installed on logical owners.
        restore()
      }
    },
    retire() {
      restore()
      releaseMasonOwners(host, wrappers)
      claims.retire()
    },
  }
}

/** Clear adopted caches only after Core has released this generation's native state. */
export function releaseMasonOwners(host, wrappers) {
  const owners = [host, ...wrappers]

  requireBinding(
    owners.every(
      (view) => !view._context && !view.isLoaded && (isMasonContainer(view) || !view.nativeViewProtected),
    ),
    'native owners must be torn down before cache retirement',
  )

  for (const wrapper of owners) {
    if (isMasonContainer(wrapper)) {
      // A bound-but-never-attached view pairs nativeViewProtected with the
      // adopted object; releaseNativeView clears that pairing and throws only
      // when live Core state remains.
      try {
        releaseNativeView(wrapper)
      } catch (error) {
        const detail = error instanceof Error ? `: ${error.message}` : ''
        throw new ArtifactError(
          `native owners must be torn down before cache retirement (owner ${owners.indexOf(wrapper)}${detail})`,
        )
      }
    }
  }
}

/** Release Core parent links left outside Mason's collection by a failed insertion. */
export function releaseMasonTree(host, wrappers) {
  const owned = [host, ...wrappers]
  const ownedSet = new Set(owned)

  for (const view of owned) {
    if (isMasonContainer(view)) {
      // An accepted failure can leave queued iOS inserts behind; drop them
      // without replaying against a discarded tree. No-op on Android.
      discardPendingNativeAdds(view)
    }
  }

  for (const view of wrappers.slice().reverse()) {
    const parent = view.parent

    if (parent) {
      requireBinding(
        ownedSet.has(parent) && isMasonContainer(parent),
        'failed claim escaped its owner scope',
      )

      // A failed native insert clears its own parent link (Mason container
      // fix), so a remaining parent implies ordinary collection membership.
      parent.removeChild(view)
    }

    // That same rollback can leave the wrapper's bound native attached to an
    // owned native parent with no Core parent edge left. The caller owns the
    // pre-attached natives, so release detaches them explicitly. Ancestors are
    // processed after descendants, so their bound native is still present.
    const native = view.nativeViewProtected
    const nativeParent = native ? native.superview ?? native.getParent?.() : null
    if (native && nativeParent) {
      // Match the bound native slot too: a host torn down by the caller has
      // already cleared nativeViewProtected, while native_ survives until
      // releaseNativeView.
      const owner = owned.find(
        (candidate) =>
          candidate !== view &&
          (candidate.nativeViewProtected ?? candidate[native_]) === nativeParent,
      )
      requireBinding(owner, 'failed native attachment escaped its owner scope')
      owner._removeViewFromNativeVisualTree(view)
    }

    if (view.isLoaded) {
      view.callUnloaded()
    }

    if (view._context) {
      view._tearDownUI(true)
    }
  }
}
