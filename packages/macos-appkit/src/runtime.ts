import { configureTabContentRoots } from './tab-view'
import { nativeColor } from './native-colors'
import { installCompat } from './ns-compat'
import { installMasonElement } from './mason'
import { readOutlineHeadings } from './outline-headings.ts'
import { NSView } from '@octane-xplat/platform/macos'
import { readGridCells } from './grid-cells.ts'
import { installAppearanceBridge } from './appearance'
import { onStylesheetsChanged, setStyleEnvironment } from '@octane-xplat/css-engine'
import { imageCache, imageMemoryCache } from './image'
import type { PropBag } from './model'
import { showWindowLayer, type WindowLayerOptions } from './layer'
import { installPresentationBridge } from './presentation'
import '@nativescript/macos-node-api'
import { createRoots } from './roots'
import { createRegistry } from './registry'
import { createLayout } from './layout'
import { createSubscriptions } from './subscriptions'
import { createActions } from './actions'
import { createInputElements } from './input-elements'
import { createContainerElements } from './container-elements'
import { createAccessibleHost } from './accessible-host'
import { createControls } from './controls'
import { createTextElements } from './text-elements'
import { createImageElements } from './image-elements'
import { createNodes } from './nodes'
import { createNativeStyle } from './native-style'
import { createCssCascade } from './css-cascade'
import { createPointerStyle } from './pointer-style'
import { createOutlines } from './outlines'
import { createBackgroundPaint } from './background-paint'
import { createBorderPaint } from './border-paint'
import { createShadowPaint } from './shadow-paint'
import { createTransformPaint } from './transform-paint'
import { createAccessibility } from './accessibility'
import { createElementProps } from './element-props'
import { createProjection } from './projection'
import { createTree } from './tree'
import { createDriver } from './driver'
import { createHover } from './hover'
import { createPopover } from './popover'
import { createCssPseudoState } from './css-pseudo-state'
import { createContextMenu } from './context-menu'
import { createPickerBridge } from './picker-bridge'
import { createSheetBridge } from './sheet-bridge'
import { createHostBridge } from './host-bridge'
import { createStyleEnvironment } from './style-environment'
import { createAutomation } from './automation'
import { createMeasurements } from './measurements'

const roots = createRoots({
  get registry() {
    return registry
  },
  get borderPaint() {
    return borderPaint
  },
  get shadowPaint() {
    return shadowPaint
  },
  get driver() {
    return driver
  },
  get styleEnvironment() {
    return styleEnvironment
  },
  get automation() {
    return automation
  },
})

const registry = createRegistry({
  get nodes() {
    return nodes
  },
})

const layout = createLayout({
  get registry() {
    return registry
  },
  get nativeStyle() {
    return nativeStyle
  },
  get projection() {
    return projection
  },
  get containerElements() {
    return containerElements
  },
})

const subscriptions = createSubscriptions({
  get registry() {
    return registry
  },
  get accessibleHost() {
    return accessibleHost
  },
})

const actions = createActions({
  get registry() {
    return registry
  },
  get textElements() {
    return textElements
  },
  get cssPseudoState() {
    return cssPseudoState
  },
  get inputElements() {
    return inputElements
  },
})

const inputElements = createInputElements({
  get nativeStyle() {
    return nativeStyle
  },
  get actions() {
    return actions
  },
})

const containerElements = createContainerElements({
  get registry() {
    return registry
  },
  get nativeStyle() {
    return nativeStyle
  },
  get layout() {
    return layout
  },
  get controls() {
    return controls
  },
  get roots() {
    return roots
  },
})

const accessibleHost = createAccessibleHost({
  get actions() {
    return actions
  },
  get subscriptions() {
    return subscriptions
  },
})

const controls = createControls({
  get actions() {
    return actions
  },
  get textElements() {
    return textElements
  },
  get nativeStyle() {
    return nativeStyle
  },
  get layout() {
    return layout
  },
})

const textElements = createTextElements({
  get nativeStyle() {
    return nativeStyle
  },
  get cssCascade() {
    return cssCascade
  },
  get inputElements() {
    return inputElements
  },
  get layout() {
    return layout
  },
  get registry() {
    return registry
  },
  get actions() {
    return actions
  },
})

const imageElements = createImageElements({
  get accessibleHost() {
    return accessibleHost
  },
})

