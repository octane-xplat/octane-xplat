import type { Actions } from './actions'
import type { Subscriptions } from './subscriptions'
import type { PropBag } from './model'
import { createTabStopSuppression } from './tab-stop'
import { createDisabledFocusTargets } from './disabled-focus'
import { NSNumber, NSView, NativeClass, interop } from '@octane-xplat/platform/macos'

interface Dependencies {
  actions: Pick<Actions, 'actionHandlers' | 'actionIdsByView' | 'invokeAction'>
  subscriptions: Pick<Subscriptions, 'fileDropRegistry'>
}

export type AccessibleHost = ReturnType<typeof createAccessibleHost>

export function createAccessibleHost(deps: Dependencies) {
  const accessibilityLabels = new Map<number, string>()

  const accessibilityRoles = new Map<number, string>()

  const stackAccessibilityPropsByView = new WeakMap<object, PropBag>()

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
        typeof deps.actions.actionHandlers.get(deps.actions.actionIdsByView.get(this) ?? -1) ===
          'function' ||
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
        !stackAccessibilityPropsByView.get(this)?.accessibilityState?.readonly &&
        typeof deps.actions.actionHandlers.get(deps.actions.actionIdsByView.get(this) ?? -1) ===
          'function'
      ) {
        deps.actions.invokeAction(deps.actions.actionIdsByView.get(this)!)
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
    }

    static {
      NativeClass(this)
    }

    accessibilityPerformPress() {
      const actionId = deps.actions.actionIdsByView.get(this)
      if (
        actionId === undefined ||
        typeof deps.actions.actionHandlers.get(actionId) !== 'function' ||
        !this.isAccessibilityEnabled() ||
        this.accessibilityIsIgnored() ||
        stackAccessibilityPropsByView.get(this)?.accessibilityState?.readonly
      ) {
        return false
      }

      deps.actions.invokeAction(actionId)
      return true
    }

    accessibilityPerformIncrement() {
      const props = stackAccessibilityPropsByView.get(this)
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
      const props = stackAccessibilityPropsByView.get(this)
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
      const role = accessibilityRoles.get(deps.actions.actionIdsByView.get(this) ?? -1)
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
        typeof stackAccessibilityPropsByView.get(this)?.accessibilityState?.pressed === 'boolean'
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
        const axis = stackAccessibilityPropsByView.get(this)?.accessibilityOrientation
        return axis === 'vertical' ? 1 : axis === 'horizontal' ? 2 : 0
      }
      // @ts-ignore super property read on the bridged superclass
      return super.accessibilityOrientation
    }

    // @ts-ignore ObjC accessor methods satisfy the generated @property member.
    accessibilityLabel() {
      return accessibilityLabels.get(deps.actions.actionIdsByView.get(this) ?? -1) ?? ''
    }

    // Menu rows need a title as well as the existing AX label. Preserve native
    // title behavior for other roles rather than replacing it with the label.
    // @ts-ignore ObjC accessor methods satisfy the generated @property member.
    accessibilityTitle() {
      return this.accessibilityRole() === 'AXMenuItem'
        ? this.accessibilityLabel()
        : // @ts-ignore super property read on the bridged superclass
          super.accessibilityTitle
    }

    // @ts-ignore ObjC accessor methods satisfy the generated @property member.
    accessibilityValue() {
      const props = stackAccessibilityPropsByView.get(this)
      const role = this.accessibilityRole()
      if (role === 'AXRadioButton') {
        return NSNumber.numberWithDouble(
          (accessibilityRoles.get(deps.actions.actionIdsByView.get(this) ?? -1) === 'tab'
            ? props?.accessibilityState?.selected
            : props?.accessibilityState?.checked) === true
            ? 1
            : 0,
        )
      }

      if (role === 'AXCheckBox') {
        const state = props?.accessibilityState
        const checked =
          accessibilityRoles.get(deps.actions.actionIdsByView.get(this) ?? -1) === 'button' &&
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
      return NSNumber.numberWithDouble(
        Number(stackAccessibilityPropsByView.get(this)?.accessibilityMinValue ?? 0),
      )
    }

    // @ts-ignore ObjC accessor methods satisfy the generated @property member.
    accessibilityMaxValue() {
      return NSNumber.numberWithDouble(
        Number(stackAccessibilityPropsByView.get(this)?.accessibilityMaxValue ?? 100),
      )
    }

    // @ts-ignore ObjC accessor methods satisfy the generated @property member.
    accessibilityValueDescription() {
      return String(stackAccessibilityPropsByView.get(this)?.accessibilityValueDescription ?? '')
    }

    // @ts-ignore ObjC accessor methods satisfy the generated @property member.
    accessibilityHelp() {
      return stackAccessibilityPropsByView.get(this)?.accessibilityHint ?? ''
    }

    // NSAccessibilityEnabledAttribute uses the protocol getter isAccessibilityEnabled.
    isAccessibilityEnabled() {
      return !stackAccessibilityPropsByView.get(this)?.accessibilityState?.disabled
    }

    isAccessibilitySelected() {
      return stackAccessibilityPropsByView.get(this)?.accessibilityState?.selected === true
    }

    isAccessibilityExpanded() {
      return stackAccessibilityPropsByView.get(this)?.accessibilityState?.expanded === true
    }

    accessibilityIsIgnored() {
      const props = stackAccessibilityPropsByView.get(this)
      return (
        deps.actions.actionIdsByView.get(this) === undefined ||
        props?.accessible === false ||
        props?.accessibilityRole === 'none'
      )
    }
  }
  return {
    accessibilityLabels,
    accessibilityRoles,
    stackAccessibilityPropsByView,
    inputTransparentViews,
    scopeFocusTargets,
    tabStopSuppression,
    disabledFocusTargets,
    AccessibleHostView,
  }
}
