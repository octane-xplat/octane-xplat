# `@octane-xplat/web-browser`

```sh
pnpm add @octane-xplat/web-browser
```

Open web content *inside* the app — `SFSafariViewController` on iOS, Chrome
Custom Tabs (`androidx.browser`) on Android. This is not the OAuth session
(`@octane-xplat/platform`'s `authSession` intercepts callback schemes) and not
embedded content (`<WebView>` renders pages the app controls) — use it for
links that should feel in-app but aren't yours.

```ts
import { webBrowser } from '@octane-xplat/web-browser'

await webBrowser.openBrowser('https://docs.example.com', {
	toolbarColor: '#1a1a1a',
	showTitle: true,
})
// → { type: 'opened' }
```

Web falls back to `window.open`; macOS delegates to the external browser
(`supported: false` there — it's not the in-app contract). `warmUp`/
`coolDown`/`mayInitWithUrl` pre-warm the Android Custom Tabs service and
no-op elsewhere.
