import type { RootDirectoryWriter } from './root-directory'
import type { Driver } from './driver'
import type { NSView } from '@octane-xplat/platform/macos'
import { createUniversalRoot } from 'octane/universal/native'
import type { RootContainer } from './model'
import { FailureCollector } from './failures'

export interface MacOSRootOptions {
  /** Default font family for this root and its renderer-hosted overlays. */
  fontFamily?: string
}

interface Dependencies {
  directory: RootDirectoryWriter
  driver: Pick<Driver, 'macOSDriver'>
}

export type Roots = ReturnType<typeof createRoots>

export function createRoots(deps: Dependencies) {
  function createMacOSRoot(hostView: NSView, { fontFamily }: MacOSRootOptions = {}) {
    if (deps.directory.rootForHost(hostView)) {
      throw new Error('AppKit host already has a live root')
    }

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

    const unmount = root.unmount.bind(root)
    let retired = false
    let retireMembership: (() => void) | undefined

    root.unmount = () => {
      if (retired) {
        return
      }

      retired = true

      const failures = new FailureCollector()

      failures.run('root membership', () => retireMembership?.())
      failures.run('root unmount', unmount)
      container.root = null
      failures.throwIfFailed()
    }

    try {
      retireMembership = deps.directory.register(container)
      if (retired) {
        retireMembership()
        throw new Error('AppKit root retired during setup')
      }
    } catch (error) {
      const failures = new FailureCollector()

      failures.run('root setup', () => {
        throw error
      })

      failures.run('root setup unwind', root.unmount)
      failures.throwIfFailed()
    }

    return root
  }

  return {
    createMacOSRoot,
    unmountOwnedRoot(host: NSView) {
      deps.directory.rootForHost(host)?.unmount()
    },
  }
}
