# Authentication and browser presenters

Use for hosted login, AppKit browser/presenter lifetime, provider ownership, and official buttons. Follow the [service selection rules](../services.md) and each provider guide for native setup.

## Hosted authentication

Use the [sign-in guide](../../../../../docs/app/authentication.md) for a concrete
iOS/Android Auth0 path, provider registration, API verification and account UI.
The copied adapter is application code. Browser clients need a cookie flow or
a browser SDK in a web platform file. Do not infer a verified identity from
credential restoration alone: call the protected API before exposing private
content. Keep the account owner outside outlets replaced by its authority;
clear separate account-owned stores when replacing accounts.

Use the [hosted auth client](../../../../../packages/auth/README.md#hosted-sign-in-ceremonies)
for app-owned credential persistence and refresh. Windows currently reports
`authSession.supported === false`; a desktop callback/activation adapter is still
required. Await sign-out before treating durable credentials as cleared; failed
deletion rejects with a sanitized error, so expose the failure and allow retry.
Server revocation is still attempted; it retires pending login/refresh and orders
removal after earlier saves. A superseded login reports `cancelled`. Pending
authenticated requests cannot replay into a later session; a request still
loading credentials rejects when its session changes.

```ts
import { auth } from './auth'

await auth.signOut()
```

## AppKit in-app browser

webBrowser from @octane-xplat/web-browser now has an owned WebKit/NSWindow source
path. Add the package to the app and rebuild for packaged Swift class discovery;
supported checks the accepts/create bridge methods, and missing/invalid/failed
opens cancel without an external fallback. Foundation validates HTTP(S)/host,
so packaged JavaScriptCore does not need a JS URL global. The macOS external
opener behavior is a hard cutover; use platform.openUrl explicitly for that flow.
Opened means presented, not loaded. Current native chrome owns history, reload/
stop/address/close; replacement/dismiss/user close retire views, KVO and delegates.
Generic failure text omits NSError/URL details. The app's default WebKit data
store is used; there is no app-shell JS bridge or Safari-profile promise.

```ts
import { webBrowser } from '@octane-xplat/web-browser'
export async function openHelp(address: string) {
	return webBrowser.openBrowser(address)
}
export const closeHelp = () => webBrowser.dismissBrowser()
```

Native actions require the main UI thread. Mobile style/title/collapsing options
and Android warmup hints stay platform specific. Downloads,
HTTP-auth/permission UI and OAuth interception are not implemented. Page alert/
confirm/prompt sheets identify the requesting website; cancelled prompts return
null and accepted empty input stays empty. Close/replacement/navigation/process
termination retire outstanding sheets. Native dialog/focus/IME behavior requires separate verification. Page file controls have website-labeled
NSOpenPanel source paths respecting multiple/directory parameters, with one-shot
cancellation on owner teardown/navigation/process termination. Public WebKit
parameters expose no accepted types; do not promise native HTML accept filtering.
File delivery, directory enumeration, sandbox grants and actual uploads require separate verification.
Five JS ownership cases and a manual harness fixture are authored.
Swift/class discovery, native UI/navigation/error/redirect/popup/cookie behavior,
ATS/sandbox, threading/KVO/cleanup/AX and clean packaging require separate target qualification.
AppKit harness dependency/lock link and scoped package task are source changes;
no dependency install or native qualification ran. See the package README and
[AppKit navigation guide](../../../../../docs/app/navigation.md#open-a-page-inside-an-appkit-browser-window).

## AppKit authentication presenter lifetime

Native authSession snapshots its callback scheme and ephemeral preference and
anchors to its initiating visible key/main window without an attached sheet.
It never falls back to the first arbitrary app window. Only its own session can
query that anchor; window close/app termination retires JS ownership and asks the
native session to cancel before settling cancel. Native setup failures clean up
and cancel acquired sessions; late callbacks cannot release a replacement.
Screen unmount/hiding alone is not window close. Call from the app's normal UI
thread; actual native thread behavior is unqualified.

```ts
import { authSession } from '@octane-xplat/platform'
const result = await authSession.open('https://example.com/authorize', {
	callbackScheme: 'myapp', prefersEphemeralSession: true,
})
```

Lifecycle-observer setup must succeed before starting. Removal errors retire
callbacks but can retain native observers. A session with no native completion
stays pending until cancellation or presenter/app teardown; no timeout invents a
result. The backend still owns destination/state/PKCE/nonce/token verification;
never log callback URLs or credentials. Eleven model cases and the manual
cancellation fixture are authored. OS browser/callback/cancellation,
window/observer/HMR lifetime, VoiceOver and installed consumers require separate target qualification.
See [AppKit sign-in ownership](../../../../../docs/platform/platform-services.md#appkit-sign-in-window-ownership).

## AppKit Sign in with Apple ownership

Apple authorization is a separate controller from authSession. The native leaf
captures scopes/nonce, retains its initiating visible key/main window without an
attached sheet and accepts anchor/results only from its own controller and
provider/delegate wrappers. Independent class caches allow an anchor-registration
failure to retry. Close/termination observers must attach before constructing UI;
terminal paths retire JS ownership and owned native delegate/provider references
before optional cancel (macOS 13+). Late/foreign callbacks do not decode credentials
or release replacement attempts. A conversion already underway can reenter teardown;
its result is ignored. Backend identity-token/audience/nonce verification is still
required before establishing an app session.

```ts
import { appleAuth } from '@octane-xplat/auth'
export async function beginAppleSignIn(backendAttemptNonce: string) {
	return appleAuth.signIn({ scopes: ['email'], nonce: backendAttemptNonce })
}
```

Screen unmount/hiding does not cancel the controller. Missing or throwing cancel
may leave native UI open; failed observer removal can retain inert native observers.
No timeout fabricates a result. Eleven Apple model cases and an idle official-button
fixture are authored; native registration/wrapper/thread/UI/callback/window/
HMR/credential-state/nonce, signing/provisioning/entitlement, VoiceOver and consumer
qualification remain open in #62. See [Apple presenter ownership](../../../../../packages/auth/README.md#keep-apple-sign-in-with-its-initiating-window).

## AppKit provider-button actions

Native Apple/Google buttons own one pending action per mounted instance. Disabled
and repeat pending presses are ignored; onPress remains a notification (return
values do not gate). Recheck currently committed owner/disabled props after the
hook. Queued state may commit after provider work has begun. Deliver to the latest
mounted onResult even if props become disabled, and drop results after unmount or
owner replacement. This does not cancel already-started provider work. Apple
style/type attachment changes keep the component's pending result ownership.

```tsx
import { GoogleSignInButton } from '@octane-xplat/auth'
export function Entry() {
	return <GoogleSignInButton onResult={(result) => console.log(result.status)} />
}
```

Google now uses the existing native NSButton intrinsic (text/isEnabled/onPress),
not an official Google SDK button. Renderer isEnabled updates native state and
protects disabled/retired handler dispatch. Theme/variant remain unimplemented;
no pixel or OS input/AX parity is claimed. Unexpected provider failure yields a
generic owned error; consumer callbacks keep their own errors. No busy indicator
is added. Six action-model/three renderer cases and a manual fixture require separate verification;
hook timing, actual native action/focus/Tab/keyboard/AX, attachment/layout/lifetime
and installed consumers remain open. See [button ownership](../../../../../packages/auth/README.md#appkit-button-action-ownership).
