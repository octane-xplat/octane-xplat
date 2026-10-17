import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
// Object.assign can't touch globals installed by @nativescript/macos-node-api
// (imported transitively via @octane-xplat/platform/macos) — they land as
// configurable, get-only properties. defineProperty with a value descriptor
// replaces them; restore() puts the original descriptors back.
export function mockGlobals(entries: Record<string, unknown>) {
	const originals = Object.fromEntries(
		Object.keys(entries).map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]),
	)

	for (const [key, value] of Object.entries(entries)) {
		const descriptor = originals[key]
		if (descriptor && !descriptor.configurable && !descriptor.writable) {
			// A few bridge globals (NativeClass, objc) are locked by the runtime —
			// mocks can't replace them; the real values are usable anyway.
			continue
		}

		Object.defineProperty(globalThis, key, { value, writable: true, configurable: true })
	}

	return function restore() {
		for (const [key, descriptor] of Object.entries(originals)) {
			if (descriptor) {
				if (!descriptor.configurable && !descriptor.writable) {
					continue
				}

				Object.defineProperty(globalThis, key, descriptor)
			} else {
				delete (globalThis as any)[key]
			}
		}
	}
}

// vm-eval tests splice source files into script contexts — the platform
// imports added for module-scoped native types aren't valid in script eval,
// and the sandbox injects those names as globals anyway. Strip them.
export function sourceWithoutImports(url: URL) {
	return stripTypeScriptTypes(readFileSync(url, 'utf8')).replace(
		/^import\b[\s\S]*?(?:from\s*)?['"][^'"]*['"];?\s*\n/gm,
		'',
	)
}
