### New package: `@octane-xplat/web-browser`

Open external links *inside* the app — `SFSafariViewController` on iOS, Chrome
Custom Tabs on Android. Distinct from `platform`'s `authSession` (OAuth
callback interception) and `<WebView>` (embedded content the app controls).

```ts
import { webBrowser } from '@octane-xplat/web-browser'

await webBrowser.openBrowser('https://docs.example.com', {
	toolbarColor: '#1a1a1a',
	showTitle: true,
})
```

Web falls back to `window.open`; macOS delegates to the external browser.
`warmUp`/`coolDown`/`mayInitWithUrl` pre-warm Android's Custom Tabs service.
