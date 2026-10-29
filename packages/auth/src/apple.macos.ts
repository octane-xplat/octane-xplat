// Sign in with Apple — macOS leaf over AuthenticationServices via the
// appkit-node-api ObjC bridge (the same framework the iOS plugin wraps,
// available since macOS 10.15). The `com.apple.developer.applesignin`
// entitlement must sit on the packaged app for the sheet to present;
// hosts without it still load the framework and surface the OS error.
import { sha256Hex } from './sha256'
import type {
	AppleAuth,
	AppleAuthConfig,
	AppleCredentialState,
	AppleSignInOptions,
	AuthCredential,
	SignInResult,
} from './types'

declare const ASAuthorizationAppleIDProvider: any
declare const ASAuthorizationController: any
declare const ASAuthorizationControllerDelegate: any
declare const ASAuthorizationControllerPresentationContextProviding: any
declare const ASAuthorizationScopeEmail: any
declare const ASAuthorizationScopeFullName: any
declare const NSApplication: any
declare const NSString: any
declare const NSObject: any
declare const interop: any
declare const objc: any
declare const NSNotificationCenter: any
declare const NSOperationQueue: any
declare const NSWindowWillCloseNotification: any
declare const NSApplicationWillTerminateNotification: any

// Import before the NSObject.extend classes below are built — their
// protocol/exposed-method constants resolve at extend() time, so the
// framework's metadata has to be loaded first.
try {
	objc.import('AuthenticationServices')
} catch {
	// Symbols may already be bound — failures surface via `supported: false`.
}

const SCOPE_MAP: Record<string, () => any> = {
	email: () => ASAuthorizationScopeEmail,
	name: () => ASAuthorizationScopeFullName,
}

function isCancel(error: unknown): boolean {
	// ASAuthorizationError.canceled = 1001 (NSError.code).
	return (
		(error as any)?.domain === 'com.apple.AuthenticationServices.AuthorizationError' &&
		Number((error as any)?.code) === 1001
	)
}

function toCredential(credential: any): AuthCredential {
	const tokenData = credential.valueForKey('identityToken')
	const codeData = credential.valueForKey('authorizationCode')
	const fullName = credential.fullName
	const name = [fullName?.givenName, fullName?.familyName].filter(Boolean).join(' ') || undefined

	return {
		provider: 'apple',
		idToken: tokenData ? String(NSString.alloc().initWithDataEncoding(tokenData, 4)) : undefined,
		authorizationCode: codeData
			? String(NSString.alloc().initWithDataEncoding(codeData, 4))
			: undefined,
		scopes: (credential.authorizedScopes ? Array.from(credential.authorizedScopes as any) : []).map(
			(s: any) =>
				s === ASAuthorizationScopeEmail
					? 'email'
					: s === ASAuthorizationScopeFullName
						? 'name'
						: String(s),
		),
		user: {
			id: String(credential.user ?? ''),
			email: credential.email ? String(credential.email) : undefined,
			name,
			givenName: fullName?.givenName ? String(fullName.givenName) : undefined,
			familyName: fullName?.familyName ? String(fullName.familyName) : undefined,
		},
	}
}

let frameworkReady: boolean | null = null

function frameworkAvailable(): boolean {
	if (frameworkReady !== null) {
		return frameworkReady
	}

	try {
		objc.import('AuthenticationServices')
	} catch {
		// The framework ships in every macOS ≥ 10.15 SDK — a failed import just
		// means the symbols still resolve lazily below.
	}

	frameworkReady = typeof ASAuthorizationAppleIDProvider !== 'undefined'
	return frameworkReady
}

// NSObject.extend is the registration shape this node-api runtime binds
// (class syntax + NativeClass registers the class but not the methods —
// verified by probe: respondsToSelector is only true for .extend). Classes
// are built lazily so the protocol constants resolve after import.
let AppleAuthDelegate: any = null
let AppleAuthAnchor: any = null

function sameNative(left: any, right: any): boolean {
	if (!left || !right) return false
	try { return left === right || !!left.isEqual?.(right) } catch { return false }
}

function ensureClasses() {
	// Cache each successful registration independently so an anchor registration
	// failure can retry without treating a partial pair as ready.
	if (AppleAuthDelegate === null) AppleAuthDelegate = NSObject.extend(
		{
			authorizationControllerDidCompleteWithAuthorization(this: any, controller: any, authorization: any) {
				const operation = active
				if (!operation || !sameNative(operation.delegate, this) || !sameNative(operation.controller, controller)) return
				try {
					const credential = toCredential(authorization.credential)
					if (!credential.user.id || !credential.idToken) throw new Error('Sign in with Apple returned an incomplete credential')
					operation.finish?.({ status: 'success', credential })
				} catch (error) {
					operation.finish?.({ status: 'error', message: String((error as any)?.message ?? error) })
				}
			},
			authorizationControllerDidCompleteWithError(this: any, controller: any, error: any) {
				const operation = active
				if (!operation || !sameNative(operation.delegate, this) || !sameNative(operation.controller, controller)) return
				try {
					operation.finish?.(isCancel(error) ? { status: 'cancelled' } : { status: 'error', message: String(error?.localizedDescription ?? error) })
				} catch (failure) {
					operation.finish?.({ status: 'error', message: String((failure as any)?.message ?? failure) })
				}
			},
		},
		{
			protocols: [ASAuthorizationControllerDelegate],
			exposedMethods: {
				'authorizationController:didCompleteWithAuthorization:': { params: [interop.types.id, interop.types.id], returns: interop.types.void },
				'authorizationController:didCompleteWithError:': { params: [interop.types.id, interop.types.id], returns: interop.types.void },
			},
		},
	)
	if (AppleAuthAnchor === null) AppleAuthAnchor = NSObject.extend(
		{
			presentationAnchorForAuthorizationController(this: any, controller: any): any {
				const operation = active
				try {
					return operation && sameNative(operation.anchor, this) && sameNative(operation.controller, controller) && operation.window?.visible ? operation.window : null
				} catch { return null }
			},
		},
		{
			protocols: [ASAuthorizationControllerPresentationContextProviding],
			exposedMethods: {
				'presentationAnchorForAuthorizationController:': { params: [interop.types.id], returns: interop.types.id },
			},
		},
	)
}