const nodes = createNodes({
  get registry() {
    return registry
  },
  get tree() {
    return tree
  },
  get controls() {
    return controls
  },
  get cssCascade() {
    return cssCascade
  },
  get containerElements() {
    return containerElements
  },
  get roots() {
    return roots
  },
  get inputElements() {
    return inputElements
  },
  get imageElements() {
    return imageElements
  },
  get actions() {
    return actions
  },
  get elementProps() {
    return elementProps
  },
  get cssPseudoState() {
    return cssPseudoState
  },
  get subscriptions() {
    return subscriptions
  },
  get layout() {
    return layout
  },
  get backgroundPaint() {
    return backgroundPaint
  },
  get borderPaint() {
    return borderPaint
  },
  get accessibleHost() {
    return accessibleHost
  },
})

const nativeStyle = createNativeStyle({
  get textElements() {
    return textElements
  },
  get inputElements() {
    return inputElements
  },
  get registry() {
    return registry
  },
  get layout() {
    return layout
  },
  get cssCascade() {
    return cssCascade
  },
  get measurements() {
    return measurements
  },
  get backgroundPaint() {
    return backgroundPaint
  },
  get accessibleHost() {
    return accessibleHost
  },
  get pointerStyle() {
    return pointerStyle
  },
  get outlines() {
    return outlines
  },
  get borderPaint() {
    return borderPaint
  },
  get transformPaint() {
    return transformPaint
  },
  get shadowPaint() {
    return shadowPaint
  },
})

const cssCascade = createCssCascade({
  get hostBridge() {
    return hostBridge
  },
  get layout() {
    return layout
  },
  get roots() {
    return roots
  },
  get nativeStyle() {
    return nativeStyle
  },
  get controls() {
    return controls
  },
  get textElements() {
    return textElements
  },
  get inputElements() {
    return inputElements
  },
})

const pointerStyle = createPointerStyle({
  get hover() {
    return hover
  },
})

const outlines = createOutlines({
  get nativeStyle() {
    return nativeStyle
  },
  get borderPaint() {
    return borderPaint
  },
})

const backgroundPaint = createBackgroundPaint({
  get nativeStyle() {
    return nativeStyle
  },
  get borderPaint() {
    return borderPaint
  },
})

const borderPaint = createBorderPaint({
  get nativeStyle() {
    return nativeStyle
  },
  get transformPaint() {
    return transformPaint
  },
  get shadowPaint() {
    return shadowPaint
  },
})

const shadowPaint = createShadowPaint({
  get borderPaint() {
    return borderPaint
  },
})

const transformPaint = createTransformPaint({
  get borderPaint() {
    return borderPaint
  },
  get shadowPaint() {
    return shadowPaint
  },
  get backgroundPaint() {
    return backgroundPaint
  },
})

const accessibility = createAccessibility({
  get accessibleHost() {
    return accessibleHost
  },
})

const elementProps = createElementProps({
  get nodes() {
    return nodes
  },
  get containerElements() {
    return containerElements
  },
  get actions() {
    return actions
  },
  get textElements() {
    return textElements
  },
  get cssCascade() {
    return cssCascade
  },
  get controls() {
    return controls
  },
  get layout() {
    return layout
  },
  get subscriptions() {
    return subscriptions
  },
  get registry() {
    return registry
  },
  get accessibleHost() {
    return accessibleHost
  },
  get accessibility() {
    return accessibility
  },
  get nativeStyle() {
    return nativeStyle
  },
  get inputElements() {
    return inputElements
  },
})

const projection = createProjection({
  get nativeStyle() {
    return nativeStyle
  },
  get layout() {
    return layout
  },
  get cssCascade() {
    return cssCascade
  },
  get registry() {
    return registry
  },
  get nodes() {
    return nodes
  },
})

const tree = createTree({
  get cssCascade() {
    return cssCascade
  },
  get projection() {
    return projection
  },
  get nativeStyle() {
    return nativeStyle
  },
  get layout() {
    return layout
  },
  get textElements() {
    return textElements
  },
  get controls() {
    return controls
  },
  get registry() {
    return registry
  },
  get containerElements() {
    return containerElements
  },
})

