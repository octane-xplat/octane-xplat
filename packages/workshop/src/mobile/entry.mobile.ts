import { Application, ContentView, Frame, Page, View } from '@nativescript/core'

import type { CatalogEntry } from '../catalog'
import type { WorkshopTarget } from '../contract'
import { NativeWorkshopController } from '../native/controller'
import { NativeWorkshopChrome } from '../native/chrome.tsrx'
import { createMobileStageHost } from './mount.mobile'
import { installDismissal } from './dismissal'
import { createNativeScriptRoot, type UniversalComponent } from '@octane-xplat/nativescript-octane'

/** Options for mounting the mobile workshop. */
export interface MobileWorkshopOptions {
  /** Discovered story catalog. */
  catalog: readonly CatalogEntry[]
  /** Config/catalog diagnostics. */
  diagnostics?: readonly { message: string }[]
  /** Render target. */
  target: 'ios' | 'android'
  /** Story to open on load. */
  initialStoryId?: string | null
  /** Providers wrapping every story. */
  globalProviders?: readonly unknown[]
}

/** Handle for a running mobile workshop. */
export interface MobileWorkshopRuntime {
  /** The workshop controller. */
  controller: NativeWorkshopController
  /** Host page/screen. */
  page: Page
  /** Tear down the workshop — disposes the controller and detaches the stage; idempotent. */
  dispose(): Promise<void>
}

let runtime: MobileWorkshopRuntime | undefined

/** Notifies the runtime that the story catalog changed. */
export function catalogDidUpdate(
  catalog: readonly CatalogEntry[],
  diagnostics: readonly { message: string }[] = [],
): void {
  runtime?.controller.updateCatalog(catalog, diagnostics)
}

/** A host-native shell. Its stage MasonView is attached once for its lifetime. */
export function startWorkshop(options: MobileWorkshopOptions): MobileWorkshopRuntime {
  const actual: WorkshopTarget = Application.android ? 'android' : 'ios'

  if (actual !== options.target) {
    throw new Error(`Workshop target ${options.target} does not match host ${actual}`)
  }

  if (runtime) {
    throw new Error('Dispose the existing workshop before starting another')
  }

  const page = new Page()

  page.actionBarHidden = true
  page.iosOverflowSafeArea = false

  let stage: View | undefined
  const controller = new NativeWorkshopController({
    host: {
      mount(request) {
        // The stage slot's native view arrives through chrome's ref; the
        // host binds the session stage lazily on first mount.
        if (!stage) {
          throw new Error('Workshop stage slot has not been attached')
        }

        return createMobileStageHost(stage as any).mount(request)
      },
    },
    target: actual,
    catalog: options.catalog,
    globalProviders: options.globalProviders,
  })

  const host = new ContentView()

  page.content = host

  const root = createNativeScriptRoot(host)

  root.render(NativeWorkshopChrome as unknown as UniversalComponent, {
    controller,
    target: actual,
    onStage(view: unknown) {
      stage = view as View
    },
    focus(view: unknown) {
      ;(view as View | null)?.focus?.()
    },
  })

  let disposed = false

  /** Host keys may dismiss shell chrome only while this page owns the host. */
  function dismissAllowed(): boolean {
    return Frame.topmost()?.currentPage === page && !page.modal
  }

  /** One Back/Escape step; false leaves the key to the host/story. */
  function tryDismiss(): boolean {
    const dismissed = controller.dismissOverlay()

    if (!dismissed) {
      return false
    }

    dismissal.sync()
    return true
  }

  function layout(): void {
    const size = page.getActualSize()

    controller.resize(size.width, size.height)
    dismissal.sync()
  }

  // The iOS Escape key command must track every overlay change, not just
  // layout — store updates cover panel/stageOnly transitions too.
  const unsubscribe = controller.store.subscribe(() => dismissal.sync())

  page.on(View.layoutChangedEvent, layout)

  const dismissal = installDismissal({ page, controller, dismissAllowed, tryDismiss })

  const exit = () => {
    void runtime
      ?.dispose()
      .catch((error) => console.error('Workshop cleanup requires restart:', error))
  }

  Application.on(Application.exitEvent, exit)
  runtime = {
    controller,
    page,
    async dispose() {
      if (disposed) {
        return
      }

      disposed = true
      unsubscribe()
      page.off(View.layoutChangedEvent, layout)
      dismissal.release()
      Application.off(Application.exitEvent, exit)
      root.unmount()
      await controller.dispose()
      if (controller.session.state.phase === 'restart-required') {
        throw controller.session.state.failure
      }

      runtime = undefined
    },
  }

  controller.updateCatalog(options.catalog, options.diagnostics ?? [])
  if (!options.initialStoryId && !options.diagnostics?.length) {
    controller.panel = 'stories'
  }

  if (options.initialStoryId) {
    void controller.select(options.initialStoryId)
  }

  return runtime
}
