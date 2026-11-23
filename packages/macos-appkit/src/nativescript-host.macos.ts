import { GridLayout } from '@nativescript/core'
import { createNativeScriptRoot } from '@octane-xplat/nativescript-octane'
import { startNativeScriptApplication } from '../platforms/nativescript/core/application/application.macos.js'
import { runWindowedApp, type MacOSAppMount, type MacOSAppOptions } from './host-runner'
import { installNativeScriptAutomation } from './nativescript-automation.macos'
import { appKitHostBoundary } from './nativescript-host-boundary.macos'
import { installNativeScriptWindowRoots, resolveAppKitPortalHost } from './nativescript-window.macos'

export * from './host-window-exports'

/** Start the AppKit host with a NativeScript Core root. */
export function runMacOSApp(
  options: MacOSAppOptions,
  mount: (target: MacOSAppMount) => void | (() => void),
): void {
  runWindowedApp(options, mount, (createWindow) => {
    installNativeScriptWindowRoots()
    const host = new GridLayout()
    if (options.rootOptions?.fontFamily) {
      host.style.fontFamily = options.rootOptions.fontFamily
    }
    const appKit = startNativeScriptApplication(() => host, createWindow)
    const root = createNativeScriptRoot(host, resolveAppKitPortalHost, appKitHostBoundary)
    installNativeScriptAutomation(root)
    return { appKit, root }
  })
}
