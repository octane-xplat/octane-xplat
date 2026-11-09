import type { Actions } from './actions'
import type { Subscriptions } from './subscriptions'
import type { AccessibilityState } from './accessibility-state'
import { createTabStopSuppression } from './tab-stop'
import { createDisabledFocusTargets } from './disabled-focus'
import { NSNumber, NSView, NativeClass, interop } from '@octane-xplat/platform/macos'

interface Dependencies {
  actions: Pick<Actions, 'hasHandler' | 'idForView' | 'invokeAction'>
  state: Pick<AccessibilityState, 'get'>
  subscriptions: {
    fileDropRegistry: Pick<Subscriptions['fileDropRegistry'], 'operation' | 'perform'>
  }
}

export type AccessibleHost = ReturnType<typeof createAccessibleHost>

export function createAccessibleHost(deps: Dependencies) {
  const inputTransparentViews = new WeakSet<object>()

  // The macOS Slider uses the grid host as an overlay when no tracks are set.

  const scopeFocusTargets = new WeakMap<object, number>()

  const tabStopSuppression = createTabStopSuppression()

  const disabledFocusTargets = createDisabledFocusTargets()

  /** Plain NSView host for interactive containers — tap/keyboard/AX actions
   *  dispatch through the shared actionId registry. Mason-backed containers
   *  subclass this so a tappable stack/grid exposes the same accessibility
   *  surface the old NSStackView host did. */
  class AccessibleHostView extends NSView {
    // Self-drawn AppKit hosts need a responder so modal decisions can use the
    // keyboard as well as accessibility actions.
    // @ts-ignore ObjC accessor methods satisfy the generated @property member.
    acceptsFirstResponder() {
      return (
        deps.actions.hasHandler(this) ||
        (scopeFocusTargets.get(this) ?? 0) > 0 ||
        disabledFocusTargets.allows(this)
      )
    }
    // Scope fallback boxes accept programmatic focus but are not Tab stops.
    // @ts-ignore ObjC accessor methods satisfy the generated @property member.
    canBecomeKeyView() {
      return (
        !scopeFocusTargets.has(this) &&
        !tabStopSuppression.isSuppressed(this) &&
        this.acceptsFirstResponder() &&
        (this.isAccessibilityEnabled() || disabledFocusTargets.allows(this)) &&
        !this.hiddenOrHasHiddenAncestor
      )
    }

    keyDown(event: any) {
      const modified = Number(event.modifierFlags ?? 0) & ((1 << 18) | (1 << 19) | (1 << 20))

      if (
        !modified &&
        (Number(event.keyCode) === 36 || Number(event.keyCode) === 49) &&
        this.isAccessibilityEnabled() &&
        !deps.state.get(this)?.accessibilityState?.readonly &&
        deps.actions.hasHandler(this)
      ) {
        deps.actions.invokeAction(deps.actions.idForView(this)!)
        return
      }

      super.keyDown(event)
    }

    hitTest(point: any): any {
      return inputTransparentViews.has(this) ? null : super.hitTest(point)
    }

    draggingEntered(sender: any) {
      return deps.subscriptions.fileDropRegistry.operation(this, sender)
    }
    draggingUpdated(sender: any) {
      return deps.subscriptions.fileDropRegistry.operation(this, sender)
    }
    prepareForDragOperation(sender: any) {
      return deps.subscriptions.fileDropRegistry.operation(this, sender) !== 0
    }
    performDragOperation(sender: any) {
      return deps.subscriptions.fileDropRegistry.perform(this, sender)
    }

    static ObjCExposedMethods = {
      draggingEntered: { params: [interop.types.id], returns: interop.types.uint64 },
      draggingUpdated: { params: [interop.types.id], returns: interop.types.uint64 },
      prepareForDragOperation: { params: [interop.types.id], returns: interop.types.bool },
      performDragOperation: { params: [interop.types.id], returns: interop.types.bool },
      accessibilityPerformPress: { params: [], returns: interop.types.bool },
      accessibilityPerformIncrement: { params: [], returns: interop.types.bool },
      accessibilityPerformDecrement: { params: [], returns: interop.types.bool },
      accessibilityRole: { params: [], returns: interop.types.id },
      accessibilityLabel: { params: [], returns: interop.types.id },
      accessibilityTitle: { params: [], returns: interop.types.id },
      accessibilityValue: { params: [], returns: interop.types.id },
      accessibilityMinValue: { params: [], returns: interop.types.id },
      accessibilityMaxValue: { params: [], returns: interop.types.id },
      accessibilityValueDescription: { params: [], returns: interop.types.id },
      accessibilityHelp: { params: [], returns: interop.types.id },
      isAccessibilityEnabled: { params: [], returns: interop.types.bool },
      isAccessibilitySelected: { params: [], returns: interop.types.bool },
      isAccessibilityExpanded: { params: [], returns: interop.types.bool },
      accessibilityIsIgnored: { params: [], returns: interop.types.bool },
      isAccessibilityElement: { params: [], returns: interop.types.bool },
    }

    static {
      NativeClass(this)
    }

    accessibilityPerformPress() {
      const actionId = deps.actions.idForView(this)

      if (
        actionId === undefined ||
        !deps.actions.hasHandler(this) ||
        !this.isAccessibilityEnabled() ||
        this.accessibilityIsIgnored() ||
        deps.state.get(this)?.accessibilityState?.readonly
      ) {
        return false
      }

      deps.actions.invokeAction(actionId)
      return true
    }

    accessibilityPerformIncrement() {
      const props = deps.state.get(this)

      if (
        this.accessibilityIsIgnored() ||
        !this.isAccessibilityEnabled() ||
        props?.accessibilityState?.readonly ||
        typeof props?.onAccessibilityIncrement !== 'function'
      ) {
        return false
      }

      return props.onAccessibilityIncrement() !== false
    }

    accessibilityPerformDecrement() {
      const props = deps.state.get(this)

      if (
        this.accessibilityIsIgnored() ||
        !this.isAccessibilityEnabled() ||
        props?.accessibilityState?.readonly ||
        typeof props?.onAccessibilityDecrement !== 'function'
      ) {
        return false
      }

      return props.onAccessibilityDecrement() !== false
    }

    // @ts-ignore ObjC accessor methods satisfy the generated @property member.
    accessibilityRole() {
      const role = deps.state.get(this)?.accessibilityRole

      if (role === 'menu') {
        return 'AXMenu'
      }

      if (role === 'menuitem' || role === 'menuitemcheckbox' || role === 'menuitemradio') {
        return 'AXMenuItem'
      }

      if (role === 'radio' || role === 'tab') {
        return 'AXRadioButton'
      }

      if (role === 'tablist') {
        return 'AXTabGroup'
      }

      if (role === 'toolbar') {
        return 'AXToolbar'
      }

      if (role === 'switch') {
        return 'AXCheckBox'
      }

      if (role === 'adjustable') {
        return 'AXSlider'
      }

      if (role === 'separator') {
        return 'AXSplitter'
      }

      if (role === 'link') {
        return 'AXLink'
      }

      if (role === 'radiogroup') {
        return 'AXRadioGroup'
      }

      if (role === 'listbox') {
        return 'AXList'
      }

      if (role === 'option') {
        return 'AXRow'
      }

      if (
        role === 'button' &&
        typeof deps.state.get(this)?.accessibilityState?.pressed === 'boolean'
      ) {
        return 'AXCheckBox'
      }

      // ARIA 'meter' is AppKit's level indicator — a gauge of a scalar within
      // a range, distinct from task progress (AXProgressIndicator).
      return role === 'checkbox'
        ? 'AXCheckBox'
        : role === 'button'
          ? 'AXButton'
          : role === 'meter'
            ? 'AXLevelIndicator'
            : role === 'progressbar'
              ? 'AXProgressIndicator'
              : 'AXGroup'
    }

    // @ts-ignore ObjC accessor methods satisfy the generated @property member.
    accessibilityOrientation() {
      // NSAccessibilityOrientation: Unknown = 0, Vertical = 1, Horizontal = 2.
      const role = this.accessibilityRole()

      if (role === 'AXSplitter') {
        return 1
      }

      if (role === 'AXToolbar') {
        const axis = deps.state.get(this)?.accessibilityOrientation

        return axis === 'vertical' ? 1 : axis === 'horizontal' ? 2 : 0
      }

      // @ts-ignore super property read on the bridged superclass
      return super.accessibilityOrientation
    }

    // @ts-ignore ObjC accessor methods satisfy the generated @property member.
    accessibilityLabel() {
      return deps.state.get(this)?.accessibilityLabel ?? ''
    }

    // Menu rows need a title as well as the existing AX label. Preserve native
    // title behavior for other roles rather than replacing it with the label.
    // @ts-ignore ObjC accessor methods satisfy the generated @property member.
    accessibilityTitle() {
      if (this.accessibilityRole() === 'AXMenuItem') {
        return this.accessibilityLabel()
      }

      return Reflect.get(NSView.prototype, 'accessibilityTitle', this)
    }

    // @ts-ignore ObjC accessor methods satisfy the generated @property member.
    accessibilityValue() {
      const props = deps.state.get(this)
      const role = this.accessibilityRole()

      if (role === 'AXRadioButton') {
        return NSNumber.numberWithDouble(
          (deps.state.get(this)?.accessibilityRole === 'tab'
            ? props?.accessibilityState?.selected
            : props?.accessibilityState?.checked) === true
            ? 1
            : 0,
        )
      }

      if (role === 'AXCheckBox') {
        const state = props?.accessibilityState
        const checked =
          deps.state.get(this)?.accessibilityRole === 'button' &&
          typeof state?.pressed === 'boolean'
            ? state.pressed
            : state?.checked

        // AppKit uses 0/1/2 for off/on/mixed checkbox values.
        return NSNumber.numberWithDouble(checked === 'mixed' ? 2 : checked === true ? 1 : 0)
      }

      if (
        role === 'AXLevelIndicator' ||
        role === 'AXProgressIndicator' ||
        role === 'AXSlider' ||
        role === 'AXSplitter'
      ) {
        return NSNumber.numberWithDouble(Number(props?.accessibilityValue ?? 0))
      }

      return props?.accessibilityValue ?? ''
    }

    // @ts-ignore ObjC accessor methods satisfy the generated @property member.
    accessibilityMinValue() {
      return NSNumber.numberWithDouble(Number(deps.state.get(this)?.accessibilityMinValue ?? 0))
    }

    // @ts-ignore ObjC accessor methods satisfy the generated @property member.
    accessibilityMaxValue() {
      return NSNumber.numberWithDouble(Number(deps.state.get(this)?.accessibilityMaxValue ?? 100))
    }

    // @ts-ignore ObjC accessor methods satisfy the generated @property member.
    accessibilityValueDescription() {
      return String(deps.state.get(this)?.accessibilityValueDescription ?? '')
    }

    // @ts-ignore ObjC accessor methods satisfy the generated @property member.
    accessibilityHelp() {
      return deps.state.get(this)?.accessibilityHint ?? ''
    }

    // NSAccessibilityEnabledAttribute uses the protocol getter isAccessibilityEnabled.
    isAccessibilityEnabled() {
      return !deps.state.get(this)?.accessibilityState?.disabled
    }

    isAccessibilitySelected() {
      return deps.state.get(this)?.accessibilityState?.selected === true
    }

    isAccessibilityExpanded() {
      return deps.state.get(this)?.accessibilityState?.expanded === true
    }

    // NSAccessibility clients read isAccessibilityElement; plain NSView
    // answers NO, so the legacy accessibilityIsIgnored override alone left
    // interactive hosts out of the tree that VoiceOver and automation walk.
    isAccessibilityElement() {
      return !this.accessibilityIsIgnored()
    }

    accessibilityIsIgnored() {
      const props = deps.state.get(this)

      return (
        (!deps.state.get(this) && !deps.actions.hasHandler(this)) ||
        this.hiddenOrHasHiddenAncestor ||
        props?.accessible === false ||
        props?.accessibilityRole === 'none'
      )
    }
  }

  // The bridged class resolves NSAccessibility property accessors against
  // native storage, so the JS methods above only answer in-process callers —
  // KVC and the AX server see NSView's defaults. Push each computed value
  // through the matching setAccessibility* setter, which does reach ObjC.
  interface AccessibilitySetters {
    setAccessibilityElement?(value: boolean): void
    setAccessibilityRole?(value: string): void
    setAccessibilityLabel?(value: string): void
    setAccessibilityTitle?(value: string): void
    setAccessibilityValue?(value: unknown): void
    setAccessibilityValueDescription?(value: string): void
    setAccessibilityMinValue?(value: unknown): void
    setAccessibilityMaxValue?(value: unknown): void
    setAccessibilityHelp?(value: string): void
    setAccessibilityEnabled?(value: boolean): void
    setAccessibilitySelected?(value: boolean): void
    setAccessibilityExpanded?(value: boolean): void
  }

  function syncNativeAccessibility(view: object) {
    if (!(view instanceof AccessibleHostView)) {
      return
    }

    const setters = view as unknown as AccessibilitySetters
    // Each push computes and sets together: a getter that needs a native
    // helper absent from a partial shim (NSNumber in test boundaries) must
    // not take the rest of the sync down with it.
    const push = (apply: () => void) => {
      try {
        apply()
      } catch {
        // best-effort under partial native shims
      }
    }

    push(() => setters.setAccessibilityElement?.(view.isAccessibilityElement()))
    push(() => setters.setAccessibilityRole?.(view.accessibilityRole()))
    push(() => setters.setAccessibilityLabel?.(view.accessibilityLabel()))
    push(() => setters.setAccessibilityTitle?.(view.accessibilityTitle()))
    push(() => setters.setAccessibilityValue?.(view.accessibilityValue()))
    push(() =>
      setters.setAccessibilityValueDescription?.(view.accessibilityValueDescription()),
    )
    const props = deps.state.get(view)
    if (props?.accessibilityMinValue !== undefined) {
      push(() => setters.setAccessibilityMinValue?.(view.accessibilityMinValue()))
    }
    if (props?.accessibilityMaxValue !== undefined) {
      push(() => setters.setAccessibilityMaxValue?.(view.accessibilityMaxValue()))
    }
    push(() => setters.setAccessibilityHelp?.(view.accessibilityHelp()))
    push(() => setters.setAccessibilityEnabled?.(view.isAccessibilityEnabled()))
    push(() => setters.setAccessibilitySelected?.(view.isAccessibilitySelected()))
    push(() => setters.setAccessibilityExpanded?.(view.isAccessibilityExpanded()))
  }

  return {
    inputTransparentViews,
    scopeFocusTargets,
    tabStopSuppression,
    disabledFocusTargets,
    AccessibleHostView,
    syncNativeAccessibility,
  }
}
