import '@nativescript/macos-node-api'
import {
	_Block_copy,
	_Block_release,
	AVAuthorizationStatus,
	AVCaptureDevice,
	AVMediaTypeAudio,
	AVMediaTypeVideo,
	interop,
	NSBundle,
	NSData,
	NSDataWritingOptions,
	NSDate,
	NSError,
	NSFileHandle,
	NSFileManager,
	NSMethodSignature,
	NSMutableDictionary,
	NSNumber,
	NSObject,
	NSOpenPanel,
	NSRunLoop,
	NSDefaultRunLoopMode,
	NSSavePanel,
	NSSearchPathDirectory,
	NSSearchPathDomainMask,
	NSString,
	NSModalResponseOK,
	NSURL,
	NSURLComponents,
	NSURLResponse,
	NSURLRequest,
	NSUUID,
	NSWindow,
	NSAutoresizingMaskOptions,
	NSInvocation,
	SecItemAdd,
	SecItemCopyMatching,
	SecItemDelete,
	SecItemUpdate,
	UNAuthorizationOptions,
	UNAuthorizationStatus,
	UNMutableNotificationContent,
	UNNotificationRequest,
	UNUserNotificationCenter,
	UTType,
	WKNavigationActionPolicy,
	WKNavigationDelegate,
	WKScriptMessageHandler,
	WKUIDelegate,
	WKURLSchemeHandler,
	WKURLSchemeTask,
	WKUserContentController,
	WKUserScript,
	WKUserScriptInjectionTime,
	WKWebView,
	WKWebViewConfiguration,
} from '@octane-xplat/platform/macos'

export interface MacOSWebView {
	load(address: string): boolean
	loadPackaged(path: string): boolean
	setBootstrap(serialized: string): boolean
	setWindowContext(id: string, data: string): boolean
	owningWindow(): NSWindow | null
	installDispatcher(dispatch: (message: string) => void): void
	deliver(message: string): void
	pickFile(accept: string, startingFolder: string | null): { name: string; uri: string } | null
	readFileText(uri: string): string | null
	writeFileText(name: string, text: string): { name: string; uri: string } | null
	notificationPermission(): 'granted' | 'denied' | 'unsupported'
	requestNotificationPermission(): boolean
	notify(title: string, body: string): boolean
	secureStorageGet(key: string): string | null
	secureStorageSet(key: string, value: string): boolean
	secureStorageRemove(key: string): boolean
	/** The app-private recordings directory URL (file://…), created on demand. */
	movieDirectory(): string | null
	/** Validate a movie destination before capture; returns the file URL to use. */
	reserveMoviePath(options: { fileUrl?: string; container?: string }): { fileUrl: string } | null
	/** Commit recorded movie bytes atomically; never overwrites. */
	writeMovieFile(options: { fileUrl: string; base64: string }): { name: string; uri: string } | null
	/** Append a staged movie chunk; `final` moves it into place atomically and
	 *  returns the file ref — keeps large recordings off the single-payload path. */
	writeMovieFileChunk(options: {
		fileUrl: string
		base64: string
		final?: boolean
	}): { name: string; uri: string } | { ok: boolean } | null
	movieFileInfo(uri: string): { exists: boolean; fileUrl?: string; size?: number } | null
	/** Read a stored movie back as base64. */
	readMovieFile(uri: string): string | null
	/** Read a byte range of a stored movie as base64. */
	readMovieFileChunk(options: { fileUrl: string; offset: number; length: number }): string | null
	deleteMovieFile(uri: string): boolean
	/** macOS privacy status for 'camera' or 'microphone'; 'undeclared' when the
	 *  app's Info.plist lacks the usage description. */
	mediaPermissionStatus(kind: 'camera' | 'microphone'): string
	requestMediaPermission(kind: 'camera' | 'microphone'): string
	dispose(): void
}

type TrustedOrigin = { scheme: string; host: string; port: number | null }

interface ChannelState {
	dispatch?: (body: string) => void
	trustedOrigin?: TrustedOrigin
	disposed: boolean
	stagedMovies: Map<string, NSURL>
}

// The bridge can hand back a different JS wrapper for the same native
// receiver on a later callback, so channel state is keyed by the WKWebView —
// an object this host creates and holds, whose wrapper identity is stable.
const states = new WeakMap<object, ChannelState>()

const isMainFrame = (frame: unknown): boolean => {
	const member = (frame as { isMainFrame?: unknown } | null | undefined)?.isMainFrame
	return typeof member === 'function' ? Boolean((member as () => boolean).call(frame)) : Boolean(member)
}

const originParts = (origin: unknown): TrustedOrigin | null => {
	const value = origin as { protocol?: unknown; host?: unknown; port?: unknown } | null | undefined
	if (value == null || value.protocol == null || value.host == null) {
		return null
	}
	return {
		scheme: String(value.protocol),
		host: String(value.host),
		port: value.port == null ? null : Number(value.port),
	}
}

