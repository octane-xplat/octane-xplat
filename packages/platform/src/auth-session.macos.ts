// Auth session — macOS leaf. ASWebAuthenticationSession exists on macOS
// (10.15+) and behaves like the iOS path: it intercepts the callback scheme
// itself, so no URL-type registration is needed. The appkit-node-api bridge
// reaches AuthenticationServices directly; the session presents against the
// app's key window via a lazy NSObject presentation-context provider.
import { UnavailabilityError } from '@octane-xplat/lib/capability'
import type { Service } from '@octane-xplat/lib/capability'
import type { AuthSessionImpl, AuthSessionResult } from './types'

declare const ASWebAuthenticationSession: any
declare const ASWebAuthenticationPresentationContextProviding: any
declare const NSApplication: any
declare const NSObject: any
declare const NSURL: any
declare const interop: any
declare const objc: any
declare const NSNotificationCenter: any
declare const NSOperationQueue: any
declare const NSWindowWillCloseNotification: any
declare const NSApplicationWillTerminateNotification: any

// Import before the NSObject.extend class below is built — ObjCProtocols
// reads the protocol constant at extend() time.
try {
	objc.import('AuthenticationServices')
} catch {
	// Symbols may already be bound — failures surface via `supported: false`.
}

// Explicit roots: ASWebAuthenticationSession retains the completion block,
// but its presentation provider is weak. Keep both wrappers alive until finish.
let active: { session: any; provider: any; window: any } | null = null

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
			presentationAnchorForWebAuthenticationSession(session: any): any {
				const operation = active
				// Native wrappers can differ while denoting the same session.
				try {
					if (!operation || !operation.session) {return null}
					const owns = operation.session === session || operation.session.isEqual?.(session)
					return owns && operation.window?.visible ? operation.window : null
				} catch { return null }
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

export const authSession: Service<AuthSessionImpl> = {
	get supported() {
		return frameworkAvailable()
	},
	isAvailable: async () => frameworkAvailable(),
	open(url, options) {
		if (!frameworkAvailable()) {
			return Promise.reject(new UnavailabilityError('authSession'))
		}

		return implementation.open(url, options)
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

		const operation = { session: null as any, provider: null as any, window: null as any }
		active = operation
		return new Promise((resolve) => {
			let settled = false
			let center: any = null
			const observers: any[] = []
			const finish = (result: AuthSessionResult, cancelNative = false) => {
				if (settled) {
					return
				}

				settled = true
				const session = operation.session, provider = operation.provider
				for (const observer of observers.splice(0)) {
					try { center.removeObserver(observer) } catch { /* Retired callbacks remain inert. */ }
				}
				operation.session = null
				operation.provider = null
				operation.window = null
				if (active === operation) {active = null}
				try {
					if (session?.presentationContextProvider === provider) {session.presentationContextProvider = null}
				} catch { /* JS ownership is already retired. */ }
				if (cancelNative) {
					try { session?.cancel() } catch { /* Cancellation must still settle. */ }
				}
				resolve(result)
			}
			const observe = (name: any, object: any) => {
				const token = center.addObserverForNameObjectQueueUsingBlock(name, object, NSOperationQueue.mainQueue, () => {
					finish({ type: 'cancel' }, true)
				})
				if (!token) {throw new Error('authSession.open: presenter observation failed')}
				// Registration itself may synchronously deliver teardown.
				if (settled) { try { center.removeObserver(token) } catch {} }
				else {observers.push(token)}
			}

			try {
				// Snapshot once, before any native call can reenter application code.
				const callbackScheme = options?.callbackScheme
				const ephemeral = !!options?.prefersEphemeralSession
				if (
					typeof url !== 'string' ||
					typeof callbackScheme !== 'string' ||
					!/^https?:\/\//i.test(url) ||
					!/^[a-z][a-z\d+.-]*$/i.test(callbackScheme)
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
				operation.window = [app.keyWindow, app.mainWindow].find((window) =>
					window && (window.visible === true || window.visible === 1) && !window.attachedSheet,
				)
				if (!operation.window) {throw new Error('authSession.open: a visible AppKit presentation window is required')}
				center = NSNotificationCenter.defaultCenter
				observe(NSWindowWillCloseNotification, operation.window)
				if (settled) {return}
				observe(NSApplicationWillTerminateNotification, null)
				if (settled) {return}

				ensureAnchorClass()
				if (settled) {return}
				operation.provider = AuthSessionAnchor.new()
				if (settled) { operation.provider = null; return }
				operation.session =
					ASWebAuthenticationSession.alloc().initWithURLCallbackURLSchemeCompletionHandler(
						nsUrl,
						callbackScheme,
						(callbackURL: any, error: any) => {
							if (settled) {return}
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
										callback.split(':')[0].toLowerCase() !== callbackScheme.toLowerCase()
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
					const lateSession = operation.session
					operation.session = null
					try { lateSession?.cancel() } catch {}
					return
				}

				const session = operation.session
				session.prefersEphemeralWebBrowserSession = ephemeral
				if (settled) {return}
				session.presentationContextProvider = operation.provider
				if (settled) {
					try { session.presentationContextProvider = null } catch {}
					return
				}
				if (!session.start()) {
					finish({ type: 'error', message: 'authSession.open: session failed to start' }, true)
				}
			} catch (error) {
				finish({
					type: 'error',
					message: String((error as any)?.localizedDescription ?? (error as any)?.message ?? error),
				}, true)
			}
		})
	},
}
