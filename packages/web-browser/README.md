# `@octane-xplat/web-browser`

Open a document link inside the app: Safari view controller on iOS, Chrome
Custom Tabs on Android, and an experimental owned WebKit window on AppKit.
`openBrowser` resolves when presentation succeeds; `opened` does not prove the
page loaded. Use the auth-session service for callback-based authentication.

```sh
pnpm add @octane-xplat/web-browser
```

```ts
import { webBrowser } from '@octane-xplat/web-browser'

export async function showHelp(address: string) {
	return webBrowser.openBrowser(address)
}
```

On AppKit, rebuild the native host after adding the package. Its packaged Swift
source and AppKit/WebKit framework configuration provide the native bridge.
Missing bridges report `supported: false` and opening returns `cancel`. The
macOS leaf now opens in-app; the former external-browser delegation is removed.
Use the platform opener when another application should own the destination.

```ts
import { openUrl } from '@octane-xplat/platform'

export function showExternalPage(address: string) {
	return openUrl(address)
}
```

## Experimental AppKit subset

Foundation validates HTTP(S) destinations with a host before window creation;
this avoids a JS URL-global prerequisite in packaged JavaScriptCore hosts.
A successful open owns one native window with Back, Forward, Reload/Stop,
page address and Close controls. New opens retire the previous browser, and
`dismissBrowser` closes the current owner. User close stops loading and removes
observers, delegates and content. Invalid URLs or presentation failures return
`cancel` without launching another application.



```ts
import { webBrowser } from '@octane-xplat/web-browser'

export async function replaceHelpPage(address: string) {
	const result = await webBrowser.openBrowser(address)
	return result.type // 'opened' or 'cancel' on AppKit
}
export function closeHelpPage() {
	webBrowser.dismissBrowser()
}
```

The AppKit source follows normal HTTP(S) navigation and redirects, reuses the
window for HTTP(S) new-window links, and displays generic load failure feedback
with Reload. Non-web application schemes are cancelled. WebKit uses the app's
default website data store, separate from Safari's profile; no app-shell script
or native service bridge is injected. Network/sandbox/ATS policy stays with the
app. This is a browsing window within an AppKit app.

```ts
import { webBrowser } from '@octane-xplat/web-browser'

export const canShowHelp = () => webBrowser.supported
export const openHelp = (address: string) => webBrowser.openBrowser(address)
```

`OpenBrowserOptions` colors/styles/title/collapsing options remain mobile
specific and are ignored on AppKit. `warmUp`, `coolDown` and `mayInitWithUrl`
remain Android-only service hints; they do nothing on AppKit. Web uses a new
browser tab. Advanced downloads/uploads, JS alert/confirm/prompt UI, HTTP-auth
UI, website permission prompts and OAuth callback interception are not
implemented by the AppKit service.

```ts
import { webBrowser } from '@octane-xplat/web-browser'

// These options customize the mobile browser; AppKit uses its native chrome.
await webBrowser.openBrowser('https://docs.example.com', {
	toolbarColor: '#1a1a1a',
	showTitle: true,
})
```

Five owner cases and the manual AppKit fixture are authored but unrun. Swift
compilation/class discovery, actual presentation, network/TLS/ATS behavior,
history/reload/error UI, redirects/popups, cookie behavior, main-thread/KVO
ownership, user close/replacement, VoiceOver, resource lifetime and clean packed
consumers remain unqualified. No build, test, typecheck, native execution or
packaging pass is claimed by this source implementation.

Continue with [Device feature availability](https://octane-xplat.goddardai.org/platform-services).
