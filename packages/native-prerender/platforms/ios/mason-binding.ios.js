import { Label } from '@nativescript/core'
import {
  bindMasonTree,
  releaseMasonOwners,
  releaseMasonTree,
  requireBinding,
} from '../mason-binding-core.js'

function validateNativeTree(visual, viewport, nativeViews) {
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
    const container = row.kind !== 'label'

    // Mason core Scroll is a MasonUIView marked as a scroll container.
    requireBinding(
      container
        ? native instanceof MasonUIView && native.isScrollContainer === (row.kind === 'scrollview')
        : native instanceof TNSLabel,
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
}

/** Bind a backend-validated, already-mounted tree; the caller owns Core/window lifecycle. */
export function bindIOSMasonTree(nodes, viewport, nativeViews, { beforeAttach } = {}) {
  return bindMasonTree(nodes, viewport, nativeViews, {
    beforeAttach,
    createLabel: () => new Label(),
    validateNativeTree,
  })
}

/** Clear adopted caches only after Core has released this generation's native state. */
export function releaseIOSMasonOwners(host, wrappers) {
  releaseMasonOwners(host, wrappers)
}

/** Release Core parent links left outside Mason's collection by a failed insertion. */
export function releaseIOSMasonTree(host, wrappers) {
  releaseMasonTree(host, wrappers)
}
