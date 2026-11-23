import { ListView, SegmentedBar, TabView, TabViewItem, TextView, type ViewBase } from '@nativescript/core'
import type { NativeScriptHostBoundary, NativeScriptTextNode } from '@octane-xplat/nativescript-octane'
import { NSScrollView, NSView } from '@octane-xplat/platform/macos'
import { appKitFormattedText } from './nativescript-formatted-text.macos'

const coreOwners = new WeakMap<object, ViewBase>()
interface LogicalInstance {
  readonly id: number
  readonly type: string
  readonly view: null
  readonly children: readonly object[]
  readonly parent: object | null
  readonly props: Readonly<Record<string, unknown>>
}

const logicalInstances = new WeakMap<ViewBase, LogicalInstance>()
const parentInstances = new WeakMap<NativeScriptTextNode, { readonly view: object | null }>()
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
  tabItems: {
    release(view) {
      Reflect.get(view, '_releaseTabItem').call(view)
    },
  },

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
            const parent = node.parentNode
            if (parent === null || logicalTypes.has(parent.type)) {
              return parent === null ? null : appKitHostBoundary.publicInstance(parent)
            }
            let instance = parentInstances.get(parent)
            if (instance === undefined) {
              instance = {
                get view() {
                  return appKitHostBoundary.publicInstance(parent)
                },
              }
              parentInstances.set(parent, instance)
            }
            return instance
          },
          get props() {
            return node.props
          },
        }
        if (view instanceof TabViewItem) {
          Object.defineProperties(instance, {
            tabNativeItem: { get: () => Reflect.get(view, 'macos') },
            contentRoot: {
              get: () => null,
              set: () => {
                throw new TypeError('AppKit tabviewitem content root cannot be reassigned')
              },
            },
          })
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
    if (
      view instanceof ListView &&
      (data.eventName === 'itemLoading' || data.eventName === 'itemTap')
    ) {
      const nativeCell = Reflect.get(data, 'appKitCell')
      if (nativeCell instanceof NSView) {
        descriptors.view = { value: nativeCell, enumerable: true, writable: false }
      }
      delete descriptors.appKitCell
    }
    if (
      (view instanceof SegmentedBar || view instanceof TabView) &&
      data.eventName === 'selectedIndexChange'
    ) {
      descriptors.oldIndex = { value: Reflect.get(data, 'oldValue'), enumerable: true }
      descriptors.newIndex = { value: Reflect.get(data, 'value'), enumerable: true }
    }
    return Object.defineProperties(Object.create(Object.getPrototypeOf(data)), descriptors)
  },

  emitProgrammaticChange(type, property) {
    return (
      (type === 'searchbar' && property === 'text') ||
      (type === 'datepicker' && property === 'date') ||
      ((type === 'listpicker' || type === 'segmentedbar' || type === 'tabview') &&
        property === 'selectedIndex')
    )
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
