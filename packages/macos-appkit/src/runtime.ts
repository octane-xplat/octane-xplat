import { createCssAnimations } from './css-animations'
import { createPickerElements } from './picker-elements'
import { createHostedElements } from './hosted-elements'
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

const registry = createRegistry()

const roots = createRoots({
  registry,
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

const layout = createLayout({
  registry,
  get projection() {
    return projection
  },
  get containerElements() {
    return containerElements
  },
})

const subscriptions = createSubscriptions({
  registry,
  get accessibleHost() {
    return accessibleHost
  },
})

const actions = createActions({
  registry,
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
  get textElements() {
    return textElements
  },
  get nativeStyle() {
    return nativeStyle
  },
  actions,
  get cssCascade() {
    return cssCascade
  },
  get accessibility() {
    return accessibility
  },
})

const containerElements = createContainerElements({
  registry,
  layout,
  get textElements() {
    return textElements
  },
  roots,
  get cssCascade() {
    return cssCascade
  },
  actions,
  get accessibility() {
    return accessibility
  },
  get tree() {
    return tree
  },
})

const accessibleHost = createAccessibleHost({
  actions,
  subscriptions,
})

const controls = createControls({
  actions,
  get cssCascade() {
    return cssCascade
  },
  get accessibility() {
    return accessibility
  },
  accessibleHost,
})

const textElements = createTextElements({
  get nativeStyle() {
    return nativeStyle
  },
  get cssCascade() {
    return cssCascade
  },
  inputElements,
  layout,
  registry,
  actions,
  get accessibility() {
    return accessibility
  },
  get tree() {
    return tree
  },
})

const imageElements = createImageElements({
  accessibleHost,
  get cssCascade() {
    return cssCascade
  },
})

const nodes = createNodes({
  get cssAnimations() {
    return cssAnimations
  },
  registry,
  get tree() {
    return tree
  },
  get pickerElements() {
    return pickerElements
  },
  get cssCascade() {
    return cssCascade
  },
  containerElements,
  roots,
  controls,
  textElements,
  inputElements,
  imageElements,
  actions,
  get elementProps() {
    return elementProps
  },
  get cssPseudoState() {
    return cssPseudoState
  },
  subscriptions,
  get hostedElements() {
    return hostedElements
  },
  get projection() {
    return projection
  },
  get backgroundPaint() {
    return backgroundPaint
  },
  get borderPaint() {
    return borderPaint
  },
  layout,
  accessibleHost,
})

const nativeStyle = createNativeStyle({
  textElements,
  inputElements,
  registry,
  layout,
  get cssCascade() {
    return cssCascade
  },
  get backgroundPaint() {
    return backgroundPaint
  },
  accessibleHost,
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
  get cssAnimations() {
    return cssAnimations
  },
  get hostBridge() {
    return hostBridge
  },
  layout,
  roots,
  nativeStyle,
  controls,
  textElements,
  inputElements,
})

const pointerStyle = createPointerStyle({
  get hover() {
    return hover
  },
})

const outlines = createOutlines({
  get borderPaint() {
    return borderPaint
  },
})

const backgroundPaint = createBackgroundPaint({
  get borderPaint() {
    return borderPaint
  },
})

const borderPaint = createBorderPaint({
  get transformPaint() {
    return transformPaint
  },
  get shadowPaint() {
    return shadowPaint
  },
})

const shadowPaint = createShadowPaint({
  borderPaint,
})

const transformPaint = createTransformPaint({
  borderPaint,
  shadowPaint,
  backgroundPaint,
})

const accessibility = createAccessibility({
  accessibleHost,
})

const elementProps = createElementProps({
  nodes,
  containerElements,
  actions,
  textElements,
  cssCascade,
  get pickerElements() {
    return pickerElements
  },
  layout,
  subscriptions,
  registry,
  accessibleHost,
  accessibility,
  get hostedElements() {
    return hostedElements
  },
  controls,
  inputElements,
  imageElements,
  nativeStyle,
})

const projection = createProjection({
  nativeStyle,
  layout,
  cssCascade,
  registry,
  get tree() {
    return tree
  },
})

const tree = createTree({
  get cssAnimations() {
    return cssAnimations
  },
  cssCascade,
  projection,
  nativeStyle,
  layout,
  textElements,
  get pickerElements() {
    return pickerElements
  },
  registry,
  containerElements,
})

const driver = createDriver({
  registry,
  nodes,
  tree,
  projection,
  elementProps,
  cssCascade,
  get cssPseudoState() {
    return cssPseudoState
  },
  layout,
})

const hover = createHover()

const popover = createPopover({
  roots,
})

const cssPseudoState = createCssPseudoState({
  hover,
  cssCascade,
  registry,
  subscriptions,
  roots,
})

const contextMenu = createContextMenu({
  actions,
})

const pickerBridge = createPickerBridge({
  actions,
  get pickerElements() {
    return pickerElements
  },
})

const sheetBridge = createSheetBridge({
  popover,
})

const hostBridge = createHostBridge()

const styleEnvironment = createStyleEnvironment({
  cssPseudoState,
  cssCascade,
  roots,
})

const automation = createAutomation({
  roots,
  get measurements() {
    return measurements
  },
  cssCascade,
  accessibleHost,
  actions,
  hover,
  popover,
})

const measurements = createMeasurements({
  textElements,
  borderPaint,
  roots,
})

/** Install shared adapters only after every service has been constructed. */
const pickerElements = createPickerElements({
  actions,
  layout,
  cssCascade,
  accessibility,
  tree,
})
const hostedElements = createHostedElements({
  cssCascade,
  accessibility,
  tree,
})

const cssAnimations = createCssAnimations({
  nativeStyle,
})

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
