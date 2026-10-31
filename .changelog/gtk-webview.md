### WebView on Linux GTK

`WebView` is now available in the GTK UI root (`@octane-xplat/ui` on
`linux`), backed by WebKitGTK 6.0's `WebKit.WebView`. `src`/`html`
documents, `onLoad`/`onError`/`onLayoutContent`, `scrollEnabled`,
`matchContents`, and the imperative handle (`reload`, `goBack`,
`goForward`, `stopLoading`, `native`) follow the shared contract.

```tsx
import { WebView } from '@octane-xplat/ui'

<WebView src="https://example.com" onError={(e) => report(e.error)} />
```

Requires the WebKitGTK 6.0 typelib (`gir1.2-webkit-6.0`) and a session
D-Bus for the WebKit sandbox. See
[GTK setup and limits](https://octane-xplat.goddardai.org/linux-gtk).
