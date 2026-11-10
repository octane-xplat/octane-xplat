import { hostGlobal } from '../internal/platform/host-bridge'
import {
  createMouseGestureAdapter,
  type HostGestureBridge,
  type HostGestureSurface,
} from './input.host'
import type { ActivationEvent, CancelReason, Point } from './types'
import type { InputFrame } from './owner'

interface WindowsRuntime {
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
  readonly host: number
  readonly root: number
}
interface LocalPoint extends Point {
  readonly width: number
  readonly height: number
}
interface ContactFrame extends Omit<InputFrame, 'hitPath' | 'cancelReason' | 'type'> {
  readonly type: InputFrame['type'] | 'double'
  readonly cancelReason: CancelReason | null
  readonly identity: string
  readonly path: readonly number[]
}
interface WindowRecord {
  readonly identity: object
  readonly hosts: Map<number, object>
  readonly listeners: Set<(frame: InputFrame, identity: string) => void>
  subscription: { readonly token: unknown } | null
}
const roots = new Map<number, WindowRecord>()
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
function isView(value: object): value is WindowsView {
  return (
    'nativeViewProtected' in value &&
    typeof value.nativeViewProtected === 'object' &&
    value.nativeViewProtected !== null
  )
}
function surface(host: object): HostGestureSurface {
  if (!isView(host) || host.isLoaded === false) {
    throw new Error('Windows gestures require a loaded NativeScript view')
  }
  const native = host.nativeViewProtected
  // The pinned managed bridge owns these JSON schemas; no native event objects escape a callback.
  const description: Description = JSON.parse(String(call(bridgeType, 'Describe', [native])))
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
      String(call(bridgeType, 'Local', [native, point.x, point.y, description.root])),
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
          call(bridgeType, 'Local', [
            parent.nativeViewProtected,
            point.x,
            point.y,
            description.root,
          ]),
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
    claim: () => call(bridgeType, 'Claim', [native]) === true,
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
          current.subscription = { token: call(bridgeType, 'Observe', [native, observer]) }
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
  OnPointerReleased(args: object): void
  OnKeyDown(args: object): void
  OnKeyUp(args: object): void
}
interface NativeActionConstructor {
  new (): WindowsActionPeer
}
interface WindowsControls {
  UI: {
    Xaml: {
      Controls: { Button: NativeActionConstructor; HyperlinkButton: NativeActionConstructor }
    }
  }
}
const actionConstructors = new Map<'Button' | 'HyperlinkButton', NativeActionConstructor>()
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

export function createWindowsActionControl(kind: 'Button' | 'HyperlinkButton'): WindowsActionPeer {
  let Constructor = actionConstructors.get(kind)
  if (!Constructor) {
    const Base = hostGlobal<WindowsControls>('Microsoft')?.UI.Xaml.Controls[kind]
    if (!Base) {
      throw new Error('Windows native action class unavailable')
    }
    // beta.24 composes JS WinRT subclasses through its managed bridge. The
    // returned native projection preserves Core's event subscription contract.
    Constructor = class ActivationPeer extends Base {
      OnPointerReleased(args: object): void {
        withOrigin(this, 'pointer', () => super.OnPointerReleased(args))
      }
      OnKeyDown(args: object): void {
        withOrigin(this, 'keyboard', () => super.OnKeyDown(args))
      }
      OnKeyUp(args: object): void {
        withOrigin(this, 'keyboard', () => super.OnKeyUp(args))
      }
    }
    actionConstructors.set(kind, Constructor)
  }
  return new Constructor()
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
    if (event === 'click') {
      click()
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
