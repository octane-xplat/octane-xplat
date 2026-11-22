import {
  type ViewBase,
  addTaggedAdditionalCSS,
  removeTaggedAdditionalCSS,
} from '@nativescript/core'

type Stylesheet = readonly [name: string, css: string]
const roots = new Set<ViewBase>()
const bundleTags: string[] = []

export function trackNativeScriptStyleRoot(root: ViewBase): () => void {
  roots.add(root)
  return () => {
    roots.delete(root)
  }
}

function refreshRoots() {
  for (const root of roots) {
    root._onCssStateChange()
  }
}

function replaceBundle(stylesheets: readonly Stylesheet[]) {
  for (const tag of bundleTags) {
    removeTaggedAdditionalCSS(tag)
  }
  bundleTags.length = 0
  for (const [name, css] of stylesheets) {
    const tag = 'octane-macos:bundle:' + name
    bundleTags.push(tag)
    addTaggedAdditionalCSS(css, tag)
  }
  refreshRoots()
}

export function installNativeScriptStylesheetDelivery() {
  Reflect.set(globalThis, '__xplatReplaceCoreStylesheets', replaceBundle)
  const queued: readonly Stylesheet[] | undefined = Reflect.get(
    globalThis,
    '__xplatCoreStylesheets',
  )
  if (queued) {
    Reflect.deleteProperty(globalThis, '__xplatCoreStylesheets')
    replaceBundle(queued)
  }
}
