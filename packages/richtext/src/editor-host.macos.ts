/** AppKit editor host. Each editor owns one isolated WKWebView document; the
 *  channel is the only boundary — there is no general app/service bridge.
 *  TypeScript port of the removed Swift XplatEditorHost with the identical
 *  contract: nonpersistent data store, main-frame script-message validation,
 *  an about:blank-only navigation policy, escaped evaluateJavaScript delivery,
 *  error reporting, and idempotent teardown.
 *
 *  Member names use the jsified selector spelling so the bridge resolves each
 *  signature from protocol metadata. That is what lets `decisionHandler`
 *  arrive as a callable JS function — a manually declared `id` parameter
 *  marshals WebKit's signature-less block as an opaque CallbackObject and the
 *  navigation policy cannot be answered (probe-verified on the AppKit/JSC
 *  host; see test/verify-wk.mjs). */
import {
  NSAutoresizingMaskOptions,
  NSObject,
  WKNavigationActionPolicy,
  WKNavigationDelegate,
  WKScriptMessageHandler,
  WKWebView,
  WKWebViewConfiguration,
  WKWebsiteDataStore,
} from '@octane-xplat/platform/macos'

import type { NSView } from '@octane-xplat/platform/macos'

interface ChannelState {
  dispatch?: (body: string) => void
}

// The bridge can hand back a different JS wrapper for a native receiver on a
// later callback, so channel state is keyed by the WKWebView argument — a
// native object we created and hold, whose wrapper identity is stable.
const states = new WeakMap<object, ChannelState>()

type Channel = WKScriptMessageHandler & WKNavigationDelegate
let EditorChannel: { alloc(): { init(): Channel } } | undefined

function channelClass(): { alloc(): { init(): Channel } } {
  EditorChannel ??= NSObject.extend(
    {
      userContentControllerDidReceiveScriptMessage(
        _userContentController: unknown,
        message: {
          webView: object
          name: string
          body: unknown
          frameInfo: { isMainFrame(): boolean }
        },
      ): void {
        const state = states.get(message.webView)

        if (!state || !message.frameInfo.isMainFrame() || typeof message.body !== 'string') {
          return
        }

        state.dispatch?.(message.body)
      },

      webViewDecidePolicyForNavigationActionDecisionHandler(
        webView: object,
        action: {
          request?: { URL?: { absoluteString: unknown } | null } | null
        },
        decisionHandler: (policy: number) => void,
      ): void {
        if (!states.has(webView)) {
          decisionHandler(WKNavigationActionPolicy.Cancel)
          return
        }

        const allow = String(action?.request?.URL?.absoluteString ?? '') === 'about:blank'

        decisionHandler(allow ? WKNavigationActionPolicy.Allow : WKNavigationActionPolicy.Cancel)
      },
    },
    {
      name: 'XplatEditorChannel',
      protocols: [WKScriptMessageHandler, WKNavigationDelegate],
    },
  )

  // NativeChannel.extend() returns a class handle whose declared type does not
  // expose alloc/init — bound it once to the channel constructor shape.
  return EditorChannel as unknown as EditorChannelClass
}

interface EditorChannelClass {
  alloc(): { init(): Channel }
}

/** The transport surface the editor session drives. */
export interface EditorNativeHost {
  attachTo(parent: NSView): void
  installDispatcher(dispatch: (packet: string) => void): void
  load(html: string): void
  deliver(packet: string): void
  dispose(): void
}

export function createEditorHost(): EditorNativeHost {
  const channel = channelClass().alloc().init()
  const config = WKWebViewConfiguration.new()

  config.websiteDataStore = WKWebsiteDataStore.nonPersistentDataStore()

  const webView = WKWebView.alloc().initWithFrameConfiguration(
    { origin: { x: 0, y: 0 }, size: { width: 0, height: 0 } },
    config,
  )

  config.userContentController.addScriptMessageHandlerName(channel, 'editor')
  webView.navigationDelegate = channel
  webView.autoresizingMask =
    NSAutoresizingMaskOptions.WidthSizable | NSAutoresizingMaskOptions.HeightSizable

  const state: ChannelState = {}

  states.set(webView, state)

  let disposed = false

  return {
    attachTo(parent) {
      webView.frame = parent.bounds
      parent.addSubview(webView)
    },
    installDispatcher(dispatch) {
      state.dispatch = dispatch
    },
    load(html) {
      if (!disposed) {
        webView.loadHTMLStringBaseURL(html, null)
      }
    },
    deliver(packet) {
      if (disposed) {
        return
      }

      webView.evaluateJavaScriptCompletionHandler(
        `window.__xplatEditorReceive?.(${JSON.stringify(String(packet))})`,
        (_result: unknown, error: { localizedDescription?: unknown } | null) => {
          if (!error) {
            return
          }

          state.dispatch?.(
            JSON.stringify({
              event: 'error',
              message: String(error.localizedDescription ?? error),
            }),
          )
        },
      )
    },
    dispose() {
      if (disposed) {
        return
      }

      disposed = true
      state.dispatch = undefined
      webView.stopLoading()
      config.userContentController.removeScriptMessageHandlerForName('editor')
      webView.navigationDelegate = null as never
      webView.removeFromSuperview()
      states.delete(webView)
    },
  }
}
