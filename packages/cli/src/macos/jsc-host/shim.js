// Small, explicit host API for the packaged CommonJS entry.
globalThis.console = {
	log: (...args) => __hostLog(...args),
	warn: (...args) => __hostLog(...args),
	error: (...args) =>
		__hostLog(...args.map((value) => (value instanceof Error ? value.stack : value))),
}

globalThis.process = new Proxy(
	{
		env: new Proxy(
			{},
			{ get: (_target, key) => (typeof key === 'string' ? __hostEnv(key) : undefined) },
		),
		cwd: () => __hostCwd(),
	},
	{
		get(target, key) {
			if (key in target) {
				return target[key]
			}

			throw Error(`Unsupported macOS host API: process.${String(key)}`)
		},
	},
)

Object.defineProperty(globalThis, 'Buffer', {
	configurable: true,
	value: {
		from(value, encoding) {
			if (encoding !== 'base64') {
				throw Error(`unsupported Buffer encoding: ${encoding}`)
			}

			return NSData.alloc().initWithBase64EncodedStringOptions(value, 0)
		},
	},
})

// Octane action operation identities use the standard host UUID capability.
// Foundation owns secure UUID generation; preserve a future native provider.
globalThis.crypto ??= {}
if (typeof globalThis.crypto.randomUUID !== 'function') {
	globalThis.crypto.randomUUID = () => String(NSUUID.UUID().UUIDString).toLowerCase()
}

const fileManager = NSFileManager.defaultManager
const nodeModules = {
	'node:crypto': {
		createHash(algorithm) {
			if (algorithm !== 'sha256') {
				throw Error(`unsupported hash: ${algorithm}`)
			}

			let bytes
			return {
				update(data) {
					bytes = new Uint8Array(interop.bufferFromData(data))
					return this
				},
				digest(encoding) {
					if (encoding !== 'hex' || !bytes) {
						throw Error(`unsupported digest: ${encoding}`)
					}

					const output = new Uint8Array(32)
					CC_SHA256(bytes, bytes.length, output)
					return Array.from(output, (value) => value.toString(16).padStart(2, '0')).join('')
				},
			}
		},
	},
	'node:fs': {
		mkdirSync(path) {
			if (
				!fileManager.createDirectoryAtPathWithIntermediateDirectoriesAttributesError(
					path,
					true,
					null,
					null,
				)
			) {
				throw Error(`mkdir failed: ${path}`)
			}
		},
		existsSync(path) {
			return fileManager.fileExistsAtPath(path)
		},
		readFileSync(path, encoding) {
			const data = NSData.dataWithContentsOfFile(path)
			if (!data) {
				throw Error(`read failed: ${path}`)
			}

			if (encoding === undefined) {
				return data
			}

			if (encoding === 'utf8') {
				return String(NSString.alloc().initWithDataEncoding(data, 4))
			}

			throw Error(`Unsupported macOS host API: fs.readFileSync encoding ${encoding}`)
		},
		writeFileSync(path, value) {
			const bytes =
				typeof value === 'string' ? NSString.stringWithString(value).dataUsingEncoding(4) : value

			if (!bytes.writeToFileAtomically(path, true)) {
				throw Error(`write failed: ${path}`)
			}
		},
	},
	'node:os': { homedir: () => NSHomeDirectory() },
	'node:path': {
		join: (...parts) => normalizePath(parts.join('/')),
		resolve: (...parts) => {
			let path = ''
			for (const part of [process.cwd(), ...parts]) {
				path = part.startsWith('/') ? part : `${path}/${part}`
			}

			return normalizePath(path)
		},
	},
}

function normalizePath(path) {
	const absolute = path.startsWith('/')
	const parts = []
	for (const part of path.split('/')) {
		if (!part || part === '.') {
			continue
		}

		if (part === '..') {
			if (parts.length && parts.at(-1) !== '..') {
				parts.pop()
			} else if (!absolute) {
				parts.push(part)
			}
		} else {
			parts.push(part)
		}
	}

	return `${absolute ? '/' : ''}${parts.join('/')}` || '.'
}

for (const [name, methods] of Object.entries(nodeModules)) {
	nodeModules[name] = new Proxy(methods, {
		get(target, key) {
			if (key in target) {
				return target[key]
			}

			throw Error(`Unsupported macOS host API: ${name}.${String(key)}`)
		},
	})
}

