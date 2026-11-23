/** NativeScript already supplies a Core view to its component bindings. */
export function coreViewForHost(host: object | null): object | null
export function coreViewForHost(host: unknown): unknown
export function coreViewForHost(host: unknown): unknown {
  return host
}
