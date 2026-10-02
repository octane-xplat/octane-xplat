// Auth session — macOS leaf. ASWebAuthenticationSession exists on macOS
// (10.15+) and behaves like the iOS path: it intercepts the callback scheme
// itself, so no URL-type registration is needed. The appkit-node-api bridge
// reaches AuthenticationServices directly; the session presents against the
// app's key window via a lazy NSObject presentation-context provider.
import type { AuthSessionImpl, AuthSessionResult, Capability } from './types'

declare const ASWebAuthenticationSession: any
declare const ASWebAuthenticationPresentationContextProviding: any
declare const NSApplication: any
declare const NSObject: any
declare const NSURL: any
declare const interop: any
declare const objc: any

// Import before the NSObject.extend class below is built — ObjCProtocols
// reads the protocol constant at extend() time.
try {
	objc.import('AuthenticationServices')
} catch {
	// Symbols may already be bound — failures surface via `supported: false`.
}

// Explicit roots: ASWebAuthenticationSession retains the completion block,
// but its presentation provider is weak. Keep both wrappers alive until finish.
let active: { session: any; provider: any } | null = null

let frameworkReady: boolean | null = null

function frameworkAvailable(): boolean {
	if (frameworkReady !== null) {
		return frameworkReady
	}

	try {
		objc.import('AuthenticationServices')
	} catch {
		// Symbols still resolve lazily below when the import isn't needed.
	}

	frameworkReady = typeof ASWebAuthenticationSession !== 'undefined'
	return frameworkReady
}

// NSObject.extend is the registration shape this node-api runtime binds
// (class syntax + NativeClass registers the class but not the methods).
// Declared lazily so the protocol constant resolves after the framework
// import above.
let AuthSessionAnchor: any = null

function ensureAnchorClass() {
	if (AuthSessionAnchor !== null) {
		return
	}

	AuthSessionAnchor = NSObject.extend(
		{
			presentationAnchorForWebAuthenticationSession(_session: any): any {
				const app = NSApplication.sharedApplication
				return app.keyWindow ?? app.mainWindow ?? app.windows?.firstObject
			},
		},
		{
			protocols: [ASWebAuthenticationPresentationContextProviding],
			exposedMethods: {
				'presentationAnchorForWebAuthenticationSession:': {
					params: [interop.types.id],
					returns: interop.types.id,
				},
			},
		},
	)
}

export const authSession: Capability<AuthSessionImpl> = {
	get supported() {
		return frameworkAvailable()
	},
	async ensure() {
		return frameworkAvailable() ? 'granted' : 'unsupported'
	},
	get impl() {
		return frameworkAvailable() ? implementation : null
	},
}

const implementation: AuthSessionImpl = {
	open(url, options): Promise<AuthSessionResult> {
		if (active) {
			return Promise.resolve({
				type: 'error',
				message: 'authSession.open: a session is already active',
			})
		}

		const operation = { session: null as any, provider: null as any }
		active = operation
		return new Promise((resolve) => {
			let settled = false
			const finish = (result: AuthSessionResult) => {
				if (settled) {
					return
				}

				settled = true
				if (active === operation) {
					active = null
				}

				operation.session = null
				operation.provider = null
				resolve(result)
			}

			try {
				if (
					typeof url !== 'string' ||
					typeof options.callbackScheme !== 'string' ||
					!/^https?:\/\//i.test(url) ||
					!/^[a-z][a-z\d+.-]*$/i.test(options.callbackScheme)
				) {
					throw new Error(
						'authSession.open: expected an HTTP(S) URL and a callback scheme without a colon',
					)
				}

				const nsUrl = NSURL.URLWithString(url)
				if (!nsUrl?.host) {
					throw new Error('authSession.open: invalid URL')
				}

				const app = NSApplication.sharedApplication
				if (!(app.keyWindow ?? app.mainWindow ?? app.windows?.firstObject)) {
					throw new Error('authSession.open: an AppKit presentation window is required')
				}

				ensureAnchorClass()
				operation.provider = AuthSessionAnchor.new()
				operation.session =
					ASWebAuthenticationSession.alloc().initWithURLCallbackURLSchemeCompletionHandler(
						nsUrl,
						options.callbackScheme,
						(callbackURL: any, error: any) => {
							try {
								if (error) {
									finish(
										error.domain === 'com.apple.AuthenticationServices.WebAuthenticationSession' &&
											Number(error.code) === 1
											? { type: 'cancel' }
											: { type: 'error', message: String(error.localizedDescription ?? error) },
									)
								} else if (callbackURL) {
									const callback = String(callbackURL.absoluteString)
									if (
										callback.split(':')[0].toLowerCase() !== options.callbackScheme.toLowerCase()
									) {
										throw new Error('authSession.open: unexpected callback scheme')
									}

									finish({ type: 'success', url: callback })
								} else {
									finish({ type: 'cancel' })
								}
							} catch (error) {
								finish({ type: 'error', message: String((error as any)?.message ?? error) })
							}
						},
					)

				// A bridge may deliver completion synchronously during construction.
				if (settled) {
					operation.session = null
					return
				}

				operation.session.prefersEphemeralWebBrowserSession = !!options.prefersEphemeralSession
				operation.session.presentationContextProvider = operation.provider
				if (!operation.session.start()) {
					finish({ type: 'error', message: 'authSession.open: session failed to start' })
				}
			} catch (error) {
				finish({
					type: 'error',
					message: String((error as any)?.localizedDescription ?? (error as any)?.message ?? error),
				})
			}
		})
	},
}