const driver = createDriver({
  get registry() {
    return registry
  },
  get nodes() {
    return nodes
  },
  get tree() {
    return tree
  },
  get projection() {
    return projection
  },
  get elementProps() {
    return elementProps
  },
  get cssCascade() {
    return cssCascade
  },
  get cssPseudoState() {
    return cssPseudoState
  },
  get layout() {
    return layout
  },
})

const hover = createHover({
  get actions() {
    return actions
  },
  get contextMenu() {
    return contextMenu
  },
})

const popover = createPopover({
  get roots() {
    return roots
  },
})

const cssPseudoState = createCssPseudoState({
  get hover() {
    return hover
  },
  get cssCascade() {
    return cssCascade
  },
  get registry() {
    return registry
  },
  get subscriptions() {
    return subscriptions
  },
  get roots() {
    return roots
  },
})

const contextMenu = createContextMenu({
  get actions() {
    return actions
  },
})

const pickerBridge = createPickerBridge({
  get actions() {
    return actions
  },
  get controls() {
    return controls
  },
})

const sheetBridge = createSheetBridge({
  get popover() {
    return popover
  },
})

const hostBridge = createHostBridge()

const styleEnvironment = createStyleEnvironment({
  get cssPseudoState() {
    return cssPseudoState
  },
  get cssCascade() {
    return cssCascade
  },
  get roots() {
    return roots
  },
})

const automation = createAutomation({
  get roots() {
    return roots
  },
  get measurements() {
    return measurements
  },
  get cssCascade() {
    return cssCascade
  },
  get accessibleHost() {
    return accessibleHost
  },
  get actions() {
    return actions
  },
  get hover() {
    return hover
  },
  get popover() {
    return popover
  },
})

const measurements = createMeasurements({
  get nativeStyle() {
    return nativeStyle
  },
  get textElements() {
    return textElements
  },
  get borderPaint() {
    return borderPaint
  },
  get roots() {
    return roots
  },
})

