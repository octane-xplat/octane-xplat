import { GridLayout, Utils } from '@nativescript/core'
import { createNativeScriptRoot } from '@octane-xplat/nativescript-octane'
import { NSView } from '@octane-xplat/platform/macos'
import type { UniversalRoot } from 'octane/universal/native'
import { FailureCollector } from './failures'
import { installWindowRootFactory, observeWindowResize } from './host-windowing'

/** Give Core-hosted apps the existing AppKit secondary-window lifecycle. */
export function installNativeScriptWindowRoots() {
  installWindowRootFactory((content) => {
    const window = content.window
    if (!window) {
      throw new Error('NativeScript window content is not attached to an AppKit window')
    }
    const host = new GridLayout()
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
    let root: UniversalRoot
    try {
      content.addSubview(native)
      host.callLoaded()
      root = createNativeScriptRoot(host)
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
    const unobserve = observeWindowResize(window, layout)
    const render = root.render.bind(root)
    root.render = (...args) => {
      const result = render(...args)
      layout()
      return result
    }
    const unmount = root.unmount.bind(root)
    let mounted = true
    root.unmount = () => {
      if (!mounted) {
        return
      }
      mounted = false
      const failures = new FailureCollector()
      failures.run('window resize unsubscribe', unobserve)
      failures.run('window root unmount', unmount)
      releaseHost(failures)
      failures.throwIfFailed()
    }
    return root
  })
}
