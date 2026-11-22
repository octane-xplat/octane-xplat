import { GridLayout, Utils } from '@nativescript/core'
import {
  createNativeScriptRoot,
  type NativeScriptPortalHost,
} from '@octane-xplat/nativescript-octane'
import {
  NSNotificationCenter,
  NSView,
  NSViewFrameDidChangeNotification,
  NSWindowDidResizeNotification,
} from '@octane-xplat/platform/macos'
import type { UniversalRoot } from 'octane/universal/native'
import { FailureCollector } from './failures'
import { installWindowRootFactory } from './host-windowing'
import { installNativeScriptAutomation } from './nativescript-automation.macos'
import { installNativeScriptStylesheetDelivery } from './nativescript-css.macos'
import {
  installNativeScriptHostServices,
  installNativeScriptWindowServices,
} from './nativescript-host-services'
import {
  measureNativeScriptContent,
  nativeScriptFontFamilyForView,
  trackNativeScriptRoot,
} from './nativescript-roots.macos'
import type { MacOSRootOptions } from './runtime'

/** Host Core layout in an AppKit view, including independently sized portal content. */
function mountNativeScriptContent(content: NSView, fontFamily?: string) {
  const host = new GridLayout()
  if (fontFamily) {
    host.style.fontFamily = fontFamily
  }
  host._setupAsRootView({})
  const native = host.nativeViewProtected
  if (!(native instanceof NSView)) {
    host._tearDownUI(true)
    throw new Error('NativeScript could not create an AppKit window content view')
  }

  const releaseHost = (failures: FailureCollector) => {
    failures.run('window content unload', () => host.callUnloaded())
    failures.run('window content teardown', () => host._tearDownUI(true))
    failures.run('window content detach', () => native.removeFromSuperview())
  }
  try {
    content.addSubview(native)
    host.callLoaded()
  } catch (error) {
    const failures = new FailureCollector()
    failures.run('window content setup', () => {
      throw error
    })
    releaseHost(failures)
    failures.throwIfFailed()
    throw error
  }
  const layout = () => {
    const width = Utils.layout.toDevicePixels(content.bounds.size.width)
    const height = Utils.layout.toDevicePixels(content.bounds.size.height)
    const exact = Utils.layout.EXACTLY
    host.measure(
      Utils.layout.makeMeasureSpec(width, exact),
      Utils.layout.makeMeasureSpec(height, exact),
    )
    host.layout(0, 0, width, height)
  }
  let mounted = true
  let resizePending = false
  const resized = () => {
    if (resizePending) {
      return
    }
    resizePending = true
    queueMicrotask(() => {
      resizePending = false
      if (mounted) {
        host._onCssStateChange()
        layout()
      }
    })
  }
  const center = NSNotificationCenter.defaultCenter
  content.postsFrameChangedNotifications = true
  const frameObserver = center.addObserverForNameObjectQueueUsingBlock(
    NSViewFrameDidChangeNotification,
    content,
    null,
    resized,
  )
  const windowObserver = center.addObserverForNameObjectQueueUsingBlock(
    NSWindowDidResizeNotification,
    null,
    null,
    ({ object }) => {
      if (object === content.window) {
        resized()
      }
    },
  )
  const untrackRoot = trackNativeScriptRoot(host, content)
  return {
    host,
    layout,
    dispose() {
      if (!mounted) {
        return
      }
      mounted = false
      const failures = new FailureCollector()
      failures.run('content frame observation', () => center.removeObserver(frameObserver))
      failures.run('window resize observation', () => center.removeObserver(windowObserver))
      failures.run('window root tracking unsubscribe', untrackRoot)
      releaseHost(failures)
      failures.throwIfFailed()
    },
  }
}

const portalHosts = new WeakSet<NSView>()

function resolveAppKitPortalHost(target: object): NativeScriptPortalHost | undefined {
  if (!(target instanceof NSView)) {
    return
  }
  if (portalHosts.has(target)) {
    throw new Error('AppKit portal target already belongs to another Core root')
  }
  const mounted = mountNativeScriptContent(target, nativeScriptFontFamilyForView(target))
  portalHosts.add(target)
  try {
    mounted.layout()
  } catch (error) {
    portalHosts.delete(target)
    mounted.dispose()
    throw error
  }
  return {
    view: mounted.host,
    release() {
      portalHosts.delete(target)
      mounted.dispose()
    },
  }
}

/** Mount a Core root in the AppKit content view that owns its size and lifetime. */
export function createNativeScriptWindowRoot(
  content: NSView,
  options?: MacOSRootOptions,
): UniversalRoot {
  installNativeScriptHostServices()
  installNativeScriptWindowRoots()
  installNativeScriptStylesheetDelivery()
  const mounted = mountNativeScriptContent(content, options?.fontFamily)
  let root: UniversalRoot
  try {
    root = createNativeScriptRoot(mounted.host, resolveAppKitPortalHost)
    installNativeScriptAutomation(root)
  } catch (error) {
    const failures = new FailureCollector()
    failures.run('Core root setup', () => {
      throw error
    })
    failures.run('window content release', mounted.dispose)
    failures.throwIfFailed()
    throw error
  }
  const render = root.render.bind(root)
  root.render = (...args) => {
    const result = render(...args)
    mounted.layout()
    return result
  }
  const unmount = root.unmount.bind(root)
  let unmounted = false
  root.unmount = () => {
    if (unmounted) {
      return
    }
    unmounted = true
    const failures = new FailureCollector()
    failures.run('window root unmount', unmount)
    failures.run('window content release', mounted.dispose)
    failures.throwIfFailed()
  }
  return root
}

/** Give Core-hosted apps the existing AppKit secondary-window lifecycle. */
export function installNativeScriptWindowRoots() {
  installWindowRootFactory(createNativeScriptWindowRoot)
  installNativeScriptWindowServices({
    roots: { createMacOSRoot: createNativeScriptWindowRoot },
    measureContent: measureNativeScriptContent,
    directory: { fontFamilyForView: nativeScriptFontFamilyForView },
  })
}
