import { builtinName, requireNode } from './registry.js'

type RequireHook = (name: string, directory?: string) => unknown
type Host = typeof globalThis & {
  __nativeRequire?: unknown
  __requireOverride?: RequireHook
}

/** Install the hook on a NativeScript host exposing __nativeRequire. No globals are installed. */
export function installNode(): void {
  const host: Host = globalThis

  if (installed.has(host)) {
    return
  }

  if (typeof host.__nativeRequire !== 'function') {
    throw new Error(
      'This host has no NativeScript require hook; use bundled imports or requireNode()',
    )
  }

  const previous = host.__requireOverride

  host.__requireOverride = (name, directory) =>
    builtinName(name) === undefined ? previous?.(name, directory) : requireNode(name)

  installed.add(host)
}

const installed = new WeakSet<object>()
