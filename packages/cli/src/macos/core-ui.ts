import { dirname, join, resolve } from 'node:path'
import type { Alias, Plugin } from 'vite'
import { installedPackageRoot } from '../package-root.ts'

interface CoreMacOSUI {
  aliases: Alias[]
  plugins: Plugin[]
  reusedFiles: string[]
}

/** Keep UI and routing on the Core driver when AppKit hosts the bundle. */
export function coreMacOSUI(appRoot: string): CoreMacOSUI {
  const uiRoot: string | null = installedPackageRoot(appRoot, '@octane-xplat/ui')
  if (!uiRoot) {
    return { aliases: [], plugins: [], reusedFiles: [] }
  }

  const src = join(uiRoot, 'src')
  const index = join(src, 'index-core.macos.ts')
  const pane = join(src, 'routing/RoutePane.mobile.tsrx')
  const gestures = join(src, 'gestures/host-core.macos.tsx')
  const fullScreenPage = join(src, 'components/layout/full-screen-page.mobile.ts')
  const keyboardOverlay = join(src, 'internal/keyboard/keyboard-overlay-host.mobile.ts')
  const leaves = new Map([
    [join(src, 'routing/RouteOutlet'), join(src, 'routing/RouteOutlet.tsrx')],
    [join(src, 'routing/RoutePane'), pane],
    [join(src, 'components/layout/full-screen-page'), fullScreenPage],
    [join(src, 'internal/keyboard/keyboard-overlay-host'), keyboardOverlay],
    [join(src, 'components/navigation/nav-href'), join(src, 'components/navigation/nav-href.ts')],
    [join(src, 'gestures/host'), gestures],
    [join(src, 'gestures/host.macos'), gestures],
  ])

  return {
    aliases: [
      { find: /^@octane-xplat\/ui$/, replacement: index },
      { find: /^@octane-xplat\/ui\/routing$/, replacement: join(src, 'routing/index.ts') },
    ],
    reusedFiles: [pane, fullScreenPage, keyboardOverlay],
    plugins: [{
      name: 'xplat:macos-core-ui',
      enforce: 'pre',
      resolveId: {
        order: 'pre',
        handler(source, importer) {
          if (!importer || !source.startsWith('.')) {
            return
          }
          const [file] = source.split(/[?#]/, 1)
          const base = resolve(
            dirname(importer.split(/[?#]/, 1)[0]),
            file.replace(/\.(?:tsx?|tsrx)$/, ''),
          )
          const leaf = leaves.get(base)
          if (leaf) {
            return leaf + source.slice(file.length)
          }
        },
      },
    }],
  }
}
