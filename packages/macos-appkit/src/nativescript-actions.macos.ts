import type { View } from '@nativescript/core/ui/core/view'
import { GestureTypes } from '@nativescript/core/ui/gestures'
import { interop, NSButton, NSEvent, NSView, type NSRect, type NSSize } from '@octane-xplat/platform/macos'
import { registerGestureClass } from './gestures'

export function activateNativeScriptView(view: View): boolean {
  if (!view.isEnabled || !view.isUserInteractionEnabled) {
    return false
  }

  const native = view.nativeViewProtected
  if (native instanceof NSButton) {
    native.performClick(null)
    return true
  }

  const observers = view.getGestureObservers(GestureTypes.tap) ?? []
  const observesEvent = view.hasListeners('tap')
  if (!observers.length && !observesEvent) {
    return false
  }

  const event = {
    type: GestureTypes.tap,
    eventName: 'tap',
    object: view,
    view,
    ios: undefined,
    android: undefined,
    getPointerCount: () => 0,
    getX: () => 0,
    getY: () => 0,
  }
  if (observesEvent) {
    view.notify(event)
  }
  for (const observer of [...observers]) {
    observer.callback?.call(observer.context, event)
  }
  return true
}

const owners = new WeakMap<object, View>()
const intrinsicSizes = new WeakMap<object, () => NSSize | undefined>()

function actionRole(role: unknown) {
  switch (role) {
    case 'button':
      return 'AXButton'
    case 'link':
      return 'AXLink'
  }
}

export function setNativeScriptActionRole(native: NSView, role: unknown) {
  if (!owners.has(native)) {
    return
  }
  const mapped = actionRole(role)
  native.accessibilityRole =
    mapped ?? (typeof role === 'string' && role.startsWith('AX') ? role : 'AXGroup')
  native.accessibilityElement = mapped !== undefined
}

class CoreActionView extends NSView {
  static ObjCExposedMethods = {
    accessibilityPerformPress: { params: [], returns: interop.types.bool },
  }

  static {
    registerGestureClass(this)
  }

  // @ts-expect-error ObjC accessor implements a generated native property.
  get intrinsicContentSize(): NSSize {
    return intrinsicSizes.get(this)?.() ?? { width: -1, height: -1 }
  }

  // AppKit exposes these methods as properties in its generated declarations.
  // @ts-expect-error ObjC method implements a native readonly property.
  acceptsFirstResponder() {
    const owner = owners.get(this)
    return Boolean(
      owner &&
      (owner.hasListeners('tap') || owner.getGestureObservers(GestureTypes.tap)?.length) &&
      owner.isEnabled &&
      owner.isUserInteractionEnabled,
    )
  }

  // @ts-expect-error ObjC method implements a native readonly property.
  canBecomeKeyView() {
    return this.acceptsFirstResponder() && !this.hiddenOrHasHiddenAncestor
  }

  accessibilityPerformPress() {
    const owner = owners.get(this)
    return Boolean(owner && this.acceptsFirstResponder() && activateNativeScriptView(owner))
  }

  keyDown(event: NSEvent) {
    const modifiers = Number(event.modifierFlags) & ((1 << 18) | (1 << 19) | (1 << 20))
    if (
      !modifiers &&
      (event.keyCode === 36 || event.keyCode === 49) &&
      this.accessibilityPerformPress()
    ) {
      return
    }
    super.keyDown(event)
  }
}

export function createNativeScriptActionView(
  owner: View,
  frame: NSRect,
  getIntrinsicSize?: () => NSSize | undefined,
): NSView {
  const native = CoreActionView.alloc().initWithFrame(frame)
  owners.set(native, owner)
  if (getIntrinsicSize) {
    intrinsicSizes.set(native, getIntrinsicSize)
  }
  // The bridge binds the accessors above as native properties.
  return native as unknown as NSView
}

export function releaseNativeScriptActionView(native: NSView) {
  owners.delete(native)
  intrinsicSizes.delete(native)
}
