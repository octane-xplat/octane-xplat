import { TextView, type ViewBase } from '@nativescript/core'
import type { NativeScriptHostBoundary } from '@octane-xplat/nativescript-octane'
import { NSScrollView, NSView } from '@octane-xplat/platform/macos'

const coreOwners = new WeakMap<object, ViewBase>()
const logicalInstances = new WeakMap<ViewBase, { id: number; type: string; view: null }>()
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
  publicInstance(view, type, id) {
    if (logicalTypes.has(type)) {
      let instance = logicalInstances.get(view)
      if (!instance) {
        instance = { id, type, view: null }
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
