import { GridLayout, View } from '@nativescript/core'
import type { ElementConstructor } from '@octane-xplat/nativescript-octane'
import type { NSView } from '@octane-xplat/platform/macos'
import { FailureCollector } from './failures'
import {
  registeredPluginElement,
  type PluginElementOptions,
  type ViewBase as PluginView,
} from './ns-compat'

const pluginConstructors = new WeakMap<PluginElementOptions<PluginView>, ElementConstructor>()

export function corePluginElementConstructor(type: string): ElementConstructor | undefined {
  const options = registeredPluginElement(type)
  if (!options) {
    return
  }
  let constructor = pluginConstructors.get(options)
  if (constructor) {
    return constructor
  }

  const { container, createView } = options
  const Base = container ? GridLayout : View
  class AppKitPluginView extends Base {
    private readonly plugin = createView()

    constructor() {
      super()
      const plugin = this.plugin
      const table = Reflect.get(Object.getPrototypeOf(plugin), '__propertyTable')
      for (const name of Object.keys(table ?? {})) {
        if (!(name in this)) {
          Object.defineProperty(this, name, {
            get: () => Reflect.get(plugin, name),
            set: (value) => Reflect.set(plugin, name, value),
          })
        }
      }
      const requestLayout = plugin.requestLayout.bind(plugin)
      plugin.requestLayout = () => {
        requestLayout()
        this.requestLayout()
      }
    }

    createNativeView(): NSView {
      return this.plugin.createNativeView() ?? this.plugin.nativeView
    }

    disposeNativeView() {
      const failures = new FailureCollector()
      failures.run('plugin disposal', () => Reflect.get(this.plugin, 'dispose')?.call(this.plugin))
      failures.run('plugin native retirement', () => super.disposeNativeView())
      failures.throwIfFailed()
    }
  }
  constructor = AppKitPluginView
  pluginConstructors.set(options, constructor)
  return constructor
}
