import { TextView, type ViewBase } from '@nativescript/core'
import type { NativeScriptHostBoundary } from '@octane-xplat/nativescript-octane'
import { NSScrollView, NSView } from '@octane-xplat/platform/macos'
import { appKitFormattedText } from './nativescript-formatted-text.macos'

const coreOwners = new WeakMap<object, ViewBase>()
interface LogicalInstance {
  readonly id: number
  readonly type: string
  readonly view: null
  readonly children: readonly object[]
  readonly parent: object | null
}

const logicalInstances = new WeakMap<ViewBase, LogicalInstance>()
const logicalTypes = new Set([
  'formattedstring',
  'proxyviewcontainer',
  'segmentedbaritem',
  'span',
  'tabviewitem',
])

function nativeHandle(view: ViewBase): NSView | undefined {
  const native = view.nativeViewProtected
  if (view instanceof TextView && native instanceof NSScrollView) {
    const editor = native.documentView
    if (editor instanceof NSView) {
      return editor
    }
  }
  return native instanceof NSView ? native : undefined
}

export const appKitHostBoundary: NativeScriptHostBoundary = {
  formattedText: appKitFormattedText,

  publicInstance(node) {
    const { view, type, id } = node
    if (!view) {
      return null
    }
    if (logicalTypes.has(type)) {
      let instance = logicalInstances.get(view)
      if (!instance) {
        instance = {
          id,
          type,
          view: null,
          get children() {
            return node.children.flatMap((child) => appKitHostBoundary.publicInstance(child) ?? [])
          },
          get parent() {
            return node.parentNode === null
              ? null
              : appKitHostBoundary.publicInstance(node.parentNode)
          },
        }
        logicalInstances.set(view, instance)
        coreOwners.set(instance, view)
      }
      return instance
    }

    const native = nativeHandle(view)
    if (native) {
      coreOwners.set(native, view)
      const wrapper = view.nativeViewProtected
      if (wrapper instanceof NSView && wrapper !== native) {
        coreOwners.set(wrapper, view)
      }
    }
    return native ?? null
  },

  eventData(data, instance, view) {
    if (!instance || instance === view || data.object !== view) {
      return data
    }
    const descriptors: PropertyDescriptorMap = Object.getOwnPropertyDescriptors(data)
    const fields = Reflect.get(data, 'view') === view ? ['object', 'view'] : ['object']
    for (const field of fields) {
      const original = descriptors[field]
      descriptors[field] = {
        value: instance,
        writable: original?.writable ?? true,
        enumerable: original?.enumerable ?? true,
        configurable: original?.configurable ?? true,
      }
    }
    return Object.defineProperties(Object.create(Object.getPrototypeOf(data)), descriptors)
  },

  emitProgrammaticChange(type, property) {
    return type === 'searchbar' && property === 'text'
  },

  coreView(target) {
    const owner = coreOwners.get(target)
    if (
      owner &&
      (logicalInstances.get(owner) === target ||
        owner.nativeViewProtected === target ||
        nativeHandle(owner) === target)
    ) {
      return owner
    }
    coreOwners.delete(target)
  },
}
