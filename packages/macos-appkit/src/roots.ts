import type { BoxPaint } from './box-paint'
import type { Registry } from './registry'
import type { Driver } from './driver'
import type { StyleEnvironment } from './style-environment'
import type { Automation } from './automation'
import { observeLayoutCommits as subscribeLayoutCommits } from './layout-observers'
import type { LayoutCommit } from './layout-observers'
import { setProjectionScale } from './projection-paint'
import type { ProjectionScale } from './projection-paint'
import type { NSView } from '@octane-xplat/platform/macos'
import { createUniversalRoot } from 'octane/universal/native'
import type { UniversalRoot } from 'octane/universal/native'
import type { RootContainer } from './model'

export interface MacOSRootOptions {
  /** Default font family for this root and its renderer-hosted overlays. */
  fontFamily?: string
}

interface Dependencies {
  boxPaint: Pick<BoxPaint, 'syncProjection'>
  registry: Pick<Registry, 'cssNodesByView'>
  driver: Pick<Driver, 'macOSDriver'>
  styleEnvironment: Pick<
    StyleEnvironment,
    'installResizeObserver' | 'installAccessibilityDisplayObserver' | 'seedContainerMedia'
  >
  automation: Pick<Automation, 'installAutomation'>
}

export type Roots = ReturnType<typeof createRoots>

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
      deps.boxPaint.syncProjection(node)
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
