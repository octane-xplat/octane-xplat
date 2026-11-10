import { activateRuntime, assertRuntimeActive } from './runtime-activation'
import { createElementAdapters } from './adapter-assembly'
import { createBoxPaint } from './box-paint'
import { createCssAnimations } from './css-animations'
import { createPickerElements } from './picker-elements'
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
import { createRootDirectory } from './root-directory'
import { createLayoutProjection } from './layout-projection'
import { createRegistry } from './registry'
import { createLayout } from './layout'
import { createSubscriptions } from './subscriptions'
import { createActionStore } from './action-store'
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
import { createAccessibilityState } from './accessibility-state'
import { createAccessibility } from './accessibility'
import { createElementProps } from './element-props'
import { createProjection } from './projection'
import { createTree } from './tree'
import { createDriver } from './driver'
import { createHover } from './hover'
import { appKitGestureSurface } from './gesture-input'
import { observeSecondaryActivation } from './gestures'
import { createPopover } from './popover'
import { createCssPseudoState } from './css-pseudo-state'
import { createContextMenu } from './context-menu'
import { createAppMenu } from './app-menu'
import { createPickerBridge } from './picker-bridge'
import { createSheetBridge } from './sheet-bridge'
import { createHostBridge } from './host-bridge'
import { createStyleEnvironment } from './style-environment'
import { createAutomation } from './automation'
import { createMeasurements } from './measurements'

// Construction registers process-owned native classes. Forward operations below
// are event/lifecycle work only: constructors and installers cannot call them.
const registry = createRegistry()

const boxPaint = createBoxPaint()

const rootDirectory = createRootDirectory()

const directory = rootDirectory.reader

const layoutProjection = createLayoutProjection({ boxPaint, registry })

const hostBridge = createHostBridge()

const hover = createHover()

const pointerStyle = createPointerStyle({
  hover,
})

const layout = createLayout({
  registry,
  projection: {
    syncProxyProjection(...args) {
      assertRuntimeActive('layout.syncProxyProjection')
      return projection.syncProxyProjection(...args)
    },
  },
})

const actionStore = createActionStore()
const accessibilityState = createAccessibilityState()

const inputElements = createInputElements({
  textElements: {
    makeLabel(...args) {
      assertRuntimeActive('inputElements.makeLabel')
      return textElements.makeLabel(...args)
    },
  },
  nativeStyle: {
    fontForStyle(...args) {
      assertRuntimeActive('inputElements.fontForStyle')
      return nativeStyle.fontForStyle(...args)
    },
    setSizeConstraint(...args) {
      assertRuntimeActive('inputElements.setSizeConstraint')
      return nativeStyle.setSizeConstraint(...args)
    },
  },
  actions: {
    invokeAction(...args) {
      assertRuntimeActive('inputElements.invokeAction')
      return actions.invokeAction(...args)
    },
    idForView(...args) {
      assertRuntimeActive('inputElements.idForView')
      return actions.idForView(...args)
    },
    setControlAction(...args) {
      assertRuntimeActive('inputElements.setControlAction')
      return actions.setControlAction(...args)
    },
    setTextSubmitAction(...args) {
      assertRuntimeActive('inputElements.setTextSubmitAction')
      return actions.setTextSubmitAction(...args)
    },
  },
  cssCascade: {
    setNodeInlineStyle(...args) {
      assertRuntimeActive('inputElements.setNodeInlineStyle')
      return cssCascade.setNodeInlineStyle(...args)
    },
    applyClassName(...args) {
      assertRuntimeActive('inputElements.applyClassName')
      return cssCascade.applyClassName(...args)
    },
  },
  accessibility: {
    applyAccessibility(...args) {
      assertRuntimeActive('inputElements.applyAccessibility')
      return accessibility.applyAccessibility(...args)
    },
  },
})

const actions = createActions({
  store: actionStore,
  registry,
  textElements: {
    textLinkCharacterIndex(...args) {
      assertRuntimeActive('actions.textLinkCharacterIndex')
      return textElements.textLinkCharacterIndex(...args)
    },
    primaryClickBoundary(...args) {
      assertRuntimeActive('actions.primaryClickBoundary')
      return textElements.primaryClickBoundary(...args)
    },
  },
  cssPseudoState: {
    syncPseudoState(...args) {
      assertRuntimeActive('actions.syncPseudoState')
      return cssPseudoState.syncPseudoState(...args)
    },
  },
  syncViewAccessibility(view) {
    accessibleHost.syncNativeAccessibility(view)
  },
  inputElements,
})

