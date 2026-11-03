import '@nativescript/macos-node-api'
import { createMacOSWebView } from '@octane-xplat/desktop-webview/macos'
import { createAppKitWindow } from './src/appkit'
import { createDesktopWebViewHost, type AppKitHostServices } from './src/desktop-webview-host'

import type {
  PackagedProofEvents,
  PackagedProofResult,
  PackagedProofServices,
} from './src/webview-packaged-proof-contracts'

const hostServices = (globalThis as typeof globalThis & { __xplatAppKit: AppKitHostServices })
  .__xplatAppKit

const appKit = createAppKitWindow({ terminateAfterLastWindowClosed: true })
appKit.window.title = 'Octane packaged WKWebView proof'

const webView = createMacOSWebView(appKit.contentView)

const timed = <T>(operation: () => T) => {
  const started = Date.now()
  const result = operation()
  return { result, ms: Date.now() - started }
}

const desktopHost = createDesktopWebViewHost<PackagedProofServices, PackagedProofEvents>(
  webView,
  hostServices,
  null,
  (sender, emit) => ({
    application: {
      format(value) {
        return `application: ${value}`
      },
      async notify(message) {
        emit('application.notice', { message })
        return true
      },
      // getUserMedia wedges the web content process before the delegate
      // is consulted on this host (sandboxed renderer cannot reach the
      // capture stack), so the real dispatch attempt is opt-in.
      probeGumEnabled() {
        return process.env.XPLAT_PROOF_GUM === '1'
      },
      // Times each UserNotifications call so the proof can distinguish a
      // delivered callback from the 5-second deadline in the native leaf.
      notificationProbe() {
        const before = timed(() => sender.notificationPermission())
        const request = timed(() => sender.requestNotificationPermission())
        const after = timed(() => sender.notificationPermission())
        const notify = timed(() => sender.notify('packaged proof', 'notification probe'))
        return {
          permissionBefore: before.result,
          permissionMs: before.ms,
          requested: request.result,
          requestMs: request.ms,
          permissionAfter: after.result,
          afterMs: after.ms,
          notified: notify.result,
          notifyMs: notify.ms,
        }
      },
      report(result: PackagedProofResult) {
        console.log(
          `${result.ok ? 'XPLAT_PACKAGED_WEBVIEW_PROOF_OK' : 'XPLAT_PACKAGED_WEBVIEW_PROOF_FAILED'} ${JSON.stringify(result)}`,
        )

        return true
      },
    },
  }),
  appKit.window,
)

if (!webView.loadPackaged('index.html')) {
  throw new Error('packaged webview proof could not load its bundled page')
}

void appKit.windowClosed.then(() => {
  desktopHost.dispose()
  appKit.window.delegate = null
  appKit.app.delegate = null
  appKit.delegate = null
})

appKit.app.finishLaunching()
appKit.app.activateIgnoringOtherApps(true)

console.log('[packaged-webview-proof] loaded Contents/Resources/web/index.html')
