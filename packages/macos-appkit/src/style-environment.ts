import type { CssPseudoState } from './css-pseudo-state'
import type { CssCascade } from './css-cascade'
import type { RootDirectoryReader } from './root-directory'
import type { RootContainer } from './model'
import {
  evalMediaQuery,
  stylesheetMediaQueries,
  stylesheetsHaveMediaRules,
} from '@octane-xplat/css-engine'

import {
  NSNotification,
  NSNotificationCenter,
  NSOperationQueue,
  NSWindowDidResizeNotification,
  NSWorkspace,
  NSWorkspaceAccessibilityDisplayOptionsDidChangeNotification,
} from '@octane-xplat/platform/macos'

interface Dependencies {
  cssPseudoState: Pick<CssPseudoState, 'syncContainerPseudoState'>
  cssCascade: Pick<
    CssCascade,
    'markStyleDirty' | 'flushStyleDirty' | 'windowMediaSize' | 'mediaSharedEnv'
  >
  directory: Pick<RootDirectoryReader, 'containers' | 'observe'>
}

export type StyleEnvironment = ReturnType<typeof createStyleEnvironment>

export function createStyleEnvironment(deps: Dependencies) {
  // Stylesheet and appearance changes restyle every live container.
  function restyleContainer(container: RootContainer) {
    deps.cssPseudoState.syncContainerPseudoState(container)
    for (const child of container.children) {
      deps.cssCascade.markStyleDirty(child, true)
    }

    for (const entry of container.portalTargets.values()) {
      deps.cssCascade.markStyleDirty(entry.root, true)
    }

    deps.cssCascade.flushStyleDirty(container)
  }

  function restyleAllContainers() {
    for (const container of deps.directory.containers()) {
      restyleContainer(container)
    }
  }

  // ---- Media queries on resize ------------------------------------------------
  // Media results are per window: a resize diffs every registered media-gated
  // query under that window's recorded and current size, then restyles only the
  // containers painting into it. container.mediaEnvs records the last observed
  // size per window; membership observation seeds it so the first resize can diff —
  // an unseeded window restyles unconditionally when any media rule exists.
  function containerWindowTargets(container: RootContainer): object[] {
    const windows: object[] = []

    if (container.hostView?.window) {
      windows.push(container.hostView.window)
    }

    for (const entry of container.portalTargets.values()) {
      const win = entry.root.view?.window

      if (win && !windows.includes(win)) {
        windows.push(win)
      }
    }

    return windows
  }

  function refreshWindowMedia(container: RootContainer, win: object): boolean {
    if (!stylesheetsHaveMediaRules()) {
      return false
    }

    const envs = (container.mediaEnvs ??= new Map())
    const next = deps.cssCascade.windowMediaSize(win, container.hostView?.frame)
    const prev = envs.get(win)

    envs.set(win, next)
    if (!prev) {
      return true
    }

    const shared = deps.cssCascade.mediaSharedEnv()
    const before = { ...prev, ...shared }
    const after = { ...next, ...shared }

    return stylesheetMediaQueries().some(
      (q) => evalMediaQuery(q, before) !== evalMediaQuery(q, after),
    )
  }

  function seedContainerMedia(container: RootContainer) {
    for (const win of containerWindowTargets(container)) {
      ;(container.mediaEnvs ??= new Map()).set(
        win,
        deps.cssCascade.windowMediaSize(win, container.hostView?.frame),
      )
    }
  }

  let resizeQueued = false

  function onHostWindowResize(win?: object | null) {
    if (resizeQueued) {
      return
    }

    resizeQueued = true
    queueMicrotask(() => {
      resizeQueued = false
      for (const container of deps.directory.containers()) {
        if (win != null) {
          if (
            containerWindowTargets(container).includes(win) &&
            refreshWindowMedia(container, win)
          ) {
            restyleContainer(container)
          }
        } else if (stylesheetsHaveMediaRules()) {
          // Non-size environment change (e.g. reduced motion) — shared
          // fields aren't window-scoped, so restyle unconditionally.
          restyleContainer(container)
        }
      }
    })
  }

  let resizeObserverInstalled = false

  function installResizeObserver() {
    if (resizeObserverInstalled || typeof NSNotificationCenter === 'undefined') {
      return
    }

    const center = NSNotificationCenter.defaultCenter

    if (!center || typeof center.addObserverForNameObjectQueueUsingBlock !== 'function') {
      return
    }

    center.addObserverForNameObjectQueueUsingBlock(
      NSWindowDidResizeNotification ?? 'NSWindowDidResizeNotification',
      null,
      null,
      (notification: NSNotification) => {
        for (const container of deps.directory.containers()) {
          if (containerWindowTargets(container).includes(notification?.object)) {
            onHostWindowResize(notification?.object)
            return
          }
        }
      },
    )

    resizeObserverInstalled = true
  }

  // Accessibility display notifications use the workspace's center, not defaultCenter.
  // Like the resize observer, one token belongs to the loaded renderer process.
  let accessibilityDisplayObserver: unknown

  function installAccessibilityDisplayObserver() {
    if (accessibilityDisplayObserver !== undefined) {
      return
    }

    try {
      const workspace = NSWorkspace.sharedWorkspace,
        center = workspace?.notificationCenter

      if (typeof center?.addObserverForNameObjectQueueUsingBlock !== 'function') {
        return
      }

      const observer = center.addObserverForNameObjectQueueUsingBlock(
        NSWorkspaceAccessibilityDisplayOptionsDidChangeNotification,
        workspace,
        NSOperationQueue.mainQueue,
        () => {
          if (deps.directory.containers().length) {
            onHostWindowResize()
          }
        },
      )

      if (observer != null) {
        accessibilityDisplayObserver = observer
      }
    } catch (error) {
      console.warn('[macos-css] accessibility display observer unavailable', error)
    }
  }

  let activated = false
  function activate() {
    if (activated) {
      return
    }

    installResizeObserver()
    installAccessibilityDisplayObserver()
    deps.directory.observe(seedContainerMedia)
    activated = true
  }

  return {
    activate,
    restyleAllContainers,
  }
}
