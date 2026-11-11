// Octane Xplat devtools desktop: the shared devtools panel from
// @octane-xplat/devtools/panel over the Network.framework socket from
// @octane-xplat/devtools/macos, in one AppKit window per live `xplat dev`
// server record. runMacOSApp owns NSApplication startup and the event loop;
// the main window doubles as the "no servers" placeholder until the first
// record appears.
import '@nativescript/macos-node-api'
import { createMacOSRoot } from '@octane-xplat/macos-appkit'
import { createHostedWindow, runMacOSApp } from '@octane-xplat/macos-appkit/host'
import type { HostedWindowController } from '@octane-xplat/macos-appkit/host'
import type { UniversalRoot } from 'octane/universal/native'
import type { NSView, NSWindow } from '@octane-xplat/platform/macos'
import { listDevtoolsServers, nwDevSocket } from '@octane-xplat/devtools/macos'
import type { ListedDevtoolsServer } from '@octane-xplat/devtools/macos'
import { App } from '@octane-xplat/devtools/panel'
import { writeFileSync } from 'node:fs'
import { Placeholder } from './Placeholder.macos.tsrx'

const POLL_MS = 2000
const SELFTEST = process.env.DEVTOOLS_SELFTEST === '1'
const VIEWDUMP = process.env.DEVTOOLS_VIEWDUMP ?? '/tmp/devtools-desktop-viewtree.json'

interface RecordWindow {
  instanceId: string
  controller: HostedWindowController
  root: UniversalRoot | null
}

// Keyed by record key; a closed window's key+instanceId is remembered so a
// still-running server does not reopen a window the user dismissed — a fresh
// instanceId (server restart) still opens a new window.
const windows = new Map<string, RecordWindow>()
const dismissed = new Set<string>()

let mainWindow: NSWindow | null = null
let placeholderGone = false

function basename(path: string): string {
  const parts = path.split('/').filter(Boolean)
  return parts[parts.length - 1] ?? path
}

function mountRecord(entry: RecordWindow, record: ListedDevtoolsServer) {
  const root = createMacOSRoot(entry.controller.contentView!)
  entry.root = root
  root.render(App as never, { record, socket: nwDevSocket })
  entry.instanceId = record.instanceId
}

function openRecordWindow(record: ListedDevtoolsServer) {
  const controller = createHostedWindow({
    title: `devtools — ${basename(record.appRoot)}`,
    size: { width: 420, height: 720 },
  })
  controller.window.contentMinSize = { width: 380, height: 360 }

  const entry: RecordWindow = { instanceId: record.instanceId, controller, root: null }
  windows.set(record.key, entry)
  mountRecord(entry, record)

  void controller.closed.then(() => {
    try {
      entry.root?.unmount()
    } catch (error) {
      console.error('[devtools] window root unmount failed', error)
    }
    entry.root = null
    if (windows.get(record.key) === entry) {
      windows.delete(record.key)
      dismissed.add(`${record.key}:${record.instanceId}`)
    }
  })

  return entry
}

function remountRecordWindow(entry: RecordWindow, record: ListedDevtoolsServer) {
  try {
    entry.root?.unmount()
  } catch (error) {
    console.error('[devtools] record window root unmount failed', error)
  }
  entry.root = null
  mountRecord(entry, record)
}

function dismissPlaceholder() {
  if (placeholderGone) {
    return
  }
  placeholderGone = true
  mainWindow?.close()
  mainWindow = null
}

function sync() {
  const records = listDevtoolsServers()

  for (const record of records) {
    const existing = windows.get(record.key)

    if (existing) {
      if (!existing.controller.isClosed && existing.instanceId !== record.instanceId) {
        // Same key, restarted server — reconnect the panel in place.
        remountRecordWindow(existing, record)
      }
    } else if (!dismissed.has(`${record.key}:${record.instanceId}`)) {
      openRecordWindow(record)
    }
  }

  if (windows.size > 0) {
    dismissPlaceholder()
  }
}

runMacOSApp(
  {
    title: 'devtools',
    size: { width: 320, height: 160 },
    terminateAfterLastWindowClosed: true,
  },
  ({ window, root }) => {
    mainWindow = window
    root.render(Placeholder as never, {})

    try {
      sync()
    } catch (error) {
      console.error('[devtools] initial record scan failed', error)
    }

    const poll = setInterval(() => {
      try {
        sync()
      } catch (error) {
        console.error('[devtools] record scan failed', error)
      }
    }, POLL_MS)

    return () => clearInterval(poll)
  },
)

// Dev-only self-test: once record windows are on screen, dump every window's
// NSView tree (class/frame/hidden/text) as JSON so Sessions content can be
// asserted without screenshots. Gated by DEVTOOLS_SELFTEST=1.
if (SELFTEST) {
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

  function dumpViews() {
    try {
      const dumps = [...windows.values()]
        .filter((entry) => !entry.controller.isClosed)
        .map((entry) => ({
          title: String(entry.controller.window.title ?? ''),
          tree: viewTree(entry.controller.window.contentView),
        }))

      if (mainWindow) {
        dumps.unshift({
          title: String(mainWindow.title ?? ''),
          tree: viewTree(mainWindow.contentView),
        })
      }

      const json = JSON.stringify({ windows: dumps })
      writeFileSync(VIEWDUMP, json)
      console.log(
        `[selftest] viewtree written ${VIEWDUMP} windows=${dumps.length} bytes=${json.length}`,
      )
    } catch (error) {
      console.error('[selftest] viewtree dump failed', error)
    }
  }

  // Give the panel socket a moment to connect and render sessions, then dump
  // once. If no records exist the placeholder alone is still evidence.
  setTimeout(dumpViews, 4000)
}
