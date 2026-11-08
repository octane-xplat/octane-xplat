import { ViewBase, registerPluginElement } from '@octane-xplat/macos-appkit/compat/ns-core'
import { NSView } from '@octane-xplat/platform/macos'

export const pluginRetirements: string[] = []
export function installPackedPlugin(identity: string) {
  class PackedPlugin extends ViewBase {
    createNativeView() {
      this.nativeView = NSView.alloc().initWithFrame({
        origin: { x: 0, y: 0 },
        size: { width: 24, height: 24 },
      })

      return this.nativeView
    }
    dispose() {
      pluginRetirements.push(identity)
    }
  }

  registerPluginElement('placeholder', { createView: () => new PackedPlugin() })
}
