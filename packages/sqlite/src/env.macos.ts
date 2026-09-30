/**
 * Host-environment shims for the AppKit/JSC macOS runtime. The host ships a
 * deliberately small surface (see packages/cli/src/macos/jsc-host/shim.js) —
 * no TextDecoder/TextEncoder, crypto, URLSearchParams, or console.debug, and
 * its process proxy throws on keys it doesn't know (which trips Emscripten's
 * ENVIRONMENT_IS_NODE probe).
 *
 * This module MUST be imported before '@sqlite.org/sqlite-wasm' so the
 * Emscripten module body sees the shims. Only db.macos.ts imports it.
 */

const host = globalThis as any

// Foundation-backed UTF-8 codecs. Passing a wasm-memory-backed Uint8Array to
// initWithBytesLength wedges the bridge, so decode copies the view out of the
// heap first — cheap enough for the string sizes sqlite traffic carries.
if (typeof host.TextDecoder !== 'function') {
	host.TextDecoder = class TextDecoder {
		decode(input?: ArrayBufferView | ArrayBuffer): string {
			if (!input) {
				return ''
			}

			const src =
				input instanceof Uint8Array
					? input
					: new Uint8Array(
							(input as ArrayBufferView).buffer ?? input,
							(input as ArrayBufferView).byteOffset ?? 0,
							(input as ArrayBufferView).byteLength,
						)

			const copy = src.slice()
			const data = host.NSData.alloc().initWithBytesLength(copy, copy.length)
			const string = host.NSString.alloc().initWithDataEncoding(data, 4)

			return string == null ? '' : String(string)
		}
	}
}

if (typeof host.TextEncoder !== 'function') {
	host.TextEncoder = class TextEncoder {
		encode(input = ''): Uint8Array {
			const data = host.NSString.stringWithString(String(input)).dataUsingEncoding(4)
			return new Uint8Array(host.interop.bufferFromData(data))
		}
	}
}

if (typeof host.crypto?.getRandomValues !== 'function') {
	host.crypto = {
		getRandomValues(view: Uint8Array) {
			for (let i = 0; i < view.length; i++) {
				view[i] = (Math.random() * 256) | 0
			}

			return view
		},
	}
}

// sqlite3InitModuleState only probes has()/get() for debug flags.
if (typeof host.URLSearchParams !== 'function') {
	host.URLSearchParams = class URLSearchParams {
		has() {
			return false
		}
		get() {
			return null
		}
	}
}

if (typeof host.console === 'object' && host.console) {
	if (typeof host.console.debug !== 'function') {
		host.console.debug = host.console.log.bind(host.console)
	}

	if (typeof host.console.trace !== 'function') {
		host.console.trace = host.console.log.bind(host.console)
	}
}

// Wrap the shim's throwing process proxy so property probes (versions.node)
// answer undefined instead of throwing; unknown keys still delegate.
if (typeof host.process === 'object' && host.process) {
	const original = host.process
	const passthrough: Record<string, unknown> = { versions: {} }

	for (const key of ['env', 'cwd'] as const) {
		try {
			passthrough[key] = original[key]
		} catch {}
	}

	host.process = new Proxy(passthrough, {
		get(target, key) {
			if (key in target) {
				return target[key as string]
			}

			return original[key]
		},
	})
}
