import {
  type ViewBase,
  addTaggedAdditionalCSS,
  removeTaggedAdditionalCSS,
} from '@nativescript/core'

type Stylesheet = readonly [name: string, css: string]
const roots = new Set<ViewBase>()
const bundleTags: string[] = []
const registeredStylesheets = new Map<string, string>()

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

/** Register or replace a stylesheet owned by the application. */
export function registerNativeScriptStylesheet(id: string, css: string): void {
  const tag = 'octane-macos:registered:' + id
  registeredStylesheets.set(tag, css)

  // Core appends tagged rules. Reapply this sheet and its successors so a
  // replacement keeps its place in the application's stylesheet order.
  let replacing = false
  for (const [registeredTag, content] of registeredStylesheets) {
    replacing ||= registeredTag === tag
    if (replacing) {
      removeTaggedAdditionalCSS(registeredTag)
      addTaggedAdditionalCSS(content, registeredTag)
    }
  }
  refreshRoots()
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