// Native delegates/providers are weak. One operation retains their wrappers and
// its initiating window until a terminal callback or presenter teardown.
interface AppleOperation {
	controller: any
	delegate: any
	anchor: any
	window: any
	finish: ((result: SignInResult, cancelNative?: boolean) => void) | null
}
let active: AppleOperation | null = null
function clearController(controller: any, delegate: any, anchor: any) {
	try { if (sameNative(controller?.delegate, delegate)) controller.delegate = null } catch {}
	try { if (sameNative(controller?.presentationContextProvider, anchor)) controller.presentationContextProvider = null } catch {}
}
function cancelController(controller: any) {
	// cancel was added in macOS 13; older hosts still retire JS ownership.
	try { controller?.cancel?.() } catch {}
}

export const appleAuth: AppleAuth = {
	get supported() {
		return frameworkAvailable()
	},
	configure(_config: AppleAuthConfig) {
		// No native configuration — the flow is bound to the app id entitlement.
	},
	async signIn(options?: AppleSignInOptions): Promise<SignInResult> {
		if (!frameworkAvailable()) {
			return { status: 'error', message: 'AuthenticationServices is unavailable on this host' }
		}

		if (active) {
			return { status: 'error', message: 'a Sign in with Apple flow is already active' }
		}

		const operation: AppleOperation = { controller: null, delegate: null, anchor: null, window: null, finish: null }
		active = operation
		return new Promise<SignInResult>((resolve) => {
			let settled = false
			let center: any = null
			const observers: any[] = []
			const finish = (result: SignInResult, cancelNative = false) => {
				if (settled) return
				settled = true
				const { controller, delegate, anchor } = operation
				operation.finish = null
				for (const observer of observers.splice(0)) {
					try { center.removeObserver(observer) } catch { /* Retired callbacks remain inert. */ }
				}
				operation.controller = null; operation.delegate = null; operation.anchor = null; operation.window = null
				if (active === operation) active = null
				clearController(controller, delegate, anchor)
				if (cancelNative) cancelController(controller)
				resolve(result)
			}
			operation.finish = finish
			const observe = (name: any, object: any) => {
				const token = center.addObserverForNameObjectQueueUsingBlock(name, object, NSOperationQueue.mainQueue, () => finish({ status: 'cancelled' }, true))
				if (!token) throw new Error('Sign in with Apple presenter observation failed')
				if (settled) { try { center.removeObserver(token) } catch {} }
				else observers.push(token)
			}
			try {
				const scopes = options?.scopes?.slice(), nonce = options?.nonce
				const app = NSApplication.sharedApplication
				operation.window = [app.keyWindow, app.mainWindow].find((window) => window && (window.visible === true || window.visible === 1) && !window.attachedSheet)
				if (!operation.window) throw new Error('Sign in with Apple requires a visible AppKit presentation window')
				center = NSNotificationCenter.defaultCenter
				observe(NSWindowWillCloseNotification, operation.window)
				if (settled) return
				observe(NSApplicationWillTerminateNotification, null)
				if (settled) return
				ensureClasses()
				if (settled) return
				operation.delegate = AppleAuthDelegate.new()
				if (settled) { operation.delegate = null; return }
				const provider = ASAuthorizationAppleIDProvider.new()
				if (settled) return
				const request = provider.createRequest()
				if (settled) return
				if (scopes?.length) request.requestedScopes = scopes.map((scope) => SCOPE_MAP[scope]?.()).filter(Boolean)
				if (settled) return
				if (nonce !== undefined) request.nonce = sha256Hex(nonce)
				if (settled) return
				operation.anchor = AppleAuthAnchor.new()
				if (settled) { operation.anchor = null; return }
				const allocation = ASAuthorizationController.alloc()
				if (settled) return
				operation.controller = allocation.initWithAuthorizationRequests([request])
				if (settled) { cancelController(operation.controller); operation.controller = null; return }
				const { controller, delegate, anchor } = operation
				controller.delegate = delegate
				if (settled) { clearController(controller, delegate, anchor); return }
				controller.presentationContextProvider = anchor
				if (settled) { clearController(controller, delegate, anchor); return }
				controller.performRequests()
			} catch (error) {
				finish({ status: 'error', message: String((error as any)?.localizedDescription ?? (error as any)?.message ?? error) }, true)
			}
		})
	},
	async getCredentialState(userId: string): Promise<AppleCredentialState> {
		if (!frameworkAvailable()) {
			return 'unknown'
		}

		return new Promise<AppleCredentialState>((resolve) => {
			try {
				ASAuthorizationAppleIDProvider.new().getCredentialStateForUserIDCompletion(
					userId,
					(state: number, error: any) => {
						if (error) {
							resolve('unknown')
							return
						}

						resolve(
							state === 1
								? 'authorized'
								: state === 0
									? 'revoked'
									: state === 3
										? 'transferred'
										: state === 2
											? 'notFound'
											: 'unknown',
						)
					},
				)
			} catch {
				resolve('unknown')
			}
		})
	},
}
