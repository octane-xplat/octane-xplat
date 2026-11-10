/** Native engine escape hatches cannot replace shared input/presentation ownership. */
const removed = new Set([
  'gestureEnabled',
  'gestureMinDist',
  'gestureHandlerOptions',
  'gestureTag',
  'panGestureHandler',
  'waitFor',
  'simultaneousHandlers',
  'shouldStartGesture',
  'shouldStartSheetDragging',
  'shouldPan',
  'translationFunction',
  'animationFunction',
  'openAnimationDuration',
  'closeAnimationDuration',
  'startingSide',
  'mainContent',
  'backDrop',
  'backDropEnabled',
  'backdropColor',
  'backdropProperties',
  'backdropTapGestureEnabled',
  'open',
  'close',
  'toggle',
  'translateX',
  'translateY',
  'nativeViewProtected',
  'parent',
  'style',
  'visibility',
  'opacity',
  'isUserInteractionEnabled',
])

export function applyNativeDrawerProps(host: object, bag?: Record<string, unknown>): void {
  if (!bag) {
    return
  }

  for (const key of Object.keys(bag)) {
    if (
      removed.has(key) ||
      typeof bag[key] === 'function' ||
      /^(left|right|top|bottom)(Drawer|Swipe|OpenedDrawer|ClosedDrawer)/.test(key)
    ) {
      throw new Error(`Drawer native host property ${key} was removed; use shared Drawer props`)
    }
  }

  Object.assign(host, bag)
}
