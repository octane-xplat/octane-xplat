import type Gtk from 'gi://Gtk?version=4.0'
// oxlint-disable-next-line xplat/no-nativescript-import -- The GTK provider resolves this shared Core module.
import { Observable } from '@nativescript/core/data/observable'
// oxlint-disable-next-line xplat/no-nativescript-import -- This module is only loaded on GTK.
import type { ViewBase } from '@nativescript/core'
import { Application as styles } from './native-core-shim.js'

export const launchEvent = 'launch'
export const exitEvent = 'exit'

let nativeApp: Gtk.Application | undefined
let root: ViewBase | undefined

export function getRootView() {
  return root
}

export const addCss = styles.addCss

export const Application = Object.assign(new Observable(), {
  addCss,
  getRootView,
  getNativeApplication: () => nativeApp,
  hasLaunched: () => nativeApp !== undefined,
  getCssFileName: () => '',
})

export function launchCoreApplication(app: Gtk.Application, view: ViewBase | undefined) {
  nativeApp = app
  root = view
  Application.notify({ eventName: launchEvent, object: Application })
}

export function exitCoreApplication() {
  try {
    Application.notify({ eventName: exitEvent, object: Application })
  } finally {
    root = undefined
    nativeApp = undefined
  }
}