const trusted = (origin: TrustedOrigin | null, allowed: TrustedOrigin | undefined): boolean =>
	origin != null &&
	allowed != null &&
	origin.scheme === allowed.scheme &&
	origin.host === allowed.host &&
	(allowed.port == null || origin.port === allowed.port)

// WebKit completion blocks arrive either as callable FunctionPointers (a
// metadata-signature path) or as opaque CallbackObjects (exposedMethods `id`).
// The FunctionPointer invoke path dies with the delegate frame, so async
// decisions go through a retained _Block_copy invoked via NSInvocation.
const blockPointer = (handler: unknown): unknown =>
	(handler as { __ns_native_ptr?: unknown })?.__ns_native_ptr ?? handler

const callBlock = (block: unknown, argEncoding: string, ...args: interop.Reference[]): void => {
	const signature = NSMethodSignature.signatureWithObjCTypes('v@:' + argEncoding)
	const invocation = NSInvocation.invocationWithMethodSignature(signature)
	invocation.selector = 'invoke'
	for (let i = 0; i < args.length; i++) {
		invocation.setArgumentAtIndex(args[i], i + 2)
	}
	invocation.invokeWithTarget(block)
}

const blockArg = (type: number, value: unknown): interop.Reference => {
	const ref = new interop.Reference(type)
	;(ref as { value: unknown }).value = value
	return ref
}

/** Deliver a WKPermissionDecision (NSInteger) to a signature-less handler. */
const decidePermission = (handler: unknown, decision: number): void => {
	if (typeof handler === 'function') {
		;(handler as (value: number) => void)(decision)
		return
	}
	callBlock(blockPointer(handler), 'q', blockArg(interop.types.int64, decision))
}

const copyBlock = (handler: unknown): interop.Pointer | null => {
	const ptr = blockPointer(handler)
	return ptr === handler ? null : _Block_copy(ptr as interop.PointerConvertible)
}

let ChannelClass: { alloc(): { init(): NSObject } } | undefined

function channelClass(): { alloc(): { init(): NSObject } } {
	ChannelClass ??= NSObject.extend(
		{
			userContentControllerDidReceiveScriptMessage(
				_userContentController: unknown,
				message: {
					webView: object
					body: unknown
					frameInfo: { securityOrigin?: unknown }
				},
			): void {
				const state = states.get(message.webView)
				if (
					state == null ||
					state.disposed ||
					!isMainFrame(message.frameInfo) ||
					typeof message.body !== 'string' ||
					!trusted(originParts(message.frameInfo?.securityOrigin), state.trustedOrigin)
				) {
					return
				}
				state.dispatch?.(message.body)
			},

			webViewDecidePolicyForNavigationActionDecisionHandler(
				webView: object,
				action: {
					targetFrame?: unknown
					request?: {
						URL?: { scheme?: unknown; host?: unknown; port?: unknown } | null
					} | null
				},
				decisionHandler: (policy: number) => void,
			): void {
				const state = states.get(webView)
				const url = action?.request?.URL
				const origin =
					url == null
						? null
						: {
								scheme: String(url.scheme ?? ''),
								host: String(url.host ?? ''),
								port: url.port == null ? null : Number(url.port),
							}
				const allow =
					state != null &&
					!state.disposed &&
					isMainFrame(action?.targetFrame) &&
					trusted(origin, state.trustedOrigin)
				decisionHandler(
					allow ? WKNavigationActionPolicy.Allow : WKNavigationActionPolicy.Cancel,
				)
			},
		},
		{
			name: 'XplatWebViewChannel',
			protocols: [WKScriptMessageHandler, WKNavigationDelegate],
		},
	)
	return ChannelClass as { alloc(): { init(): NSObject } }
}

const mediaUsageKey = (mediaType: string): string =>
	mediaType === AVMediaTypeAudio ? 'NSMicrophoneUsageDescription' : 'NSCameraUsageDescription'

// A missing usage description makes the request prompt fail or terminate the
// process — report denial instead of touching AVFoundation.
const mediaDeclared = (mediaType: string): boolean =>
	NSBundle.mainBundle.objectForInfoDictionaryKey(mediaUsageKey(mediaType)) != null

const mediaStatusName = (mediaType: string): string => {
	switch (Number(AVCaptureDevice.authorizationStatusForMediaType(mediaType))) {
		case AVAuthorizationStatus.Authorized:
			return 'granted'
		case AVAuthorizationStatus.Denied:
			return 'denied'
		case AVAuthorizationStatus.Restricted:
			return 'restricted'
		case AVAuthorizationStatus.NotDetermined:
			return 'notDetermined'
		default:
			return 'unknown'
	}
}

const runLoopSpin = (seconds: number): void => {
	NSRunLoop.currentRunLoop.runModeBeforeDate(
		NSDefaultRunLoopMode,
		NSDate.dateWithTimeIntervalSinceNow(seconds),
	)
}