const accessibleHost = createAccessibleHost({
  state: accessibilityState,
  actions,
  subscriptions: {
    fileDropRegistry: {
      operation(...args) {
        assertRuntimeActive('file-drop operation')
        return subscriptions.fileDropRegistry.operation(...args)
      },
      perform(...args) {
        assertRuntimeActive('file-drop delivery')
        return subscriptions.fileDropRegistry.perform(...args)
      },
    },
  },
})

const subscriptions = createSubscriptions({
  registry,
  accessibleHost,
})

const accessibility = createAccessibility({
  state: accessibilityState,
  accessibleHost,
})

const textElements = createTextElements({
  nativeStyle: {
    setSizeConstraint(...args) {
      assertRuntimeActive('textElements.setSizeConstraint')
      return nativeStyle.setSizeConstraint(...args)
    },
    fontForStyle(...args) {
      assertRuntimeActive('textElements.fontForStyle')
      return nativeStyle.fontForStyle(...args)
    },
    syncNodeFont(...args) {
      assertRuntimeActive('textElements.syncNodeFont')
      return nativeStyle.syncNodeFont(...args)
    },
  },
  cssCascade: {
    warnUnsupportedCssProp(...args) {
      assertRuntimeActive('textElements.warnUnsupportedCssProp')
      return cssCascade.warnUnsupportedCssProp(...args)
    },
    setNodeInlineStyle(...args) {
      assertRuntimeActive('textElements.setNodeInlineStyle')
      return cssCascade.setNodeInlineStyle(...args)
    },
    applyClassName(...args) {
      assertRuntimeActive('textElements.applyClassName')
      return cssCascade.applyClassName(...args)
    },
  },
  inputElements,
  layout,
  registry,
  actions,
  accessibility,
  tree: {
    detach(...args) {
      assertRuntimeActive('textElements.detach')
      return tree.detach(...args)
    },
  },
})

const controls = createControls({
  actions,
  cssCascade: {
    setNodeInlineStyle(...args) {
      assertRuntimeActive('controls.setNodeInlineStyle')
      return cssCascade.setNodeInlineStyle(...args)
    },
    applyClassName(...args) {
      assertRuntimeActive('controls.applyClassName')
      return cssCascade.applyClassName(...args)
    },
  },
  accessibility,
})

const nativeStyle = createNativeStyle({
  boxPaint,
  textElements,
  inputElements,
  registry,
  layout,
  cssCascade: {
    warnUnsupportedCssProp(...args) {
      assertRuntimeActive('nativeStyle.warnUnsupportedCssProp')
      return cssCascade.warnUnsupportedCssProp(...args)
    },
  },
  accessibleHost,
  pointerStyle,
})

const cssAnimations = createCssAnimations({
  nativeStyle,
})

const cssCascade = createCssCascade({
  cssAnimations,
  hostBridge,
  layout,
  directory,
  nativeStyle,
  controls,
  textElements,
  inputElements,
})

const cssPseudoState = createCssPseudoState({
  hover,
  cssCascade,
  registry,
  subscriptions,
  directory,
})

const projection = createProjection({
  nativeStyle,
  layout,
  cssCascade,
  registry,
  tree: {
    detach(...args) {
      assertRuntimeActive('projection.detach')
      return tree.detach(...args)
    },
  },
})

const tree = createTree({
  cssAnimations,
  cssCascade,
  projection,
  nativeStyle,
  layout,
  textElements,
  pickerElements: {
    syncSegmentedBar(...args) {
      assertRuntimeActive('tree.syncSegmentedBar')
      return pickerElements.syncSegmentedBar(...args)
    },
  },
  registry,
})

const pickerElements = createPickerElements({
  actions,
  layout,
  cssCascade,
  accessibility,
  tree,
})

const containerElements = createContainerElements({
  registry,
  layout,
  textElements,
  directory,
  cssCascade,
  actions,
  accessibility,
  tree,
})

const imageElements = createImageElements({
  accessibleHost,
  cssCascade,
  subscriptions,
})

const elementProps = createElementProps({
  actions,
  textElements,
  cssCascade,
  layout,
  subscriptions,
  accessibleHost,
  accessibility,
})

const nodes = createNodes({
  boxPaint,
  cssAnimations,
  registry,
  tree,
  cssCascade,
  elementProps,
  cssPseudoState,
  subscriptions,
  layout,
  accessibility,
})

