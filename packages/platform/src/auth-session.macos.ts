// Auth session — macOS leaf. ASWebAuthenticationSession exists on macOS
// (10.15+) and behaves like the iOS path: it intercepts the callback scheme
// itself, so no URL-type registration is needed. The appkit-node-api bridge
// reaches AuthenticationServices directly; the session presents against the
// app's key window via a lazy NSObject presentation-context provider.
import type { AuthSessionImpl, AuthSessionResult, Capability } from './types'

declare const ASWebAuthenticationSession: any
declare const ASWebAuthenticationSessionErrorCode: any
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

let active = false

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
	impl: {
		open(url, options) {
			if (!frameworkAvailable()) {
				return Promise.resolve({
					type: 'error',
					message: 'authSession.open: AuthenticationServices is unavailable on this host',
				})
			}

			if (active) {
				return Promise.resolve({
					type: 'error',
					message: 'authSession.open: a session is already active',
				})
			}

			const nsUrl = NSURL.URLWithString(url)
			if (!nsUrl) {
				return Promise.resolve({ type: 'error', message: 'authSession.open: invalid URL' })
			}

			active = true
			return new Promise((resolve) => {
				// The session + provider must be retained for the ceremony's
				// lifetime — no JS-side reference exists after open returns.
				let session: any
				let provider: any
				const finish = (result: AuthSessionResult) => {
					active = false
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
									: { type: 'error', message: String(error.localizedDescription ?? error) },
							)

							return
						}

						finish(
							callbackURL
								? { type: 'success', url: String(callbackURL.absoluteString) }
								: { type: 'cancel' },
						)
					},
				)

				session.prefersEphemeralWebBrowserSession = !!options.prefersEphemeralSession
				ensureAnchorClass()
				provider = AuthSessionAnchor.new()
				session.presentationContextProvider = provider

				if (!session.start()) {
					finish({ type: 'error', message: 'authSession.open: session failed to start' })
				}
			})
		},
	},
}