// requestAccess's completion block lands on an arbitrary queue, where the
// bridge cannot deliver a JS callback — a nil handler is accepted, so the
// request is polled through the run loop the way the Swift spin did.
const requestMediaTypeAccess = (mediaType: string, deadlineSeconds: number | null): void => {
	AVCaptureDevice.requestAccessForMediaTypeCompletionHandler(mediaType, null)
	const deadline = deadlineSeconds == null ? null : Date.now() + deadlineSeconds * 1000
	while (
		Number(AVCaptureDevice.authorizationStatusForMediaType(mediaType)) ===
		AVAuthorizationStatus.NotDetermined
	) {
		if (deadline != null && Date.now() >= deadline) {
			return
		}
		runLoopSpin(0.01)
	}
}

/** Sequential per-type access, mirroring the removed requestMediaAccess. */
const requestMediaAccess = (mediaTypes: string[]): boolean => {
	let grantedAll = true
	for (const mediaType of mediaTypes) {
		if (!mediaDeclared(mediaType)) {
			grantedAll = false
			continue
		}
		switch (Number(AVCaptureDevice.authorizationStatusForMediaType(mediaType))) {
			case AVAuthorizationStatus.Authorized:
				continue
			case AVAuthorizationStatus.NotDetermined: {
				requestMediaTypeAccess(mediaType, null)
				if (
					Number(AVCaptureDevice.authorizationStatusForMediaType(mediaType)) !==
					AVAuthorizationStatus.Authorized
				) {
					grantedAll = false
				}
				continue
			}
			default:
				grantedAll = false
		}
	}
	return grantedAll
}

let UIDelegateClass: { alloc(): { init(): NSObject } } | undefined

function uiDelegateClass(): { alloc(): { init(): NSObject } } {
	UIDelegateClass ??= NSObject.extend(
		{
			// Media capture is granted only to the app's own trusted origin and
			// only when the host app holds the matching macOS privacy permission.
			webViewRequestMediaCapturePermissionForOriginInitiatedByFrameTypeDecisionHandler(
				webView: object,
				origin: unknown,
				frame: { securityOrigin?: unknown },
				type: number,
				decisionHandler: unknown,
			): void {
				const state = states.get(webView)
				const deny = () => decidePermission(decisionHandler, WKPermissionDecisionDeny)
				if (
					state == null ||
					state.disposed ||
					!trusted(originParts(origin), state.trustedOrigin) ||
					!trusted(originParts(frame?.securityOrigin), state.trustedOrigin)
				) {
					deny()
					return
				}

				// The handler is one-shot but async — retain the block past this
				// delegate frame and release it once the decision is delivered.
				const kept = copyBlock(decisionHandler)
				const mediaTypes =
					Number(type) === 1
						? [AVMediaTypeAudio]
						: Number(type) === 2
							? [AVMediaTypeVideo, AVMediaTypeAudio]
							: [AVMediaTypeVideo]
				try {
					const granted = requestMediaAccess(mediaTypes)
					decidePermission(
						decisionHandler,
						granted ? WKPermissionDecisionGrant : WKPermissionDecisionDeny,
					)
				} finally {
					if (kept != null) _Block_release(kept)
				}
			},
		},
		{
			name: 'XplatWebViewUIDelegate',
			protocols: [WKUIDelegate],
			exposedMethods: {
				// Absent from the generated runtime metadata, so the signature is
				// declared explicitly; the decision handler arrives as an opaque
				// block and is invoked through NSInvocation.
				'webView:requestMediaCapturePermissionForOrigin:initiatedByFrame:type:decisionHandler:': {
					params: [WKWebView, NSObject, NSObject, interop.types.int64, interop.types.id],
					returns: interop.types.void,
				},
			},
		},
	)
	return UIDelegateClass as { alloc(): { init(): NSObject } }
}

const WKPermissionDecisionGrant = 1
const WKPermissionDecisionDeny = 2

const mimeTypes: Record<string, string> = {
	html: 'text/html',
	js: 'application/javascript',
	mjs: 'application/javascript',
	css: 'text/css',
	json: 'application/json',
	map: 'application/json',
	svg: 'image/svg+xml',
	png: 'image/png',
	jpg: 'image/jpeg',
	jpeg: 'image/jpeg',
	webp: 'image/webp',
	gif: 'image/gif',
	ico: 'image/x-icon',
	woff: 'font/woff',
	woff2: 'font/woff2',
	ttf: 'font/ttf',
	wasm: 'application/wasm',
}

const bundleRoot = (): NSURL | null => {
	const resources = NSBundle.mainBundle.resourceURL
	if (resources == null) {
		return null
	}
	return resources.URLByAppendingPathComponentIsDirectory('web', true).URLByStandardizingPath
}

const schemeError = (task: WKURLSchemeTask, code: number): void => {
	task.didFailWithError(NSErrorFor('XplatWebView', code))
}

const NSErrorFor = (domain: string, code: number): NSError =>
	NSError.errorWithDomainCodeUserInfo(domain, code, null)

