import { hostGlobal } from '../internal/platform/host-bridge'
import {
  createMouseGestureAdapter,
  type HostGestureBridge,
  type HostGestureSurface,
} from './input.host'

import type { ActivationEvent, CancelReason, Point } from './types'
import type { InputFrame } from './owner'

interface WindowsRuntime {
  interop?: { pointerKey(value: object): string | null }
  dotnet: {
    invoke(assembly: string, type: string, method: string, args: readonly unknown[]): unknown
    asDelegate(type: string, callback: (frame: string) => void): object
  }
}

interface WindowsView {
  readonly nativeViewProtected: object
  readonly parent?: WindowsView | null
  readonly isLoaded?: boolean
}

interface Description {
  readonly host: string
  readonly root: string
}

interface LocalPoint extends Point {
  readonly width: number
  readonly height: number
}

interface ContactFrame extends Omit<InputFrame, 'hitPath' | 'cancelReason' | 'type'> {
  readonly type: InputFrame['type'] | 'double'
  readonly cancelReason: CancelReason | null
  readonly identity: string
  readonly path: readonly string[]
}

interface WindowRecord {
  readonly identity: object
  readonly hosts: Map<string, object>
  readonly listeners: Set<(frame: InputFrame, identity: string) => void>
  subscription: { readonly token: unknown } | null
}

const roots = new Map<string, WindowRecord>()
type ActivationObserver = (source: ActivationEvent['source'], kind?: 'double') => void
const activations = new WeakMap<object, Set<ActivationObserver>>()
const bridgeType = 'OctaneXplat.Input.GestureInput'
function runtime(): WindowsRuntime {
  const value = hostGlobal<WindowsRuntime>('NSWinRT')

  if (!value?.dotnet?.invoke || !value.dotnet.asDelegate) {
    throw new Error('Unsupported Windows gesture attachment: managed input bridge unavailable')
  }

  return value
}

function call(type: string, method: string, args: readonly unknown[]): unknown {
  return runtime().dotnet.invoke('', type, method, args)
}

function nativeCall(
  method: 'Describe' | 'Local' | 'Observe' | 'Claim',
  native: object,
  args: readonly unknown[] = [],
): unknown {
  // Managed peers already carry a bridge handle. Raw WinRT views use the
  // runtime's supported pointer key, not guessed fields or wrapper strings.
  let value: object | string = native

  if (typeof Reflect.get(native, '__handle') !== 'number') {
    const key = runtime().interop?.pointerKey(native)

    if (typeof key !== 'string' || !/^0x[0-9a-f]+$/i.test(key)) {
      throw new Error('Windows gesture input requires native pointer-key projection')
    }

    value = key
  }

  return call(bridgeType, method, [value, ...args])
}

function isView(value: object): value is WindowsView {
  return (
    'nativeViewProtected' in value &&
    typeof value.nativeViewProtected === 'object' &&
    value.nativeViewProtected !== null
  )
}

/** WinRT proxies must be queried for XamlRoot directly; probing mobile
 * member names through `in` does not establish their availability. */
export function windowsInputReady(host: object): boolean {
  return (
    isView(host) &&
    host.isLoaded !== false &&
    Reflect.get(host.nativeViewProtected, 'XamlRoot') != null
  )
}

function surface(host: object): HostGestureSurface {
  if (!isView(host) || host.isLoaded === false) {
    throw new Error('Windows gestures require a loaded NativeScript view')
  }

  const native = host.nativeViewProtected
  // The pinned managed bridge owns these JSON schemas; no native event objects escape a callback.
  const description: Description = JSON.parse(String(nativeCall('Describe', native)))
  let root = roots.get(description.root)

  if (!root) {
    root = { identity: {}, hosts: new Map(), listeners: new Set(), subscription: null }
    roots.set(description.root, root)
  }

  const current = root
  const local = (point: Point): LocalPoint | null => {
    if (host.isLoaded === false || host.nativeViewProtected !== native) {
      return null
    }

    const location: LocalPoint | null = JSON.parse(
      String(nativeCall('Local', native, [point.x, point.y, description.root])),
    )

    return location
  }

  return {
    root: current.identity,
    host,
    local,
    parentLocal(point) {
      const parent = host.parent

      if (!parent) {
        return point
      }

      const result: LocalPoint | null = JSON.parse(
        String(
          nativeCall('Local', parent.nativeViewProtected, [point.x, point.y, description.root]),
        ),
      )

      return result
    },
    containsPoint(point) {
      const p = local(point)

      return Boolean(p && p.x >= 0 && p.y >= 0 && p.x <= p.width && p.y <= p.height)
    },
    containsHost(other) {
      if (!isView(other)) {
        return false
      }

      for (let node: WindowsView | null | undefined = other; node; node = node.parent) {
        if (node === host) {
          return true
        }
      }

      return false
    },
    claim: () => nativeCall('Claim', native) === true,
    observe(deliver) {
      current.hosts.set(description.host, host)
      current.listeners.add(deliver)

      const detach = () => {
        current.listeners.delete(deliver)
        current.hosts.delete(description.host)
        if (!current.listeners.size) {
          roots.delete(description.root)
        }
      }

      try {
        if (!current.subscription) {
          const observer = runtime().dotnet.asDelegate(
            'OctaneXplat.Input.ContactObserver',
            (json) => {
              const frame: ContactFrame = JSON.parse(json)

              if (frame.type === 'double') {
                for (const id of frame.path) {
                  const target = current.hosts.get(id)

                  if (target) {
                    dispatchWindowsActivation(target, 'pointer', 'double')
                  }
                }

                return
              }

              // All host listeners feed the same owner. Cross the managed bridge
              // and parse each native frame once, independent of button count.
              current.listeners
                .values()
                .next()
                .value?.(
                  {
                    ...frame,
                    type: frame.type,
                    cancelReason: frame.cancelReason ?? undefined,
                    hitPath: frame.path.flatMap((id) => {
                      const target = current.hosts.get(id)

                      return target ? [target] : []
                    }),
                  },
                  frame.identity,
                )
            },
          )

          current.subscription = { token: nativeCall('Observe', native, [observer]) }
        }
      } catch (error) {
        detach()
        throw error
      }

      let alive = true

      return () => {
        if (!alive) {
          return
        }

        alive = false
        detach()
        if (!current.listeners.size && current.subscription) {
          const subscription = current.subscription

          current.subscription = null
          call(bridgeType, 'Release', [subscription.token])
        }
      }
    },
  }
}

