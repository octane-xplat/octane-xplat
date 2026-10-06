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

function ensureClasses() {
	if (AppleAuthDelegate !== null) {
		return
	}

	AppleAuthDelegate = NSObject.extend(
		{
			authorizationControllerDidCompleteWithAuthorization(
				this: any,
				_controller: any,
				authorization: any,
			) {
				try {
					const credential = toCredential(authorization.credential)
					if (!credential.user.id || !credential.idToken) {
						throw new Error('Sign in with Apple returned an incomplete credential')
					}

					this.finish?.({ status: 'success', credential })
				} catch (error) {
					this.finish?.({ status: 'error', message: String((error as any)?.message ?? error) })
				}
			},
			authorizationControllerDidCompleteWithError(this: any, _controller: any, error: any) {
				this.finish?.(
					isCancel(error)
						? { status: 'cancelled' }
						: { status: 'error', message: String((error as any)?.localizedDescription ?? error) },
				)
			},
		},
		{
			protocols: [ASAuthorizationControllerDelegate],
			exposedMethods: {
				'authorizationController:didCompleteWithAuthorization:': {
					params: [interop.types.id, interop.types.id],
					returns: interop.types.void,
				},
				'authorizationController:didCompleteWithError:': {
					params: [interop.types.id, interop.types.id],
					returns: interop.types.void,
				},
			},
		},
	)

	AppleAuthAnchor = NSObject.extend(
		{
			presentationAnchorForAuthorizationController(_controller: any): any {
				const app = NSApplication.sharedApplication
				return app.keyWindow ?? app.mainWindow ?? app.windows?.firstObject
			},
		},
		{
			protocols: [ASAuthorizationControllerPresentationContextProviding],
			exposedMethods: {
				'presentationAnchorForAuthorizationController:': {
					params: [interop.types.id],
					returns: interop.types.id,
				},
			},
		},
	)
}

// Retain the ObjC objects + resolver for the ceremony's lifetime — the
// bridge sees no JS-side reference after signIn returns.
let activeController: any = null
let activeDelegate: any = null
let activeAnchor: any = null
let active = false

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

		active = true
		return new Promise<SignInResult>((resolve) => {
			let settled = false
			const finish = (result: SignInResult) => {
				if (settled) {
					return
				}

				settled = true
				active = false
				activeController = null
				activeDelegate = null
				activeAnchor = null
				resolve(result)
			}

			try {
				const app = NSApplication.sharedApplication
				if (!(app.keyWindow ?? app.mainWindow ?? app.windows?.firstObject)) {
					throw new Error('Sign in with Apple requires an AppKit presentation window')
				}

				ensureClasses()
				activeDelegate = AppleAuthDelegate.new()
				activeDelegate.finish = finish
				const provider = ASAuthorizationAppleIDProvider.new()
				const request = provider.createRequest()
				if (options?.scopes?.length) {
					request.requestedScopes = options.scopes.map((s) => SCOPE_MAP[s]?.()).filter(Boolean)
				}

				if (options?.nonce !== undefined) {
					request.nonce = sha256Hex(options.nonce)
				}

				activeAnchor = AppleAuthAnchor.new()
				activeController = ASAuthorizationController.alloc().initWithAuthorizationRequests([
					request,
				])

				activeController.delegate = activeDelegate
				activeController.presentationContextProvider = activeAnchor
				activeController.performRequests()
			} catch (error) {
				finish({
					status: 'error',
					message: String((error as any)?.localizedDescription ?? (error as any)?.message ?? error),
				})
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