let SchemeHandlerClass: { alloc(): { init(): NSObject } } | undefined

function schemeHandlerClass(): { alloc(): { init(): NSObject } } {
	SchemeHandlerClass ??= NSObject.extend(
		{
			webViewStartURLSchemeTask(_webView: object, task: WKURLSchemeTask): void {
				// The concrete WKURLSchemeTaskImpl wraps as NSObject (class-cluster
				// gap) — repoint at the bridged protocol surface, same workaround
				// as the host's WebSocket task shim.
				if (task.request == null) {
					Object.setPrototypeOf(task, WKURLSchemeTask.prototype)
				}
				serveSchemeTask(task as WKURLSchemeTask)
			},
			webViewStopURLSchemeTask(_webView: object, _task: unknown): void {},
		},
		{ name: 'XplatBundleSchemeHandler', protocols: [WKURLSchemeHandler] },
	)
	return SchemeHandlerClass as { alloc(): { init(): NSObject } }
}

function serveSchemeTask(task: WKURLSchemeTask): void {
	const url = task.request?.URL
	const components = url == null ? null : NSURLComponents.componentsWithURLResolvingAgainstBaseURL(url, false)
	const encoded = components?.percentEncodedPath
	const root = bundleRoot()
	if (
		url == null ||
		components == null ||
		String(components.scheme) !== 'xplat' ||
		String(components.host) !== 'app' ||
		encoded == null ||
		root == null
	) {
		schemeError(task, 400)
		return
	}

		// percentEncodedPath bridges as a JS string; a malformed escape fails the
	// decode like removingPercentEncoding returning nil did.
	let decoded: string
	try {
		decoded = decodeURIComponent(String(encoded))
	} catch {
		schemeError(task, 400)
		return
	}
	const relativePath = decoded === '/' ? 'index.html' : decoded.slice(1)
	const requested = root.URLByAppendingPathComponent(relativePath).URLByStandardizingPath
	if (!String(requested.path).startsWith(String(root.path) + '/')) {
		schemeError(task, 403)
		return
	}

	const exists = (path: NSURL) =>
		NSFileManager.defaultManager.fileExistsAtPath(String(path.path))
	const file = exists(requested)
		? requested
		: String(NSURL.fileURLWithPath(relativePath).pathExtension) === ''
			? root.URLByAppendingPathComponent('index.html')
			: requested
	const resolvedRoot = String(root.URLByResolvingSymlinksInPath.path)
	const resolvedFile = file.URLByResolvingSymlinksInPath
	if (
		!String(resolvedFile.path).startsWith(resolvedRoot + '/') ||
		!exists(resolvedFile)
	) {
		schemeError(task, 404)
		return
	}

	const data = NSData.dataWithContentsOfURL(resolvedFile)
	if (data == null) {
		schemeError(task, 404)
		return
	}

	const mimeType = mimeTypes[String(resolvedFile.pathExtension).toLowerCase()] ?? 'application/octet-stream'
	const encoding =
		mimeType.startsWith('text/') || mimeType === 'application/javascript' ? 'utf-8' : null
	task.didReceiveResponse(
		NSURLResponse.alloc().initWithURLMIMETypeExpectedContentLengthTextEncodingName(
			url,
			mimeType,
			data.length,
			encoding,
		),
	)
	task.didReceiveData(data)
	task.didFinish()
}

const fileURL = (value: string): NSURL => {
	const url = NSURL.URLWithString(value)
	return url != null && url.isFileURL ? url : NSURL.fileURLWithPath(value)
}

const fileRef = (url: NSURL): { name: string; uri: string } => ({
	name: String(url.lastPathComponent),
	uri: String(url.absoluteString),
})

const jsonLiteral = (value: unknown): string | null => JSON.stringify(value) ?? null

const transportScript = `(() => {
	const listeners = new Set();
	Object.defineProperty(window, '__xplatHostTransport', {
		value: {
			receive(message) { for (const listener of listeners) listener(message); },
			listen(listener) {
				listeners.add(listener);
				return () => listeners.delete(listener);
			}
		},
		configurable: false
	});
})();`

const keychainKeys = {
	class: 'class',
	genericPassword: 'genp',
	service: 'svce',
	account: 'acct',
	valueData: 'v_Data',
	returnData: 'r_Data',
	matchLimit: 'm_Limit',
	matchLimitOne: 'm_One',
	accessible: 'pdmn',
	afterFirstUnlock: 'ck',
} as const

