import {
  observeLayoutCommits as subscribeLayoutCommits,
  type LayoutCommit,
} from './layout-observers'
import { setProjectionScale, type ProjectionScale } from './projection-paint'
import type { NSView } from '@octane-xplat/platform/macos'
import type { UniversalRoot } from 'octane/universal/native'
import type { RootContainer } from './model'
import { createUniversalRoot } from 'octane/universal/native'

import type { createRegistry } from './registry'
import type { createBorderPaint } from './border-paint'
import type { createShadowPaint } from './shadow-paint'
import type { createDriver } from './driver'
import type { createStyleEnvironment } from './style-environment'
import type { createAutomation } from './automation'

export interface MacOSRootOptions {
  /** Default font family for this root and its renderer-hosted overlays. */
  fontFamily?: string
}

interface Dependencies {
  registry: Pick<ReturnType<typeof createRegistry>, 'cssNodesByView'>
  borderPaint: Pick<ReturnType<typeof createBorderPaint>, 'syncBorderBox'>
  shadowPaint: Pick<ReturnType<typeof createShadowPaint>, 'syncBoxShadow'>
  driver: Pick<ReturnType<typeof createDriver>, 'macOSDriver'>
  styleEnvironment: Pick<
    ReturnType<typeof createStyleEnvironment>,
    'installResizeObserver' | 'installAccessibilityDisplayObserver' | 'seedContainerMedia'
  >
  automation: Pick<ReturnType<typeof createAutomation>, 'installAutomation'>
}

export function createRoots(deps: Dependencies) {
  /** Observe renderer layout batches and visit existing roots immediately. Returns an unsubscribe function. */
  function observeLayoutCommits(observer: (commit: LayoutCommit) => void): () => void {
    const stop = subscribeLayoutCommits(observer)
    for (const container of appKitContainers) {
      observer({ hostView: container.hostView })
    }
    return stop
  }

  /** Temporary paint compensation without changing authored styles or layout.
   * Pass null to restore. Scalar radii/blur are exact only under uniform scale. */
  function setLayoutProjectionScale(view: object, scale: ProjectionScale | null): void {
    const node = deps.registry.cssNodesByView.get(view)
    if (!node) {
      return
    }
    const transaction = (globalThis as any).CATransaction
    transaction.begin()
    try {
      transaction.setDisableActions(true)
      setProjectionScale(view, scale)
      deps.borderPaint.syncBorderBox(node)
      deps.shadowPaint.syncBoxShadow(node)
    } finally {
      transaction.commit()
    }
  }

  const ownedRoots = new WeakMap<NSView, UniversalRoot>()

  const rootFontFamilies = new WeakMap<object, string | undefined>()

  function fontFamilyForView(view: NSView | undefined): string | undefined {
    for (let current: NSView | null | undefined = view; current; current = current.superview) {
      if (rootFontFamilies.has(current)) {
        return rootFontFamilies.get(current)
      }
    }

    return undefined
  }

  // AppKit renders into several roots — the main window plus tab panes, popup
  // surfaces, and route content hosts each own a container, and every
  // createMacOSRoot call rebinds the __xplatMacOSDebug seam. Debug lookups must
  // search every live container or automation silently misses nodes mounted
  // outside whichever root was created last.
  const appKitContainers = new Set<RootContainer>()

  function createMacOSRoot(hostView: NSView, { fontFamily }: MacOSRootOptions = {}) {
    rootFontFamilies.set(hostView, fontFamily)
    const container: RootContainer = {
      hostView,
      fontFamily,
      nodes: new Map(),
      children: [],
      root: null,
      portalTargetIds: new WeakMap(),
      portalTargets: new Map(),
      nextPortalTargetId: 1,
      layoutDirty: null,
    }

    const root = createUniversalRoot(container, deps.driver.macOSDriver, {
      scheduleMicrotask: (callback) => queueMicrotask(callback),
      onUncaughtError: (error: any) =>
        console.error(
          '[macos-runtime] uncaught render error name=' +
            (error && error.name) +
            ' message=' +
            (error && error.message) +
            ' value=' +
            (typeof error === 'object' ? JSON.stringify(error) : String(error)) +
            ' stack=' +
            (error && error.stack),
        ),
    })

    container.root = root
    ownedRoots.set(hostView, root)
    appKitContainers.add(container)
    deps.styleEnvironment.installResizeObserver()
    deps.styleEnvironment.installAccessibilityDisplayObserver()
    // Seed this container's per-window media environments so the first resize
    // diffs against a baseline instead of an empty cache.
    deps.styleEnvironment.seedContainerMedia(container)
    const unmount = root.unmount.bind(root)
    root.unmount = () => {
      appKitContainers.delete(container)
      if (ownedRoots.get(hostView) === root) {
        ownedRoots.delete(hostView)
      }

      unmount()
    }

    deps.automation.installAutomation(root, container)

    return root
  }
  return {
    observeLayoutCommits,
    setLayoutProjectionScale,
    ownedRoots,
    fontFamilyForView,
    appKitContainers,
    createMacOSRoot,
  }
}
