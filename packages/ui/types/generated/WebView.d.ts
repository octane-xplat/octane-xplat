import type { WebViewProps } from "./props.js";
/**  Embedded web document — NS <webview> (WKWebView / android.webkit.WebView).
 *  `html` flows through the `src` property: values that aren't http/file
 *  URLs take its `_loadData` path. NS reports failures as `loadFinished`
 *  with an `error` field — there is no separate error event, so the leaf
 *  splits it into onLoad/onError.
 *  `scrollEnabled={false}` is leaf-applied, not an NS prop: iOS clears the
 *  WKWebView scrollView's scrollEnabled; Android has no settings flag, so
 *  a touch listener eats ACTION_MOVE (DOWN/UP still reach the page, so
 *  link taps work but drag text selection inside the frame does not). */
export declare function WebView(props: WebViewProps): unknown;
