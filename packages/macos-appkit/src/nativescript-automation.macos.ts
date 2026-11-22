import {
  Button,
  eachDescendant,
  GestureTypes,
  Label,
  TextField,
  TextView,
  View,
} from '@nativescript/core'
import {
  NSButton,
  NSControlTextDidChangeNotification,
  NSNotification,
  NSScrollView,
  NSTextDidChangeNotification,
  NSTextField,
  NSTextView,
} from '@octane-xplat/platform/macos'
import type { UniversalRoot } from 'octane/universal/native'
import { appKitAutomationEnabled, publishAppKitAutomation } from './automation-root'
import { trackedNativeScriptRoots } from './nativescript-roots.macos'

function activate(view: View): boolean {
  if (!view.isEnabled || !view.isUserInteractionEnabled) {
    return false
  }

  const native = view.nativeViewProtected
  if (native instanceof NSButton) {
    native.performClick(null)
    return true
  }

  const observers = view.getGestureObservers(GestureTypes.tap) ?? []
  const observesEvent = view.hasListeners('tap')
  if (!observers.length && !observesEvent) {
    return false
  }

  const event = {
    type: GestureTypes.tap,
    eventName: 'tap',
    object: view,
    view,
    ios: undefined,
    android: undefined,
    getPointerCount: () => 0,
    getX: () => 0,
    getY: () => 0,
  }
  if (observesEvent) {
    view.notify(event)
  }
  for (const observer of [...observers]) {
    observer.callback?.call(observer.context, event)
  }
  return true
}

/** Core-backed view lookup and control dispatch for the Mac probe runner. */
export function installNativeScriptAutomation(root: UniversalRoot): void {
  if (!appKitAutomationEnabled()) {
    return
  }

  const views = (): View[] => {
    const result: View[] = []
    for (const host of trackedNativeScriptRoots()) {
      eachDescendant(host, (view) => {
        if (view instanceof View && view.nativeViewProtected) {
          result.push(view)
        }
        return true
      })
    }
    return result
  }
  const find = (id: string) => views().find((view) => view.id === id)
  const unpublish = publishAppKitAutomation(root, {
    findId(id: string) {
      return find(id)?.nativeViewProtected ?? null
    },
    pressId(id: string) {
      const view = find(id)
      if (!view || !activate(view)) {
        throw new Error('No AppKit pressable with id ' + id)
      }
    },
    pressButton(title: string) {
      const view = views().find(
        (candidate) => candidate instanceof Button && candidate.text === title,
      )
      if (!view || !activate(view)) {
        throw new Error('No AppKit button titled ' + title)
      }
    },
    setText(idOrPlaceholder: string, value: string) {
      const view = views().find(
        (candidate) =>
          (candidate instanceof TextField || candidate instanceof TextView) &&
          (candidate.id === idOrPlaceholder || candidate.hint === idOrPlaceholder),
      )
      const native = view?.nativeViewProtected
      if (view instanceof TextField && native instanceof NSTextField) {
        native.stringValue = value
        native.delegate?.controlTextDidChange?.(
          NSNotification.notificationWithNameObject(NSControlTextDidChangeNotification, native),
        )
      } else if (
        view instanceof TextView &&
        native instanceof NSScrollView &&
        native.documentView instanceof NSTextView
      ) {
        const editor = native.documentView
        editor.string = value
        editor.delegate?.textDidChange?.(
          NSNotification.notificationWithNameObject(NSTextDidChangeNotification, editor),
        )
      } else {
        throw new Error('No AppKit text input with id or placeholder ' + idOrPlaceholder)
      }
    },
    snapshot() {
      const current = views()
      return {
        labels: current
          .filter((view) => view instanceof Label)
          .map((view) => view.nativeViewProtected.stringValue),
        buttons: current
          .filter((view) => view instanceof Button)
          .map((view) => view.nativeViewProtected.title),
        pressables: current
          .filter((view) => view.accessibilityRole === 'button')
          .map((view) => view.accessibilityLabel),
      }
    },
    metrics() {
      const mountedRowCount = views().filter(
        (view) => /^(?:row-r|bench-row-)\d+$/.test(view.id) && view.nativeViewProtected.superview,
      ).length
      return { mountedRowCount }
    },
  })
  const unmount = root.unmount.bind(root)
  root.unmount = () => {
    unpublish()
    return unmount()
  }
}
