import { Button, eachDescendant, Label, TextField, TextView, View } from '@nativescript/core'
import { inspectNativeScriptNodes } from '@octane-xplat/nativescript-octane'
import {
  NSControlTextDidChangeNotification,
  NSNotification,
  NSScrollView,
  NSTextDidChangeNotification,
  NSTextField,
  NSTextView,
} from '@octane-xplat/platform/macos'
import type { UniversalRoot } from 'octane/universal/native'
import { activateNativeScriptView } from './nativescript-actions.macos'
import { appKitAutomationEnabled, publishAppKitAutomation } from './automation-root'
import { appKitHostBoundary } from './nativescript-host-boundary.macos'
import { trackedNativeScriptRoots } from './nativescript-roots.macos'

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
      for (const node of inspectNativeScriptNodes()) {
        if (node.props.id === id) {
          const instance = appKitHostBoundary.publicInstance(node)
          if (instance !== null) {
            return instance
          }
        }
      }
      const view = find(id)
      if (view instanceof TextView && view.nativeViewProtected instanceof NSScrollView) {
        return view.nativeViewProtected.documentView
      }
      return view?.nativeViewProtected ?? null
    },
    pressId(id: string) {
      const view = find(id)
      if (!view || !activateNativeScriptView(view)) {
        throw new Error('No AppKit pressable with id ' + id)
      }
    },
    pressButton(title: string) {
      const view = views().find(
        (candidate) => candidate instanceof Button && candidate.text === title,
      )
      if (!view || !activateNativeScriptView(view)) {
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
      let nativeViewCount = 0
      for (const node of inspectNativeScriptNodes(root)) {
        if (node.view?.nativeViewProtected) {
          nativeViewCount++
        }
      }
      const mountedRowCount = views().filter(
        (view) => /^(?:row-r|bench-row-)\d+$/.test(view.id) && view.nativeViewProtected.superview,
      ).length
      return { mountedRowCount, nativeViewCount }
    },
  })
  const unmount = root.unmount.bind(root)
  root.unmount = () => {
    unpublish()
    return unmount()
  }
}
