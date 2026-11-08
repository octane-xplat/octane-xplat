import type { Hover } from './hover'
import type { CssCascade } from './css-cascade'
import type { Registry } from './registry'
import type { Subscriptions } from './subscriptions'
import type { RootDirectoryReader } from './root-directory'
import type { ElementNode, RootContainer } from './model'
import {
  NSNotification,
  NSNotificationCenter,
  NSTrackingArea,
  NSWindowDidUpdateNotification,
} from '@octane-xplat/platform/macos'

import { stylesheetPseudoClasses } from '@octane-xplat/css-engine'
import { setVisualStateTracking } from './gestures'

interface Dependencies {
  hover: Pick<Hover, 'hoverTrackingTarget' | 'HOVER_TRACKING_OPTIONS' | 'hoverRecordsByArea'>
  cssCascade: Pick<CssCascade, 'setPseudoClass' | 'syncNormalState'>
  registry: Pick<Registry, 'cssNodesByView'>
  subscriptions: Pick<Subscriptions, 'keyboardDispatcher' | 'contextPointerDispatcher'>
  directory: Pick<RootDirectoryReader, 'containers'>
}

export type CssPseudoState = ReturnType<typeof createCssPseudoState>

export function createCssPseudoState(deps: Dependencies) {
  // ---- CSS pseudo-classes -----------------------------------------------------
  // NS `updateDynamicState` parity — the GTK renderer's `syncPseudoState`
  // contract with AppKit sources: NSTrackingArea for :hover, the passive press
  // recognizer for :active/:pressed/:highlighted, and window firstResponder for
  // :focus/:focus-visible/:focus-within. Wiring attaches once per node view and
  // only when a registered selector uses the state
  // (stylesheetPseudoClasses()); setPseudoClass gates the actual restyle on the
  // same set. `observeHover` is NOT reused — it keeps one record per view for
  // Tooltip/Hoverable and would drop whichever handler registered first; the
  // CSS hook keeps its own area in the shared dispatch instead.

  /** Own tracking area per node in the shared hover dispatch — returns the
   *  unsubscribe for destroy. */
  function observePseudoHover(node: ElementNode) {
    const view = node.view!

    if (
      typeof view.addTrackingArea !== 'function' ||
      typeof NSTrackingArea === 'undefined' ||
      !deps.hover.hoverTrackingTarget
    ) {
      return () => {}
    }

    const area = NSTrackingArea.alloc().initWithRectOptionsOwnerUserInfo(
      { origin: { x: 0, y: 0 }, size: { width: 0, height: 0 } },
      deps.hover.HOVER_TRACKING_OPTIONS,
      deps.hover.hoverTrackingTarget,
      null,
    )

    if (!area) {
      return () => {}
    }

    view.addTrackingArea(area)
    deps.hover.hoverRecordsByArea.set(area, {
      enter: () => {
        deps.cssCascade.setPseudoClass(node, 'hover', true)
      },
      exit: () => {
        deps.cssCascade.setPseudoClass(node, 'hover', false)
      },
    })

    return () => {
      deps.hover.hoverRecordsByArea.delete(area)
      try {
        view.removeTrackingArea(area)
      } catch {
        // already detached
      }
    }
  }

  /** NS ACTIVE parity: the down event sets highlighted/active/pressed together
   *  (view-common.js maps all three to the same flag). */
  function syncPressedState(node: ElementNode, pressed: boolean) {
    deps.cssCascade.setPseudoClass(node, 'highlighted', pressed)
    deps.cssCascade.setPseudoClass(node, 'active', pressed)
    deps.cssCascade.setPseudoClass(node, 'pressed', pressed)
    deps.cssCascade.syncNormalState(node)
  }

  /** Read the live AppKit state a node exposes — the switch's `state` drives
   *  :checked like Gtk.Switch's `active`; :normal recomputes after every
   *  pseudo change, matching NS updateDynamicState. */
  function syncPseudoState(node: ElementNode) {
    const view = node.view

    if (!view) {
      return
    }

    if (node.type === 'switch') {
      deps.cssCascade.setPseudoClass(node, 'checked', Number(view.state) === 1)
    }

    deps.cssCascade.syncNormalState(node)
  }

  /** Attach the node's tracking pieces for the pseudo-classes registered
   *  selectors actually use. Idempotent — safe to repeat after stylesheet
   *  registration. */
  function syncPseudoTracking(node: ElementNode) {
    const view = node.view

    if (!view) {
      return
    }

    const used = stylesheetPseudoClasses()

    if (used.has('hover') && !node.cssHoverDispose) {
      node.cssHoverDispose = observePseudoHover(node)
    }

    if (
      (used.has('active') || used.has('pressed') || used.has('highlighted')) &&
      !node.cssStateRecognizer
    ) {
      setVisualStateTracking(node, (pressed) => syncPressedState(node, pressed))
    }

    syncPseudoState(node)
  }

  /** The node whose view is (or contains) the window's first responder. The
   *  field editor resolves through its delegate back to the textfield; any
   *  other responder resolves up the superview chain to an owned view. */
  function focusedCssNode(container: RootContainer): ElementNode | null {
    const responder: any = container.hostView?.window?.firstResponder

    if (!responder) {
      return null
    }

    for (let view = responder; view; view = view.superview) {
      const node = deps.registry.cssNodesByView.get(view)

      if (node) {
        return node
      }
    }

    for (let view = responder.delegate; view; view = view?.superview) {
      const node = deps.registry.cssNodesByView.get(view)

      if (node) {
        return node
      }
    }

    return null
  }

  /** Diff window firstResponder onto :focus/:focus-visible/:focus-within. The
   *  focused node owns :focus (+:focus-within itself, matching GTK's
   *  FOCUS_WITHIN→both mapping); ancestors own :focus-within. :focus-visible
   *  matches when the focused node accepts text entry (browser parity —
   *  fields take keyboard input even after a pointer focus), when an
   *  in-flight keyView traversal reports a non-zero direction, or when the
   *  last input event marked keyboard modality. */
  function syncContainerFocus(container: RootContainer) {
    const window = container.hostView?.window
    const focused = focusedCssNode(container)
    const keyboard =
      focused !== null &&
      (focused.type === 'textfield' ||
        focused.type === 'textview' ||
        focused.type === 'searchbar' ||
        Number(window?.keyViewSelectionDirection) !== 0 ||
        cssInputModality === 'keyboard')

    const prev = container.cssFocusChain ?? []
    const next: ElementNode[] = []

    if (focused) {
      next.push(focused)
      for (let p = focused.parent; p; p = p.parent) {
        next.push(p)
      }
    }

    if (
      container.cssFocusVisible === keyboard &&
      prev.length === next.length &&
      prev.every((member, i) => next[i] === member)
    ) {
      return
    }

    for (const old of prev) {
      deps.cssCascade.setPseudoClass(old, 'focus', false)
      deps.cssCascade.setPseudoClass(old, 'focus-visible', false)
      deps.cssCascade.setPseudoClass(old, 'focus-within', false)
    }

    if (focused) {
      deps.cssCascade.setPseudoClass(focused, 'focus', true)
      deps.cssCascade.setPseudoClass(focused, 'focus-visible', keyboard)
      deps.cssCascade.setPseudoClass(focused, 'focus-within', true)
    }

    for (const ancestor of next.slice(1)) {
      deps.cssCascade.setPseudoClass(ancestor, 'focus-within', true)
    }

    container.cssFocusChain = next
    container.cssFocusVisible = keyboard
  }

  // :focus-visible tracks the last input modality, not only
  // keyViewSelectionDirection — that property reports the direction the
  // window is *currently* using to change key view, so the later window-update
  // read may already see DirectSelection (unverified natively). The existing dispatchers
  // observe every key/pointer event without consuming it; an unmodified
  // keyDown marks keyboard modality (Shift allowed so Shift+Tab counts —
  // keyUp and modified shortcuts leave it unchanged) and a mouse-down marks
  // pointer modality. Mirrors ui/src/focus-visible-source.macos.ts.
  let cssInputModality: 'keyboard' | 'pointer' | 'unknown' = 'unknown'

  let cssModalityObserved = false

  function installCssModalityObserver() {
    if (cssModalityObserved) {
      return
    }

    cssModalityObserved = true
    deps.subscriptions.keyboardDispatcher.observe((event) => {
      if (
        Number(event.type) === 10 &&
        !(Number(event.modifierFlags) & ((1 << 18) | (1 << 19) | (1 << 20)))
      ) {
        cssInputModality = 'keyboard'
      }
    })

    deps.subscriptions.contextPointerDispatcher.observe((event) => {
      if (event.type === 1 || event.type === 3 || event.type === 25) {
        cssInputModality = 'pointer'
      }
    })
  }

  // firstResponder changes never post their own notification; the window
  // update that follows a focus move (focus ring, caret) does.
  let focusObserverInstalled = false

  function installFocusObserver() {
    if (focusObserverInstalled || typeof NSNotificationCenter === 'undefined') {
      return
    }

    const center = NSNotificationCenter.defaultCenter

    if (!center || typeof center.addObserverForNameObjectQueueUsingBlock !== 'function') {
      return
    }

    try {
      const token = center.addObserverForNameObjectQueueUsingBlock(
        NSWindowDidUpdateNotification ?? 'NSWindowDidUpdateNotification',
        null,
        null,
        (notification: NSNotification) => {
          for (const container of deps.directory.containers()) {
            if (container.hostView?.window === notification?.object) {
              syncContainerFocus(container)
            }
          }
        },
      )

      focusObserverInstalled = token != null
    } catch (error) {
      console.warn('[macos-css] focus observation unavailable', error)
    }
  }

  /** Wire a container's live nodes for the used pseudo-classes and resync
   *  focus — runs on every stylesheet/appearance restyle so nodes created
   *  before registration pick tracking up late. */
  function syncContainerPseudoState(container: RootContainer) {
    const used = stylesheetPseudoClasses()

    if (used.has('focus') || used.has('focus-visible') || used.has('focus-within')) {
      installFocusObserver()
    }

    if (used.has('focus-visible')) {
      installCssModalityObserver()
    }

    for (const node of container.nodes.values()) {
      syncPseudoTracking(node)
    }

    for (const entry of container.portalTargets.values()) {
      syncPseudoTracking(entry.root)
    }

    if (focusObserverInstalled) {
      syncContainerFocus(container)
    }
  }

  return {
    syncPseudoState,
    syncPseudoTracking,
    get focusObserverInstalled() {
      return focusObserverInstalled
    },
    set focusObserverInstalled(value: typeof focusObserverInstalled) {
      focusObserverInstalled = value
    },
    installFocusObserver,
    syncContainerPseudoState,
  }
}
