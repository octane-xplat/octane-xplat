// Public AppKit application host — `runMacOSApp` owns NSApplication startup,
// the main window, its universal root, and the event loop; the windowing
// functions below it cover secondary windows and non-Octane hosted views.
// Importing this module installs the `__xplatAppKit` platform services,
// `__xplatAppKitOpenWindow`, and `__xplatAppKitMountSheet` globals.
import { createMacOSRoot } from './runtime'
import { runWindowedApp, type MacOSAppMount, type MacOSAppOptions } from './host-runner'
import { installWindowRootFactory } from './host-windowing'

installWindowRootFactory(createMacOSRoot)

export * from './host-window-exports'

/**
 * Create the main window, mount a universal root in its content view, call
 * `mount`, present the window, and run the AppKit event loop. `mount` may
 * return a cleanup function: the host calls it exactly once, synchronously,
 * when the application terminates (`applicationWillTerminate`) or the host
 * stops, before unmounting the roots it owns.
 *
 * @example
 * ```ts
 * import { runMacOSApp } from '@octane-xplat/macos-appkit/host'
 * import App from './App.macos'
 *
 * runMacOSApp({ title: 'Notes' }, ({ root, window }) => {
 *   root.render(App, { parentWindow: window })
 *   return () => console.log('app is closing')
 * })
 * ```
 */
export function runMacOSApp(
  options: MacOSAppOptions,
  mount: (target: MacOSAppMount) => void | (() => void),
): void {
  runWindowedApp(options, mount, (createWindow) => {
    const appKit = createWindow()
    const root = createMacOSRoot(appKit.contentView, options.rootOptions)
    return { appKit, root }
  })
}
