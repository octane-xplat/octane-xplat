// Sign in with Apple — macOS leaf over AuthenticationServices via the
// appkit-node-api ObjC bridge (the same framework the iOS plugin wraps,
// available since macOS 10.15). The `com.apple.developer.applesignin`
// entitlement must sit on the packaged app for the sheet to present;
// hosts without it still load the framework and surface the OS error.
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
		(error as any)?.code === 1001 ||
		/cancel/i.test(String((error as any)?.localizedDescription ?? error))
	)
}

function utf8Bytes(input: string): Uint8Array {
	const data = NSString.stringWithString(input).dataUsingEncoding(4 /* NSUTF8StringEncoding */)
	return new Uint8Array(interop.bufferFromData(data))
}

// FIPS 180-4 — the request nonce must be the hex SHA-256 of the app's nonce
// (same transform the iOS plugin applies via CommonCrypto, which has no
// node-api metadata). Kept local to stay dependency-free.
function sha256Hex(input: string): string {
	const K = new Uint32Array([
		0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
		0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
		0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
		0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
		0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
		0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
		0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
		0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
	])

	const H = new Uint32Array([
		0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
	])
	const bytes = utf8Bytes(input)
	const bitLen = bytes.length * 8
	const padded = new Uint8Array((bytes.length + 9 + 63) & ~63)
	padded.set(bytes)
	padded[bytes.length] = 0x80
	const dv = new DataView(padded.buffer)
	dv.setUint32(padded.length - 8, Math.floor(bitLen / 0x100000000))
	dv.setUint32(padded.length - 4, bitLen >>> 0)
	const w = new Uint32Array(64)
	for (let block = 0; block < padded.length; block += 64) {
		for (let t = 0; t < 16; t++) {
			w[t] = dv.getUint32(block + t * 4)
		}
		for (let t = 16; t < 64; t++) {
			const s0 =
				((w[t - 15] >>> 7) | (w[t - 15] << 25)) ^
				((w[t - 15] >>> 18) | (w[t - 15] << 14)) ^
				(w[t - 15] >>> 3)
			const s1 =
				((w[t - 2] >>> 17) | (w[t - 2] << 15)) ^
				((w[t - 2] >>> 19) | (w[t - 2] << 13)) ^
				(w[t - 2] >>> 10)
			w[t] = (w[t - 16] + s0 + w[t - 7] + s1) >>> 0
		}

		let [a, b, c, d, e, f, g, h] = H
		for (let t = 0; t < 64; t++) {
			const S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7))
			const t1 = (h + S1 + ((e & f) ^ (~e & g)) + K[t] + w[t]) >>> 0
			const S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10))
			const t2 = (S0 + ((a & b) ^ (a & c) ^ (b & c))) >>> 0
			h = g
			g = f
			f = e
			e = (d + t1) >>> 0
			d = c
			c = b
			b = a
			a = (t1 + t2) >>> 0
		}

		H[0] = (H[0] + a) >>> 0
		H[1] = (H[1] + b) >>> 0
		H[2] = (H[2] + c) >>> 0
		H[3] = (H[3] + d) >>> 0
		H[4] = (H[4] + e) >>> 0
		H[5] = (H[5] + f) >>> 0
		H[6] = (H[6] + g) >>> 0
		H[7] = (H[7] + h) >>> 0
	}

	return [...H].map((x) => x.toString(16).padStart(8, '0')).join('')
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
			authorizationControllerDidCompleteWithAuthorization(_controller: any, authorization: any) {
				const finish = activeFinish
				activeFinish = null
				finish?.({ status: 'success', credential: toCredential(authorization.credential) })
			},
			authorizationControllerDidCompleteWithError(_controller: any, error: any) {
				const finish = activeFinish
				activeFinish = null
				finish?.(
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
let activeFinish: ((result: SignInResult) => void) | null = null

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

		if (activeController) {
			return { status: 'error', message: 'a Sign in with Apple flow is already active' }
		}

		return new Promise<SignInResult>((resolve) => {
			const finish = (result: SignInResult) => {
				activeController = null
				activeDelegate = null
				activeAnchor = null
				activeFinish = null
				resolve(result)
			}

			ensureClasses()
			activeDelegate = AppleAuthDelegate.new()
			activeFinish = finish
			const provider = ASAuthorizationAppleIDProvider.new()
			const request = provider.createRequest()
			if (options?.scopes?.length) {
				request.requestedScopes = options.scopes.map((s) => SCOPE_MAP[s]?.()).filter(Boolean)
			}

			if (options?.nonce !== undefined) {
				request.nonce = sha256Hex(options.nonce)
			}

			activeAnchor = AppleAuthAnchor.new()
			activeController = ASAuthorizationController.alloc().initWithAuthorizationRequests([request])
			activeController.delegate = activeDelegate
			activeController.presentationContextProvider = activeAnchor
			activeController.performRequests()
		})
	},
	async getCredentialState(userId: string): Promise<AppleCredentialState> {
		if (!frameworkAvailable()) {
			return 'unknown'
		}

		return new Promise<AppleCredentialState>((resolve) => {
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
									: 'notFound',
					)
				},
			)
		})
	},
}
