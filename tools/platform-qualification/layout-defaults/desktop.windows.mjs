import { Application, Page } from '@nativescript/core'
import { renderNativeScriptApp } from '@octane-xplat/nativescript-octane'
import { NSWinRT } from '@octane-xplat/platform/windows'
import { runDesktopCases } from './desktop-cases.mjs'

Application.run({
  create() {
    const page = new Page()
    page.actionBarHidden = true
    let root
    const find = (id) => page.getViewById(id) ?? null
    const report = (result) =>
      NSWinRT.dotnet.invoke('', 'windows.GateLog', 'Write', [
        '[xplat-probe] ' + JSON.stringify(result),
      ])
    setTimeout(() => {
      runDesktopCases(
        {
          host: page,
          identity: 'NativeScript Windows/WinUI',
          interaction: 'numeric-geometry-and-programmatic-scroll',
          async ready() {
            while (!page.isLoaded) await new Promise((resolve) => setTimeout(resolve, 20))
          },
          async mount(Component, props) {
            root?.unmount()
            root = renderNativeScriptApp(page, Component, props)
            // Commit queued renderer work and ask WinUI to arrange the new tree
            // before a fixture reads screen coordinates from freshly attached text.
            await Promise.resolve()
            page.nativeViewProtected.UpdateLayout()
          },
          find,
          inspect(id) {
            const view = find(id)
            if (!view) throw new Error('Missing view ' + id)
            const location = view.getLocationOnScreen()
            return {
              text: String(view.text ?? ''),
              value: String(view.text ?? ''),
              frame: location ? { ...location, ...view.getActualSize() } : null,
            }
          },
          dispose() {
            root?.unmount()
          },
        },
        'windows',
        report,
      ).catch((error) => report({ status: 'fail', error: String(error) }))
    }, 0)
    return page
  },
})
