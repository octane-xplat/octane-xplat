import { Label } from '@nativescript/core'
import {
  bindMasonTree,
  releaseMasonOwners,
  releaseMasonTree,
  requireBinding,
} from '../mason-binding-core.js'

function validateNativeTree(visual, viewport, nativeViews) {
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
}

/** Bind a backend-validated, already-mounted tree; the caller owns Core/window lifecycle. */
export function bindAndroidMasonTree(nodes, viewport, nativeViews, { beforeAttach } = {}) {
  return bindMasonTree(nodes, viewport, nativeViews, {
    beforeAttach,
    createLabel: () => new Label(),
    validateNativeTree,
  })
}

/** Clear adopted caches only after Core has released this generation's native state. */
export function releaseAndroidMasonOwners(host, wrappers) {
  releaseMasonOwners(host, wrappers)
}

/** Release Core parent links left outside Mason's collection by a failed insertion. */
export function releaseAndroidMasonTree(host, wrappers) {
  releaseMasonTree(host, wrappers)
}
