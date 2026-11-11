// Octane Xplat devtools desktop: the shared devtools panel from
// @octane-xplat/devtools/panel over the Network.framework socket from
// @octane-xplat/devtools/macos, in a single AppKit window. The Shell asks
// which live `xplat dev` server record to target when several exist, and
// auto-targets the app `xplat devtools` was launched from (injected as a
// Vite define) when that record resolves. runMacOSApp owns NSApplication
// startup and the event loop.
import '@nativescript/macos-node-api'
import { runMacOSApp } from '@octane-xplat/macos-appkit/host'
import type { NSView } from '@octane-xplat/platform/macos'
import { writeFileSync } from 'node:fs'
import { Shell } from './Shell.macos.tsrx'

// Injected by the Vite config generated in src/host/desktop.ts; absent from
// the apps/devtools harness bundle, where it reads as undefined.
declare const __XPLAT_DEVTOOLS_PREFERRED_ROOT__: string

const PREFERRED_ROOT =
  typeof __XPLAT_DEVTOOLS_PREFERRED_ROOT__ === 'string'
    ? __XPLAT_DEVTOOLS_PREFERRED_ROOT__
    : null

const SELFTEST = process.env.DEVTOOLS_SELFTEST === '1'
const VIEWDUMP = process.env.DEVTOOLS_VIEWDUMP ?? '/tmp/devtools-desktop-viewtree.json'
const SELFTEST_PICK = Number.parseInt(process.env.DEVTOOLS_SELFTEST_PICK ?? '', 10)

const selftest: { pick?: (index: number) => void } = {}

runMacOSApp(
  {
    title: 'devtools',
    size: { width: 420, height: 720 },
    terminateAfterLastWindowClosed: true,
  },
  ({ window, root }) => {
    window.contentMinSize = { width: 380, height: 360 }
    root.render(Shell as never, {
      preferredRoot: PREFERRED_ROOT,
      onTitle: (title: string) => {
        window.title = title
      },
      selftest,
    })

    if (!SELFTEST) {
      return
    }

    function viewTree(v: NSView): Record<string, unknown> {
      const f = v.frame ?? { origin: { x: 0, y: 0 }, size: { width: 0, height: 0 } }
      const node: Record<string, unknown> = {
        class: String(v.className ?? 'NSView'),
        x: f.origin?.x ?? 0,
        y: f.origin?.y ?? 0,
        w: f.size?.width ?? 0,
        h: f.size?.height ?? 0,
        hidden: Boolean(v.isHidden?.() ?? v.hidden ?? false),
      }

      for (const prop of ['stringValue', 'title', 'label', 'string', 'placeholderString']) {
        try {
          const raw = (v as never as Record<string, unknown>)[prop]
          const t = typeof raw === 'function' ? raw.call(v) : raw
          if (typeof t === 'string' && t.length) {
            node.text = t
          } else if (t && typeof t === 'object') {
            node.text = String(t)
          }
        } catch {}
      }

      const subs = v.subviews
      if (subs && typeof subs.count === 'number' && subs.count > 0) {
        node.children = []
        for (let i = 0; i < subs.count; i++) {
          try {
            ;(node.children as unknown[]).push(viewTree(subs.objectAtIndex(i) as NSView))
          } catch {}
        }
      }

      return node
    }

    // Dev-only self-test: dump the main window's NSView tree
    // (class/frame/hidden/text) as JSON so picker/panel content can be
    // asserted without screenshots. Gated by DEVTOOLS_SELFTEST=1.
    // DEVTOOLS_SELFTEST_PICK=<index> additionally picks that picker row after
    // the first dump and writes a second dump to `${VIEWDUMP}.picked.json` —
    // this proves the state transition, not OS hit-testing.
    function dumpViews(path: string) {
      try {
        const json = JSON.stringify({
          windows: [{ title: String(window.title ?? ''), tree: viewTree(window.contentView) }],
        })
        writeFileSync(path, json)
        console.log(`[selftest] viewtree written ${path} bytes=${json.length}`)
      } catch (error) {
        console.error('[selftest] viewtree dump failed', error)
      }
    }

    // Give the picker a moment to list records / the panel socket to connect,
    // then dump; a pick index renders its transition in the second dump.
    setTimeout(() => {
      dumpViews(VIEWDUMP)
      if (Number.isInteger(SELFTEST_PICK)) {
        selftest.pick?.(SELFTEST_PICK)
        setTimeout(() => dumpViews(`${VIEWDUMP}.picked.json`), 4000)
      }
    }, 4000)
  },
)
