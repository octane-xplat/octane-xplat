// The WKWebView payload is bundled by build-browser.mjs into dist/macos/
// before publish; it has no compile-time source. The wildcard keeps the
// import resolvable in typecheck/typegen programs.
declare module '*/dist/macos/browser.js' {
	const browser: string
	export default browser
}
