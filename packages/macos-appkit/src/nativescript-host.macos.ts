import { GridLayout } from '@nativescript/core'
import { createNativeScriptRoot } from '@octane-xplat/nativescript-octane'
import { startNativeScriptApplication } from '../platforms/nativescript/core/application/application.macos.js'
import { runWindowedApp, type MacOSAppMount, type MacOSAppOptions } from './host-runner'
import { installNativeScriptWindowRoots } from './nativescript-window.macos'

/** Start the AppKit host with a NativeScript Core root. */
export function runNativeScriptMacOSApp(
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
    return { appKit, root: createNativeScriptRoot(host) }
  })
}
