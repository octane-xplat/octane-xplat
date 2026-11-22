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

const mountedContents = new WeakSet<NSView>()

/** Host Core layout in an AppKit view, including independently sized portal content. */
function mountNativeScriptContent(content: NSView, fontFamily?: string) {
  if (mountedContents.has(content)) {
    throw new Error('AppKit content view already hosts a Core root')
  }
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
  const releaseObservers: { name: string; release: () => void }[] = []
  const releaseHost = (failures: FailureCollector) => {
    mounted = false
    for (const { name, release } of releaseObservers) {
      failures.run(name, release)
    }
    failures.run('window content unload', () => host.callUnloaded())
    failures.run('window content teardown', () => host._tearDownUI(true))
    failures.run('window content detach', () => native.removeFromSuperview())
    mountedContents.delete(content)
  }

  mountedContents.add(content)
  try {
    content.addSubview(native)
    host.callLoaded()
    const center = NSNotificationCenter.defaultCenter
    content.postsFrameChangedNotifications = true
    const frameObserver = center.addObserverForNameObjectQueueUsingBlock(
      NSViewFrameDidChangeNotification,
      content,
      null,
      resized,
    )
    releaseObservers.push({
      name: 'content frame observation',
      release: () => center.removeObserver(frameObserver),
    })
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
    releaseObservers.push({
      name: 'window resize observation',
      release: () => center.removeObserver(windowObserver),
    })
    releaseObservers.push({
      name: 'window root tracking unsubscribe',
      release: trackNativeScriptRoot(host, content),
    })
  } catch (error) {
    const failures = new FailureCollector()
    failures.run('window content setup', () => {
      throw error
    })
    releaseHost(failures)
    failures.throwIfFailed()
    throw error
  }
  return {
    host,
    layout,
    dispose() {
      if (!mounted) {
        return
      }
      const failures = new FailureCollector()
      releaseHost(failures)
      failures.throwIfFailed()
    },
  }
}

function resolveAppKitPortalHost(target: object): NativeScriptPortalHost | undefined {
  if (!(target instanceof NSView)) {
    return
  }
  const mounted = mountNativeScriptContent(target, nativeScriptFontFamilyForView(target))
  try {
    mounted.layout()
  } catch (error) {
    mounted.dispose()
    throw error
  }
  return {
    view: mounted.host,
    release: mounted.dispose,
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