globalThis.require = (name) => {
	if (name === '@nativescript/macos-node-api') {
		return __nativeExports
	}

	if (Object.hasOwn(globalThis.__xplatDevModules ?? {}, name)) {
		return globalThis.__xplatDevModules[name]
	}

	if (name in nodeModules) {
		return nodeModules[name]
	}

	throw Error(`unsupported require: ${name}`)
}

globalThis.setTimeout = __setTimeout
globalThis.clearTimeout = __clearTimer
globalThis.setInterval = __setInterval
globalThis.clearInterval = __clearTimer
globalThis.queueMicrotask = (callback) => Promise.resolve().then(callback)
globalThis.performance = { now: () => __hostNow() }

// Standard WebSocket over NSURLSessionWebSocketTask. The task's metadata is
// bridged, so the host can offer the same global web/iOS runtimes provide
// instead of pushing a socket polyfill into every app.
try {
	class XplatWebSocketDelegate extends NSObject {
		URLSessionWebSocketTaskDidOpenWithProtocol(_session, _task, protocol) {
			this.socket?._open(protocol ? String(protocol) : '')
		}
		URLSessionWebSocketTaskDidCloseWithCodeReason(_session, _task, code, reason) {
			const text = reason ? String(NSString.alloc().initWithDataEncoding(reason, 4)) : ''
			this.socket?._close(Number(code), text, true)
		}
		URLSessionTaskDidCompleteWithError(_session, _task, error) {
			if (error) {
				this.socket?._fail(String(error.localizedDescription ?? error))
			}
		}
	}
	XplatWebSocketDelegate.ObjCProtocols = [NSURLSessionWebSocketDelegate]
	// The host registers only enumerable prototype methods on native subclasses.
	for (const key of Object.getOwnPropertyNames(XplatWebSocketDelegate.prototype)) {
		if (key === 'constructor') {
			continue
		}
		Object.defineProperty(XplatWebSocketDelegate.prototype, key, {
			...Object.getOwnPropertyDescriptor(XplatWebSocketDelegate.prototype, key),
			enumerable: true,
		})
	}
	NativeClass(XplatWebSocketDelegate)

	class WebSocket {
		static CONNECTING = 0
		static OPEN = 1
		static CLOSING = 2
		static CLOSED = 3

		CONNECTING = 0
		OPEN = 1
		CLOSING = 2
		CLOSED = 3

		constructor(url, protocols) {
			const parsed = NSURL.URLWithString(String(url))
			const scheme = parsed?.scheme ? String(parsed.scheme) : ''
			if (!parsed || (scheme !== 'ws' && scheme !== 'wss')) {
				throw Error(`SyntaxError: Failed to construct 'WebSocket': The URL '${url}' is invalid.`)
			}
			const subs =
				protocols === undefined
					? []
					: typeof protocols === 'string'
						? [protocols]
						: Array.from(protocols, String)
			if (new Set(subs).size !== subs.length) {
				throw Error("SyntaxError: Failed to construct 'WebSocket': duplicate subprotocol.")
			}

			this.url = String(url)
			this.protocol = ''
			this.extensions = ''
			this.binaryType = 'arraybuffer'
			this.bufferedAmount = 0
			this.readyState = WebSocket.CONNECTING
			this.onopen = null
			this.onmessage = null
			this.onerror = null
			this.onclose = null
			this._listeners = new Map()
			this._task = null
			this._session = null

			const delegate = XplatWebSocketDelegate.new()
			delegate.socket = this
			const session = NSURLSession.sessionWithConfigurationDelegateDelegateQueue(
				NSURLSessionConfiguration.defaultSessionConfiguration,
				delegate,
				NSOperationQueue.mainQueue,
			)
			const task = subs.length
				? session.webSocketTaskWithURLProtocols(parsed, subs)
				: session.webSocketTaskWithURL(parsed)
			// Upstream class-cluster gap: the concrete __NSURLSessionWebSocketTask
			// is private, so the bridge wraps the task as NSURLSessionTask. Re-point
			// the wrapper at the bridged public prototype to reach the ws methods.
			if (typeof task.receiveMessageWithCompletionHandler !== 'function') {
				Object.setPrototypeOf(task, NSURLSessionWebSocketTask.prototype)
			}
			this._session = session
			this._task = task
			this._delegate = delegate
			task.resume()
			this._pump()
		}

		addEventListener(type, listener) {
			if (typeof listener !== 'function') {
				return
			}
			const listeners = this._listeners.get(type) ?? []
			listeners.push(listener)
			this._listeners.set(type, listeners)
		}

		removeEventListener(type, listener) {
			const listeners = this._listeners.get(type)
			if (!listeners) {
				return
			}
			const index = listeners.indexOf(listener)
			if (index >= 0) {
				listeners.splice(index, 1)
			}
		}

		dispatchEvent(event) {
			event.target ??= this
			event.currentTarget ??= this
			this[`on${event.type}`]?.call(this, event)
			for (const listener of this._listeners.get(event.type) ?? []) {
				listener.call(this, event)
			}
			return true
		}

		send(data) {
			if (this.readyState === WebSocket.CONNECTING) {
				throw Error(
					"InvalidStateError: Failed to execute 'send' on 'WebSocket': Still in CONNECTING state.",
				)
			}
			if (this.readyState !== WebSocket.OPEN) {
				return
			}

			let message
			let size
			if (typeof data === 'string') {
				message = NSURLSessionWebSocketMessage.alloc().initWithString(data)
				size = NSString.stringWithString(data).dataUsingEncoding(4).length
			} else if (data instanceof ArrayBuffer || ArrayBuffer.isView(data)) {
				const bytes =
					data instanceof ArrayBuffer
						? new Uint8Array(data)
						: new Uint8Array(data.buffer, data.byteOffset, data.byteLength)
				message = NSURLSessionWebSocketMessage.alloc().initWithData(
					NSData.dataWithBytesLength(bytes, bytes.length),
				)
				size = bytes.length
			} else {
				message = NSURLSessionWebSocketMessage.alloc().initWithString(String(data))
				size = String(data).length
			}

			this.bufferedAmount += size
			this._task.sendMessageCompletionHandler(message, (error) => {
				this.bufferedAmount = Math.max(0, this.bufferedAmount - size)
				if (error) {
					this._fail(String(error.localizedDescription ?? error))
				}
			})
		}

		close(code = 1000, reason = '') {
			if (code !== 1000 && (code < 3000 || code > 4999)) {
				throw Error(
					`InvalidAccessError: Failed to execute 'close' on 'WebSocket': The close code must be 1000 or in the range 3000-4999.`,
				)
			}
			const reasonData = NSString.stringWithString(reason).dataUsingEncoding(4)
			if (reasonData.length > 123) {
				throw Error(
					`SyntaxError: Failed to execute 'close' on 'WebSocket': The close reason must be 123 bytes of UTF-8 or fewer.`,
				)
			}
			if (this.readyState >= WebSocket.CLOSING) {
				return
			}
			this.readyState = WebSocket.CLOSING
			this._task.cancelWithCloseCodeReason(code, reasonData)
		}

		_pump() {
			this._task.receiveMessageWithCompletionHandler((message, error) => {
				if (this.readyState >= WebSocket.CLOSING) {
					return
				}
				if (error || !message) {
					this._fail(error ? String(error.localizedDescription ?? error) : 'connection closed')
					return
				}
				const data =
					message.type === NSURLSessionWebSocketMessageType.String
						? String(message.string)
						: interop.bufferFromData(message.data)
				this.dispatchEvent({ type: 'message', data })
				this._pump()
			})
		}

		_open(protocol) {
			if (this.readyState !== WebSocket.CONNECTING) {
				return
			}
			this.readyState = WebSocket.OPEN
			this.protocol = protocol
			this.dispatchEvent({ type: 'open' })
		}

		_fail(message) {
			if (this.readyState === WebSocket.CLOSED) {
				return
			}
			// A peer close can surface as a transport error on the outstanding
			// receive before didCloseWithCode fires; the task still records the
			// negotiated close code, so report a clean close instead of an error.
			const code = Number(this._task?.closeCode ?? 0)
			if (code !== 0) {
				const data = this._task.closeReason
				const reason = data ? String(NSString.alloc().initWithDataEncoding(data, 4)) : ''
				this._close(code, reason, code !== 1006)
				return
			}
			if (this.readyState !== WebSocket.CLOSING) {
				this.dispatchEvent({ type: 'error', message })
			}
			this._close(this.readyState === WebSocket.CLOSING ? 1000 : 1006, '', false)
		}

		_close(code, reason, wasClean) {
			if (this.readyState === WebSocket.CLOSED) {
				return
			}
			this.readyState = WebSocket.CLOSED
			this._session?.invalidateAndCancel()
			this.dispatchEvent({ type: 'close', code, reason, wasClean })
		}
	}

	globalThis.WebSocket ??= WebSocket
} catch (error) {
	console.warn(`[xplat-host] WebSocket unavailable: ${error?.stack ?? error}`)
}