const driver = createDriver({
  registry,
  nodes,
  tree,
  projection,
  elementProps,
  cssCascade,
  cssPseudoState,
  layout,
})

const rootLifecycle = createRoots({
  directory: rootDirectory.writer,
  driver,
})

const roots = { ...rootLifecycle, createMacOSRoot }

const popover = createPopover({
  roots,
  directory,
})

const contextMenu = createContextMenu({
  actions,
})

const appMenu = createAppMenu({
  actions,
})

const pickerBridge = createPickerBridge({
  actions,
  pickerElements,
})

const sheetBridge = createSheetBridge({
  popover,
})

const styleEnvironment = createStyleEnvironment({
  cssPseudoState,
  cssCascade,
  directory,
})

const measurements = createMeasurements({
  textElements,
  boxPaint,
  directory,
})

const automation = createAutomation({
  accessibilityState,
  directory,
  measurements,
  cssCascade,
  actions,
  hover,
  popover,
})

const elementAdapters = createElementAdapters({
  registry,
  controls,
  containers: containerElements,
  actions,
  layout,
  textElements,
  inputElements,
  pickerElements,
  cssCascade,
  projection,
  accessibility,
  imageElements,
  roots,
  nativeStyle,
  subscriptions,
  nodes,
  tree,
})

function initializeRuntime() {
  configureTabContentRoots(
    (host, fontFamily) => roots.createMacOSRoot(host, { fontFamily }),
    nativeColor,
  )

  installCompat({
    registerElementType: elementAdapters.registerElementType,
    applyStyle: cssCascade.setNodeInlineStyle,
    applyClassName: cssCascade.applyClassName,
    applyAccessibility: accessibility.applyAccessibility,
    queueLayoutReconcile: layout.queueLayoutReconcile,
  })

  // Every service is constructed before registration, so Mason can subclass
  // the accessible host and adapters can call across subsystem boundaries.
  installMasonElement({
    registerElementType: elementAdapters.registerElementType,
    layoutView: layout.layoutView,
    pinLayoutChild: layout.pinLayoutChild,
    queueLayoutReconcile: layout.queueLayoutReconcile,
    detach: tree.detach,
    applyStyle: cssCascade.setNodeInlineStyle,
    applyClassName: cssCascade.applyClassName,
    applyAccessibility: accessibility.applyAccessibility,
    setAction: actions.setAction,
    setPanAction: actions.setPanAction,
    makeScrollView: controls.makeScrollView,
    baseView: accessibleHost.AccessibleHostView,
    disposeActions: actions.disposeActions,
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

  hostBridge.appKitBridge.gestureSurface = appKitGestureSurface
  hostBridge.appKitBridge.observeGestureActivation = (
    view: object,
    notify: (
      source: 'pointer' | 'keyboard' | 'accessibility' | 'virtual',
      kind?: 'double' | 'long',
    ) => void,
  ) => {
    const primary = actionStore.observeActivation(view, notify)
    const secondary = observeSecondaryActivation(view, (kind) => notify('pointer', kind))

    return () => {
      try {
        secondary()
      } finally {
        primary()
      }
    }
  }

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
        roots.createMacOSRoot(view, { fontFamily: directory.fontFamilyForView(anchor) }),
      fittingSize: popover.popupFittingSize,
    })

  hostBridge.appKitBridge.attachContextMenu = contextMenu.attachContextMenu

  hostBridge.appKitBridge.installApplicationMenu = appMenu.installApplicationMenu

  hostBridge.appKitBridge.attachPicker = pickerBridge.attachPicker

  hostBridge.appKitBridge.attachDatePicker = pickerBridge.attachDatePicker

  hostBridge.appKitBridge.presentSheet = sheetBridge.presentSheet

  installPresentationBridge(
    hostBridge.appKitBridge,
    roots.createMacOSRoot,
    directory.fontFamilyForView,
  )

  styleEnvironment.activate()
  try {
    automation.activate()
  } catch (error) {
    console.error('[macos-runtime] optional diagnostics unavailable', error)
  }
}

activateRuntime(initializeRuntime)

export function createMacOSRoot(...args: Parameters<typeof rootLifecycle.createMacOSRoot>) {
  assertRuntimeActive('root creation')
  return rootLifecycle.createMacOSRoot(...args)
}

export const { observeLayoutCommits } = directory
export const { setLayoutProjectionScale } = layoutProjection
export type { MacOSRootOptions } from './roots'