const bridge: HostGestureBridge = {
  gestureSurface: surface,
  observeGestureActivation(host, notify) {
    let observers = activations.get(host)

    if (!observers) {
      observers = new Set()
      activations.set(host, observers)
    }

    const current = observers

    current.add(notify)
    return () => {
      current.delete(notify)
      if (!current.size) {
        activations.delete(host)
      }
    }
  },
}

const adapter = createMouseGestureAdapter('Windows', () => bridge, {
  frame: (callback) => scheduleWindowsGesture(callback, 16),
  delay: scheduleWindowsGesture,
  error(error) {
    Promise.resolve().then(() => {
      throw error
    })
  },
})

export const attachWindowsGesture = adapter.gesture
export const attachWindowsScope = adapter.scope
export const attachWindowsPress = adapter.press
export function dispatchWindowsActivation(
  host: object,
  source: ActivationEvent['source'],
  kind?: 'double',
): void {
  for (const observer of [...(activations.get(host) ?? [])]) {
    if (activations.get(host)?.has(observer)) {
      observer(source, kind)
    }
  }
}

export interface WindowsActionPeer {
  MinWidth: number
  MinHeight: number
  Template: unknown
}

const origins = new WeakMap<object, ActivationEvent['source']>()
function withOrigin(peer: object, source: ActivationEvent['source'], action: () => void): void {
  const previous = origins.get(peer)

  origins.set(peer, source)
  try {
    action()
  } finally {
    if (previous) {
      origins.set(peer, previous)
    } else {
      origins.delete(peer)
    }
  }
}

function isActionPeer(value: unknown): value is WindowsActionPeer {
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof Reflect.get(value, 'MinWidth') === 'number' &&
    typeof Reflect.get(value, 'MinHeight') === 'number'
  )
}

export function createWindowsActionControl(kind: 'Button' | 'HyperlinkButton'): WindowsActionPeer {
  const peer = call(bridgeType, 'CreateAction', [kind])

  if (!isActionPeer(peer)) {
    throw new Error('Windows native action factory did not return a control')
  }

  return peer
}

export function windowsActivationSource(native: object): ActivationEvent['source'] {
  return origins.get(native) ?? 'virtual'
}

/** Typed native events avoid dynamic-subclass event-property projection gaps. */
export function observeWindowsActionControl(
  native: object,
  click: () => void,
  layout: () => void,
): () => void {
  let alive = true
  const callback = runtime().dotnet.asDelegate('OctaneXplat.Input.ContactObserver', (event) => {
    if (!alive) {
      return
    }

    if (event === 'click:pointer' || event === 'click:keyboard' || event === 'click:virtual') {
      const source =
        event === 'click:pointer' ? 'pointer' : event === 'click:keyboard' ? 'keyboard' : 'virtual'

      withOrigin(native, source, click)
    } else if (event === 'layout') {
      layout()
    }
  })

  const token = call(bridgeType, 'ObserveAction', [native, callback])

  return () => {
    if (!alive) {
      return
    }

    alive = false
    call(bridgeType, 'ReleaseAction', [token])
  }
}

export function scheduleWindowsGesture(callback: () => void, milliseconds: number): () => void {
  let alive = true
  const notify = runtime().dotnet.asDelegate('OctaneXplat.Input.ContactObserver', () => {
    if (!alive) {
      return
    }

    alive = false
    callback()
  })

  const token = call(bridgeType, 'Schedule', [milliseconds, notify])

  return () => {
    if (!alive) {
      return
    }

    alive = false
    call(bridgeType, 'CancelTimer', [token])
  }
}
