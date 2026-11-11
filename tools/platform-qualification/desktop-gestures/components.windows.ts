import { readScene } from './scene'
import { NSWinRT } from '@octane-xplat/platform/windows'
import { Application, Page, View } from '@nativescript/core'
import { renderNativeScriptApp } from '@nativescript-community/octane'
import type { UniversalRoot } from 'octane/universal/native'
import '@octane-xplat/ui/theme/tokens.css'
import '@octane-xplat/ui/theme/chrome.css'
import { Components, scene } from './components.tsrx'

const report = (kind: string, detail?: unknown) =>
  NSWinRT.dotnet.invoke('', 'windows.GateLog', 'Write', [JSON.stringify({ kind, detail })])

let root: UniversalRoot | null = null
const retire = () => {
  root?.unmount()
  root = null
  report('retired', {
    motion: scene.motion,
    button: scene.button,
    scroll: scene.scroll,
    field: scene.field,
  })
}

Application.run({
  create() {
    const page = new Page()

    page.actionBarHidden = true
    root = renderNativeScriptApp(page, Components, { report, retire })
    return page
  },
})

let described = false

setInterval(() => {
  if (!scene.motion || !scene.button || !scene.scroll || !scene.field) {
    return
  }

  const hosts = readScene((host): host is View => host instanceof View)

  if (!hosts.motion.isLoaded || !hosts.button.isLoaded) {
    return
  }

  const bounds = (view: unknown) => {
    if (!(view instanceof View)) {
      throw new Error('Expected a NativeScript view')
    }

    const origin = view.getLocationOnScreen()

    return { ...origin, ...view.getActualSize() }
  }

  if (!described) {
    described = true
    try {
      report(
        'native-owner-description',
        NSWinRT.dotnet.invoke('', 'OctaneXplat.Input.GestureInput', 'Describe', [
          NSWinRT.interop.pointerKey(hosts.motion.nativeViewProtected),
        ]),
      )
    } catch (error) {
      report('native-owner-error', String(error))
    }

    report('window-ready', {
      loaded: hosts.motion.isLoaded,
      root: hosts.motion.nativeViewProtected.XamlRoot != null,
      pointerKey: typeof NSWinRT.interop.pointerKey(hosts.motion.nativeViewProtected),
    })
  }

  report('geometry', {
    motion: bounds(hosts.motion),
    button: bounds(hosts.button),
    panel: bounds(hosts.panel),
    field: bounds(hosts.field.native),
    x: hosts.motion.translateX,
    text:
      typeof hosts.field.native === 'object' && hosts.field.native
        ? Reflect.get(hosts.field.native, 'text')
        : null,
  })
}, 300)
