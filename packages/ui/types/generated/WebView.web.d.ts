import type { WebViewProps } from "./props.js";
/**  Embedded web document — a sandboxed <iframe>. `html` renders through
 *  `srcdoc` and wins over `src` when both are set. The iframe `error`
 *  event is unreliable cross-browser, so `onError` is best-effort here. */
export declare function WebView(props: WebViewProps): import("octane/jsx-runtime").JSX.Element;
