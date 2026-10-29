/** Reads a host-injected global (the AppKit bridge, platform probe objects)
 *  without declaring ambient vars for them. The canonical `__xplatAppKit`
 *  declaration lives in macos-renderer/host-globals.d.ts; this package's own
 *  typecheck can't see it, and redeclaring the same `var` with a different
 *  shape would conflict in programs that load both. One dynamic lookup keeps
 *  the probe honest: the member may be absent, so callers use optional
 *  access. */
export function hostGlobal<T = any>(name: string): T | undefined {
	return (globalThis as Record<string, unknown>)[name] as T | undefined
}

/** The AppKit bridge published by the macOS host — `undefined` elsewhere. */
export function appKitHost(): Record<string, any> | undefined {
	return hostGlobal('__xplatAppKit')
}
