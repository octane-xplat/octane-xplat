/** Run the CLI-owned macOS host and Vite watcher using xplat.targets.macos.dev.
 * Native source changes compile and restart the host; failed rebuilds preserve it.
 * Resolves after shutdown and rejects on startup or unexpected host failure.
 */
export declare function runMacOSDev(appRoot?: string): Promise<void>
/** Run a DOM frontend in WKWebView with the CLI-managed JavaScriptCore host. */
export declare function runMacOSWebViewDev(appRoot?: string): Promise<void>