/** Install shared adapters only after every service has been constructed. */
function initializeRuntime() {
  configureTabContentRoots(
    (host, fontFamily) => roots.createMacOSRoot(host, { fontFamily }),
    nativeColor,
  )

  const compatInstallation = installCompat({
    registerElementType: registry.registerElementType,
    applyStyle: cssCascade.setNodeInlineStyle,
    applyClassName: cssCascade.applyClassName,
    applyAccessibility: accessibility.applyAccessibility,
    queueLayoutReconcile: layout.queueLayoutReconcile,
  })

  // Every service is constructed before registration, so Mason can subclass
  // the accessible host and adapters can call across subsystem boundaries.
  const masonElementRegistration = installMasonElement({
    registerElementType: registry.registerElementType,
    layoutView: layout.layoutView,
    pinLayoutChild: layout.pinLayoutChild,
    queueLayoutReconcile: layout.queueLayoutReconcile,
    detach: tree.detach,
    applyStyle: cssCascade.setNodeInlineStyle,
    applyClassName: cssCascade.applyClassName,
    applyAccessibility: accessibility.applyAccessibility,
    wireAction: controls.wireViewAction,
    setAction: actions.setAction,
    setPanAction: actions.setPanAction,
    makeScrollView: controls.makeScrollView,
    baseView: accessibleHost.AccessibleHostView,
  })

  hostBridge.appKitBridge.readOutlineHeadings = (view) =>
    readOutlineHeadings(view, (child) => registry.cssNodesByView.get(child as NSView))

  hostBridge.appKitBridge.readGridCells = (view, nestedRoots) =>
    readGridCells(view, (child) => registry.cssNodesByView.get(child as NSView), nestedRoots)

  installAppearanceBridge(hostBridge.appKitBridge)

  onStylesheetsChanged(styleEnvironment.restyleAllContainers)

  // Media environment: each cascade evaluates against the styling node's own
  // window (envForNode); stray evaluation outside a restyle keeps the
  // largest-window default.
  setStyleEnvironment(() => {
    const node = cssCascade.activeMediaNode
    if (node) {
      return cssCascade.envForNode(node)
    }
    return { ...cssCascade.largestWindowSize(), ...cssCascade.mediaSharedEnv() }
  })

  // Appearance flips change ns-light/ns-dark on roots and may flip media-gated rules.
  hostBridge.appKitBridge.onAppearanceChange?.(() => styleEnvironment.restyleAllContainers())

  hostBridge.appKitBridge.imageMemoryCache = imageMemoryCache

  hostBridge.appKitBridge.imageCache = imageCache

  hostBridge.appKitBridge.observeHover = hover.observeHover

  hostBridge.appKitBridge.observePointerMotion = (
    view: NSView,
    handlers: { move(x: number, y: number): void; exit(): void },
  ) => hover.pointerMotion.observe(view, handlers, hover.hoverTrackingTarget)

  hostBridge.appKitBridge.locatePointer = (view: NSView) => hover.pointerMotion.locate(view)

  hostBridge.appKitBridge.retainTableStickyPlacement = layout.stickyPlacements.retain

  Object.defineProperty(hostBridge.appKitBridge, 'containerRevealSupported', {
    configurable: true,
    enumerable: true,
    get: () => {
      cssPseudoState.installFocusObserver()
      return Boolean(hover.hoverTrackingTarget && cssPseudoState.focusObserverInstalled)
    },
  })

  Object.defineProperty(hostBridge.appKitBridge, 'keyboardEventsSupported', {
    configurable: true,
    enumerable: true,
    get: subscriptions.keyboardDispatcher.available,
  })

  Object.defineProperty(hostBridge.appKitBridge, 'focusWithinSupported', {
    configurable: true,
    enumerable: true,
    get: subscriptions.focusWithinDispatcher.available,
  })

  hostBridge.appKitBridge.dispatchKeyboardEvent = subscriptions.keyboardDispatcher.dispatch

  hostBridge.appKitBridge.observeHardwareKeys = subscriptions.keyboardDispatcher.observe

  hostBridge.appKitBridge.observeViewKeys = subscriptions.observeViewKeys

  Object.defineProperty(hostBridge.appKitBridge, 'contextMenuEventsSupported', {
    configurable: true,
    enumerable: true,
    get: subscriptions.contextPointerDispatcher.available,
  })

  hostBridge.appKitBridge.observeContextMenu = subscriptions.observeContextMenu

  hostBridge.appKitBridge.observeFileDrop = subscriptions.observeFileDrop

  hostBridge.appKitBridge.observePointerInput = (
    notify: (event: { type: number; modifierFlags: number }) => void,
  ) => {
    const off = subscriptions.contextPointerDispatcher.observe(notify)
    if (!subscriptions.contextPointerDispatcher.available()) {
      off()
      throw new Error('AppKit pointer observation unavailable')
    }
    return off
  }

  hostBridge.appKitBridge.suppressTabStop = (view: NSView) =>
    accessibleHost.tabStopSuppression.retain(view)

  hostBridge.appKitBridge.retainDisabledFocus = (view: NSView) =>
    accessibleHost.disabledFocusTargets.retain(view)

  hostBridge.appKitBridge.retainFocusTarget = (view: NSView) => {
    accessibleHost.scopeFocusTargets.set(
      view,
      (accessibleHost.scopeFocusTargets.get(view) ?? 0) + 1,
    )
    let active = true
    return () => {
      if (!active) {
        return
      }
      active = false
      const count = (accessibleHost.scopeFocusTargets.get(view) ?? 1) - 1
      if (count > 0) {
        accessibleHost.scopeFocusTargets.set(view, count)
      } else {
        accessibleHost.scopeFocusTargets.delete(view)
      }
    }
  }

  hostBridge.appKitBridge.showAnchoredPopup = popover.showAnchoredPopup

  hostBridge.appKitBridge.showLayer = (options: PropBag) =>
    showWindowLayer(options as WindowLayerOptions, {
      createRoot: (view: NSView, anchor: NSView) =>
        roots.createMacOSRoot(view, { fontFamily: roots.fontFamilyForView(anchor) }),
      fittingSize: popover.popupFittingSize,
    })

  hostBridge.appKitBridge.attachContextMenu = contextMenu.attachContextMenu

  hostBridge.appKitBridge.attachPicker = pickerBridge.attachPicker

  hostBridge.appKitBridge.attachDatePicker = pickerBridge.attachDatePicker

  hostBridge.appKitBridge.presentSheet = sheetBridge.presentSheet

  installPresentationBridge(hostBridge.appKitBridge, roots.createMacOSRoot, roots.fontFamilyForView)
}
initializeRuntime()

export const { createMacOSRoot, observeLayoutCommits, setLayoutProjectionScale } = roots
export type { MacOSRootOptions } from './roots'