/** Attach the system WKWebView to an app-owned AppKit content view. */
export function createMacOSWebView(parent: object): MacOSWebView {
	const configuration = WKWebViewConfiguration.new()
	const controller = WKUserContentController.new()
	controller.addUserScript(
		WKUserScript.alloc().initWithSourceInjectionTimeForMainFrameOnly(
			transportScript,
			WKUserScriptInjectionTime.Start,
			true,
		),
	)
	configuration.userContentController = controller
	const schemeHandler = schemeHandlerClass().alloc().init()
	configuration.setURLSchemeHandlerForURLScheme(schemeHandler, 'xplat')
	const webView = WKWebView.alloc().initWithFrameConfiguration(
		{ origin: { x: 0, y: 0 }, size: { width: 0, height: 0 } },
		configuration,
	)
	const channel = channelClass().alloc().init()
	const uiDelegate = uiDelegateClass().alloc().init()
	controller.addScriptMessageHandlerName(channel, 'xplat')
	webView.navigationDelegate = channel as unknown as WKNavigationDelegate
	webView.UIDelegate = uiDelegate as unknown as WKUIDelegate
	webView.autoresizingMask =
		NSAutoresizingMaskOptions.WidthSizable | NSAutoresizingMaskOptions.HeightSizable
	;(webView as unknown as { frame: unknown }).frame = (
		parent as { bounds: unknown }
	).bounds
	;(parent as { addSubview(view: unknown): void }).addSubview(webView)

	const state: ChannelState = { disposed: false, stagedMovies: new Map() }
	states.set(webView, state)

	const keychainService = String(NSBundle.mainBundle.bundleIdentifier ?? 'org.octane.xplat')
	const keychainQuery = (key: string): NSMutableDictionary => {
		const query = NSMutableDictionary.new()
		query.setObjectForKey(keychainKeys.genericPassword, keychainKeys.class)
		query.setObjectForKey(keychainService, keychainKeys.service)
		query.setObjectForKey(key, keychainKeys.account)
		return query
	}

	const appPrivateRoot = (): NSURL | null => {
		const urls = NSFileManager.defaultManager.URLsForDirectoryInDomains(
			NSSearchPathDirectory.ApplicationSupport,
			NSSearchPathDomainMask.UserDomain,
		)
		const base = urls?.count ? urls.objectAtIndex(0) : null
		if (base == null) {
			return null
		}
		return base.URLByAppendingPathComponentIsDirectory(keychainService, true)
	}

	const movieDirectoryURL = (): NSURL | null => {
		const root = appPrivateRoot()
		if (root == null) {
			return null
		}
		const directory = root.URLByAppendingPathComponentIsDirectory('octane-camera', true)
		const ok = NSFileManager.defaultManager.createDirectoryAtURLWithIntermediateDirectoriesAttributesError(
			directory,
			true,
			null,
		)
		return ok ? directory : null
	}

	const moviePathInsidePrivateRoot = (fileUrl: NSURL): NSURL | null => {
		const root = appPrivateRoot()?.URLByStandardizingPath
		if (root == null) {
			return null
		}
		const candidate = fileUrl.URLByStandardizingPath
		return String(candidate.path).startsWith(String(root.path) + '/') ? candidate : null
	}

	const discardStagedMovie = (target: NSURL): void => {
		const staged = state.stagedMovies.get(String(target.absoluteString))
		if (staged == null) {
			return
		}
		state.stagedMovies.delete(String(target.absoluteString))
		try {
			NSFileManager.defaultManager.removeItemAtURLError(staged)
		} catch {}
	}

	const waitForResult = <T>(operation: (done: (value: T) => void) => void): T | null => {
		let result: T | null = null
		let finished = false
		operation((value) => {
			result = value
			finished = true
		})
		const deadline = Date.now() + 5000
		while (!finished && Date.now() < deadline) {
			runLoopSpin(0.01)
		}
		return result
	}

	let disposed = false
	const live = () => !disposed && !state.disposed

	return {
		load(address) {
			if (!live()) {
				return false
			}
			const url = NSURL.URLWithString(address)
			if (
				url == null ||
				url.user != null ||
				url.password != null ||
				String(url.scheme ?? '') !== 'http' ||
				!['127.0.0.1', 'localhost'].includes(String(url.host ?? '')) ||
				url.port == null
			) {
				return false
			}

			state.trustedOrigin = {
				scheme: 'http',
				host: String(url.host),
				port: Number(url.port),
			}
			webView.loadRequest(NSURLRequest.requestWithURL(url))
			return true
		},
		loadPackaged(path) {
			if (!live()) {
				return false
			}
			const raw = !path || path === '/' ? 'index.html' : path.replace(/^\/+/, '')
			const components = NSURLComponents.componentsWithString('xplat://app/' + raw)
			const root = bundleRoot()
			if (
				components == null ||
				String(components.scheme) !== 'xplat' ||
				String(components.host) !== 'app' ||
				components.URL == null ||
				root == null ||
				!NSFileManager.defaultManager.fileExistsAtPath(
					String(root.URLByAppendingPathComponent('index.html').path),
				)
			) {
				return false
			}

			state.trustedOrigin = { scheme: 'xplat', host: 'app', port: null }
			webView.loadRequest(NSURLRequest.requestWithURL(components.URL))
			return true
		},
		setBootstrap(serialized) {
			if (!live()) {
				return false
			}
			let value: unknown
			try {
				value = JSON.parse(serialized)
			} catch {
				return false
			}
			// Match JSONSerialization.isValidJSONObject: top level must be an
			// array or object, and the content must round-trip.
			if (typeof value !== 'object' || value === null) {
				return false
			}
			const json = jsonLiteral(value)
			if (json == null) {
				return false
			}
			controller.addUserScript(
				WKUserScript.alloc().initWithSourceInjectionTimeForMainFrameOnly(
					`Object.defineProperty(window, '__xplatHostSnapshot', { value: ${json}, configurable: false });`,
					WKUserScriptInjectionTime.Start,
					true,
				),
			)
			return true
		},
		setWindowContext(id, data) {
			if (!live() || typeof id !== 'string' || typeof data !== 'string') {
				return false
			}
			const encodedId = jsonLiteral(id)
			if (encodedId == null) {
				return false
			}
			let value: unknown
			try {
				value = JSON.parse(data)
			} catch {
				return false
			}
			const normalized = jsonLiteral(value)
			if (normalized == null) {
				return false
			}
			controller.addUserScript(
				WKUserScript.alloc().initWithSourceInjectionTimeForMainFrameOnly(
					`window.__xplatWindowId = ${encodedId};\nwindow.__xplatWindowData = ${normalized};`,
					WKUserScriptInjectionTime.Start,
					true,
				),
			)
			return true
		},
		owningWindow() {
			return live() ? (webView.window as NSWindow | null) : null
		},
		installDispatcher(dispatch) {
			if (!live()) {
				throw new Error('macOS webview is disposed')
			}
			state.dispatch = dispatch
		},
		deliver(message) {
			if (!live()) {
				return
			}
			const array = JSON.stringify([String(message)])
			const literal = array.slice(1, -1)
			webView.evaluateJavaScriptCompletionHandler(
				`window.__xplatHostTransport?.receive(${literal})`,
				null,
			)
		},
		pickFile(accept, startingFolder) {
			if (!live()) {
				return null
			}
			const panel = NSOpenPanel.openPanel()
			panel.allowsMultipleSelection = false
			panel.canChooseDirectories = false
			const types = String(accept ?? '*/*')
				.split(',')
				.map((item) => item.trim())
				.map((item) => {
					if (item.startsWith('.')) {
						return UTType.typeWithFilenameExtension(item.slice(1))
					}
					if (item.includes('/') && item !== '*/*') {
						return UTType.typeWithMIMEType(item)
					}
					return null
				})
				.filter((type) => type != null)
			if (types.length) {
				panel.allowedContentTypes = types
			}
			if (startingFolder) {
				panel.directoryURL = NSURL.fileURLWithPath(startingFolder)
			}
			if (panel.runModal() !== NSModalResponseOK || panel.URL == null) {
				return null
			}
			return fileRef(panel.URL)
		},
		readFileText(uri) {
			if (!live()) {
				return null
			}
			const data = NSData.dataWithContentsOfURL(fileURL(uri))
			const text = data == null ? null : NSString.alloc().initWithDataEncoding(data, 4)
			return text == null ? null : String(text)
		},
		writeFileText(name, text) {
			if (!live()) {
				return null
			}
			const panel = NSSavePanel.savePanel()
			panel.nameFieldStringValue = name || 'untitled.txt'
			if (panel.runModal() !== NSModalResponseOK || panel.URL == null) {
				return null
			}
			const written = NSString.stringWithString(text).writeToURLAtomicallyEncodingError(
				panel.URL,
				true,
				4,
			)
			return written ? fileRef(panel.URL) : null
		},
		notificationPermission() {
			if (!live()) {
				return 'unsupported'
			}
			const status = waitForResult<number | null>((done) =>
				UNUserNotificationCenter.currentNotificationCenter().getNotificationSettingsWithCompletionHandler(
					(settings) => done(settings == null ? null : Number(settings.authorizationStatus)),
				),
			)
			switch (status) {
				case UNAuthorizationStatus.Authorized:
				case UNAuthorizationStatus.Provisional:
				case UNAuthorizationStatus.Ephemeral:
					return 'granted'
				case UNAuthorizationStatus.Denied:
					return 'denied'
				default:
					return 'unsupported'
			}
		},
		requestNotificationPermission() {
			if (!live()) {
				return false
			}
			const current = this.notificationPermission()
			if (current === 'granted') {
				return true
			}
			if (current === 'denied') {
				return false
			}
			return (
				waitForResult<boolean>((done) =>
					UNUserNotificationCenter.currentNotificationCenter().requestAuthorizationWithOptionsCompletionHandler(
						UNAuthorizationOptions.Alert | UNAuthorizationOptions.Sound,
						(granted, error) => done(Boolean(granted) && error == null),
					),
				) ?? false
			)
		},
		notify(title, body) {
			if (!live() || !this.requestNotificationPermission()) {
				return false
			}
			const content = UNMutableNotificationContent.new()
			content.title = title ?? ''
			content.body = body ?? ''
			const request = UNNotificationRequest.requestWithIdentifierContentTrigger(
				NSUUID.UUID().UUIDString,
				content,
				null,
			)
			return (
				waitForResult<boolean>((done) =>
					UNUserNotificationCenter.currentNotificationCenter().addNotificationRequestWithCompletionHandler(
						request,
						(error) => done(error == null),
					),
				) ?? false
			)
		},
		secureStorageGet(key) {
			if (!live()) {
				return null
			}
			const query = keychainQuery(key)
			query.setObjectForKey(NSNumber.numberWithBool(true), keychainKeys.returnData)
			query.setObjectForKey(keychainKeys.matchLimitOne, keychainKeys.matchLimit)
			const out = new interop.Reference(interop.types.id)
			if (Number(SecItemCopyMatching(query, out)) !== 0 || out.value == null) {
				return null
			}
			const text = NSString.alloc().initWithDataEncoding(out.value, 4)
			return text == null ? null : String(text)
		},
		secureStorageSet(key, value) {
			if (!live()) {
				return false
			}
			const data = NSString.stringWithString(value).dataUsingEncoding(4)
			const update = NSMutableDictionary.new()
			update.setObjectForKey(data, keychainKeys.valueData)
			const status = Number(SecItemUpdate(keychainQuery(key), update))
			if (status === 0) {
				return true
			}
			if (status !== -25300) {
				return false
			}
			const query = keychainQuery(key)
			query.setObjectForKey(data, keychainKeys.valueData)
			query.setObjectForKey(keychainKeys.afterFirstUnlock, keychainKeys.accessible)
			return Number(SecItemAdd(query, null)) === 0
		},
		secureStorageRemove(key) {
			if (!live()) {
				return false
			}
			const status = Number(SecItemDelete(keychainQuery(key)))
			return status === 0 || status === -25300
		},
		movieDirectory() {
			if (!live()) {
				return null
			}
			const directory = movieDirectoryURL()
			return directory == null ? null : String(directory.absoluteString)
		},
		reserveMoviePath(options) {
			if (!live()) {
				return null
			}
			const requested = options?.fileUrl
			if (requested) {
				const url = NSURL.URLWithString(requested)
				const target = url != null && url.isFileURL ? moviePathInsidePrivateRoot(url) : null
				if (target == null) {
					return null
				}
				const parent = target.URLByDeletingLastPathComponent
				if (
					NSFileManager.defaultManager.fileExistsAtPath(String(target.path)) ||
					!NSFileManager.defaultManager.fileExistsAtPath(String(parent.path))
				) {
					return null
				}
				return { fileUrl: String(target.absoluteString) }
			}

			const directory = movieDirectoryURL()
			if (directory == null) {
				return null
			}
			const suffix = String(options?.container ?? '').toLowerCase()
			const ext = ['mp4', 'mov', 'webm'].includes(suffix) ? suffix : 'mp4'
			const name = `clip-${Math.floor(Date.now())}-${NSUUID.UUID().UUIDString.slice(0, 8)}.${ext}`
			return { fileUrl: String(directory.URLByAppendingPathComponent(name).absoluteString) }
		},
		writeMovieFile(options) {
			if (!live()) {
				return null
			}
			const url = options?.fileUrl ? NSURL.URLWithString(options.fileUrl) : null
			const target = url != null && url.isFileURL ? moviePathInsidePrivateRoot(url) : null
			const data = options?.base64
				? NSData.alloc().initWithBase64EncodedStringOptions(options.base64, 0)
				: null
			if (
				target == null ||
				data == null ||
				NSFileManager.defaultManager.fileExistsAtPath(String(target.path))
			) {
				return null
			}
			const written = data.writeToURLOptionsError(target, NSDataWritingOptions.DataWritingAtomic)
			return written ? fileRef(target) : null
		},
		writeMovieFileChunk(options) {
			const chunkLimit = 4 * 1024 * 1024
			if (!live()) {
				return null
			}
			const url = options?.fileUrl ? NSURL.URLWithString(options.fileUrl) : null
			const target = url != null && url.isFileURL ? moviePathInsidePrivateRoot(url) : null
			if (target == null) {
				return null
			}
			const key = String(target.absoluteString)
			const base64 = options?.base64
			const data =
				typeof base64 === 'string' && base64.length <= ((chunkLimit + 2) / 3) * 4
					? NSData.alloc().initWithBase64EncodedStringOptions(base64, 0)
					: null
			if (
				data == null ||
				data.length > chunkLimit ||
				NSFileManager.defaultManager.fileExistsAtPath(String(target.path))
			) {
				discardStagedMovie(target)
				return null
			}

			try {
				let staged = state.stagedMovies.get(key)
				if (staged != null) {
					const handle = NSFileHandle.fileHandleForWritingToURLError(staged)
					if (handle == null) {
						throw new Error('staged movie open failed')
					}
					try {
						handle.seekToEndOfFile()
						handle.writeData(data)
					} finally {
						handle.closeFile()
					}
				} else {
					staged = target.URLByAppendingPathExtension(`${NSUUID.UUID().UUIDString}.part`)
					const ok = data.writeToURLOptionsError(staged, NSDataWritingOptions.DataWritingWithoutOverwriting)
					if (!ok) {
						throw new Error('staged movie write failed')
					}
					state.stagedMovies.set(key, staged)
				}

				if (options?.final !== true) {
					return { ok: true }
				}

				NSFileManager.defaultManager.moveItemAtURLToURLError(staged, target)
				state.stagedMovies.delete(key)
				return fileRef(target)
			} catch {
				discardStagedMovie(target)
				return null
			}
		},
		movieFileInfo(uri) {
			if (!live()) {
				return null
			}
			const url = NSURL.URLWithString(uri)
			const target = url != null && url.isFileURL ? moviePathInsidePrivateRoot(url) : null
			if (target == null) {
				return null
			}
			if (!NSFileManager.defaultManager.fileExistsAtPath(String(target.path))) {
				return { exists: false }
			}
			const attributes = NSFileManager.defaultManager.attributesOfItemAtPathError(
				String(target.path),
			)
			const size = attributes?.objectForKey('NSFileSize')
			return {
				exists: true,
				fileUrl: String(target.absoluteString),
				size: size == null ? -1 : Number(size),
			}
		},
		readMovieFile(uri) {
			if (!live()) {
				return null
			}
			const url = NSURL.URLWithString(uri)
			const target = url != null && url.isFileURL ? moviePathInsidePrivateRoot(url) : null
			const data = target == null ? null : NSData.dataWithContentsOfURL(target)
			return data == null ? null : String(data.base64EncodedStringWithOptions(0))
		},
		readMovieFileChunk(options) {
			const chunkLimit = 4 * 1024 * 1024
			if (!live()) {
				return null
			}
			const url = options?.fileUrl ? NSURL.URLWithString(options.fileUrl) : null
			const target = url != null && url.isFileURL ? moviePathInsidePrivateRoot(url) : null
			if (target == null) {
				return null
			}
			const handle = NSFileHandle.fileHandleForReadingFromURLError(target)
			if (handle == null) {
				return null
			}
			try {
				const { offset, length } = options ?? {}
				if (
					typeof offset !== 'number' ||
					typeof length !== 'number' ||
					!Number.isFinite(offset) ||
					!Number.isFinite(length) ||
					offset < 0 ||
					offset >= Number.MAX_SAFE_INTEGER ||
					Math.floor(offset) !== offset ||
					length <= 0 ||
					length > chunkLimit ||
					Math.floor(length) !== length
				) {
					return null
				}
				handle.seekToFileOffset(offset)
				const chunk = handle.readDataUpToLengthError(length)
				return chunk == null ? null : String(chunk.base64EncodedStringWithOptions(0))
			} finally {
				try {
					handle.closeFile()
				} catch {}
			}
		},
		deleteMovieFile(uri) {
			if (!live()) {
				return false
			}
			const url = NSURL.URLWithString(uri)
			const target = url != null && url.isFileURL ? moviePathInsidePrivateRoot(url) : null
			if (target == null) {
				return false
			}
			discardStagedMovie(target)
			if (!NSFileManager.defaultManager.fileExistsAtPath(String(target.path))) {
				return true
			}
			try {
				NSFileManager.defaultManager.removeItemAtURLError(target)
				return true
			} catch {
				return false
			}
		},
		mediaPermissionStatus(kind) {
			if (!live()) {
				return 'unavailable'
			}
			const mediaType = kind === 'microphone' ? AVMediaTypeAudio : AVMediaTypeVideo
			return mediaDeclared(mediaType) ? mediaStatusName(mediaType) : 'undeclared'
		},
		requestMediaPermission(kind) {
			if (!live()) {
				return 'unavailable'
			}
			const mediaType = kind === 'microphone' ? AVMediaTypeAudio : AVMediaTypeVideo
			if (!mediaDeclared(mediaType)) {
				return 'undeclared'
			}
			if (mediaStatusName(mediaType) !== 'notDetermined') {
				return mediaStatusName(mediaType)
			}

			// A system privacy prompt can sit unanswered — give the person time
			// to respond instead of failing the request early.
			requestMediaTypeAccess(mediaType, 120)
			return mediaStatusName(mediaType) === 'notDetermined' ? 'unknown' : mediaStatusName(mediaType)
		},
		dispose() {
			if (disposed) {
				return
			}
			disposed = true
			state.disposed = true
			for (const target of [...state.stagedMovies.keys()]) {
				const url = NSURL.URLWithString(target)
				if (url != null) {
					discardStagedMovie(url)
				}
			}
			state.dispatch = undefined
			webView.stopLoading()
			webView.navigationDelegate = null as unknown as WKNavigationDelegate
			webView.UIDelegate = null as unknown as WKUIDelegate
			controller.removeScriptMessageHandlerForName('xplat')
			webView.removeFromSuperview()
			states.delete(webView)
		},
	}
}
