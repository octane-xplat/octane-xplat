// Auth session — native leaf. A hosted web ceremony in a system browser
// context: ASWebAuthenticationSession on iOS (it intercepts the callback
// scheme itself, no URL-scheme registration needed) and a Chrome Custom Tab
// on Android, which returns through the app's existing deep-link intent
// filter — the app must declare `callbackScheme` in its manifest like any
// incoming link (decision #66).
//
// AuthenticationServices sits outside the framework subset @nativescript/types
// loads by default (common.d.ts), so its globals are declared locally — the
// symbols resolve through the runtime bridge either way.
import { Application, Utils } from '@nativescript/core'
import type { AuthSessionImpl, AuthSessionOptions, AuthSessionResult, Capability } from './types'

declare const ASWebAuthenticationSession: any
declare const ASWebAuthenticationSessionErrorCode: any
declare const ASWebAuthenticationPresentationContextProviding: any

let active = false
let lastCallbackUrl: string | null = null

function isCallback(url: string | null | undefined, scheme: string): url is string {
	return !!url && url !== lastCallbackUrl && url.startsWith(`${scheme}:`)
}

function iosOpen(url: string, options: AuthSessionOptions): Promise<AuthSessionResult> {
	return new Promise((resolve) => {
		const nsUrl = NSURL.URLWithString(url)
		if (!nsUrl) {
			resolve({ type: 'error', message: 'authSession.open: invalid URL' })
			return
		}

		// The session must be retained for the ceremony's lifetime — ARC sees
		// no JS-side reference.
		let session: any
		let provider: any
		const finish = (result: AuthSessionResult) => {
			if (result.type === 'success') {
				lastCallbackUrl = result.url
			}

			session = null
			provider = null
			resolve(result)
		}

		session = ASWebAuthenticationSession.alloc().initWithURLCallbackURLSchemeCompletionHandler(
			nsUrl,
			options.callbackScheme,
			(callbackURL: any, error: any) => {
				if (error) {
					finish(
						error.code === ASWebAuthenticationSessionErrorCode.CanceledLogin
							? { type: 'cancel' }
							: { type: 'error', message: error.localizedDescription },
					)

					return
				}

				finish(
					callbackURL ? { type: 'success', url: callbackURL.absoluteString } : { type: 'cancel' },
				)
			},
		)

		session.prefersEphemeralWebBrowserSession = !!options.prefersEphemeralSession
		provider = AuthSessionPresentationAnchor.new()
		session.presentationContextProvider = provider

		if (!session.start()) {
			finish({ type: 'error', message: 'authSession.open: session failed to start' })
		}
	})
}

// NSObject exists only on iOS, so create the presentation provider lazily.
// NativeClass is a build-time decorator; this Vite-transformed module uses the
// NativeScript runtime's class-extension API instead.
const AuthSessionPresentationAnchor: any =
	typeof NSObject !== 'undefined'
		? (NSObject as any).extend(
				{
					presentationAnchorForWebAuthenticationSession(): UIWindow {
						const foregroundActive = (globalThis as any).UISceneActivationState?.ForegroundActive
						const scenes = UIApplication.sharedApplication.connectedScenes.allObjects
						for (let i = 0; i < scenes.count; i++) {
							const scene = scenes.objectAtIndex(i) as UIWindowScene
							if (scene.activationState === foregroundActive) {
								const anchor = scene.windows.objectAtIndex(0)
								if (anchor) {
									return anchor
								}
							}
						}

						return UIApplication.sharedApplication.keyWindow
					}
				},
				{
					name: 'XplatAuthSessionPresentationAnchor',
					protocols: [ASWebAuthenticationPresentationContextProviding],
				},
			)
		: undefined

function androidOpen(url: string, options: AuthSessionOptions): Promise<AuthSessionResult> {
	return new Promise((resolve) => {
		const scheme = options.callbackScheme
		const intentUrl = (intent: any) => intent?.getDataString?.()

		const finish = (result: AuthSessionResult) => {
			Application.android.off('activityNewIntent', onNewIntent)
			Application.off(Application.resumeEvent, onResume)
			if (result.type === 'success') {
				lastCallbackUrl = result.url
			}

			resolve(result)
		}

		const onNewIntent = (args: any) => {
			const callback = intentUrl(args.intent)
			if (isCallback(callback, scheme)) {
				finish({ type: 'success', url: callback })
			}
		}

		const onResume = () => {
			const activity = Utils.android.getCurrentActivity() ?? Application.android.foregroundActivity
			// Core's onNewIntent calls setIntent(), so a redirect delivered while
			// the Custom Tab was open is already the activity's intent here; a
			// resume without a matching URL is a user dismiss.
			const callback = intentUrl(activity?.getIntent?.())
			if (isCallback(callback, scheme)) {
				finish({ type: 'success', url: callback })
			} else {
				finish({ type: 'cancel' })
			}
		}

		Application.android.on('activityNewIntent', onNewIntent)
		Application.on(Application.resumeEvent, onResume)

		try {
			const activity = Utils.android.getCurrentActivity()
			const tabs = (globalThis as any).androidx?.browser?.customtabs?.CustomTabsIntent
			if (activity && tabs) {
				new tabs.Builder().build().launchUrl(activity, android.net.Uri.parse(url))
			} else {
				// No androidx.browser on the classpath — a plain browser VIEW
				// intent still returns through the same deep-link path.
				Utils.openUrl(url)
			}
		} catch (e) {
			finish({ type: 'error', message: `authSession.open: ${e}` })
		}
	})
}

export const authSession: Capability<AuthSessionImpl> = {
	supported: true,
	async ensure() {
		return 'granted'
	},
	impl: {
		open(url, options) {
			if (active) {
				return Promise.resolve({
					type: 'error',
					message: 'authSession.open: a session is already active',
				})
			}

			active = true
			const run = Application.ios ? iosOpen : androidOpen
			const result = run(url, options)
			result.finally(() => {
				active = false
			})

			return result
		},
	},
}
