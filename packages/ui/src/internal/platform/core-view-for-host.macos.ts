import { hostGlobal } from './host-bridge'

/** Framework bindings use Core behind the public AppKit refs. */
export function coreViewForHost(host: object | null): object | null
export function coreViewForHost(host: unknown): unknown
export function coreViewForHost(host: unknown): unknown {
  if (!host || typeof host !== 'object') {
    return host
  }
  const bridge = hostGlobal<{ coreViewForHost?: (handle: object) => object | undefined }>('__xplatAppKit')
  return bridge?.coreViewForHost?.(host) ?? host
}
