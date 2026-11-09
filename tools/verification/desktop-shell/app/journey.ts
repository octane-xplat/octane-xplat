import { createStore } from '@octane-xplat/ui/data'
import type { WindowHandle } from '@octane-xplat/ui'

/** Shared business state for the desktop-shell journey app. Platform-agnostic:
 *  the macOS entry wires these stores and menu definitions to AppKit services;
 *  other platforms can add their own entry later. */

export const name$ = createStore('')
export const submitted$ = createStore(false)
export const menuCount$ = createStore(0)
export const submitCount$ = createStore(0)
export const inspectorOpen$ = createStore(false)
export const inspectorCount$ = createStore(0)
export const lastError$ = createStore('')
export const statusSuffix$ = createStore('')

export const STORAGE_KEY = 'desktop-shell.name'

/** The live inspector window handle, set by the platform entry. */
export let inspectorHandle: WindowHandle | null = null

export function setInspectorHandle(handle: WindowHandle | null) {
  inspectorHandle = handle
}

export function closeInspector() {
  inspectorHandle?.close()
}

/** One line on stdout; the runner matches markers on these. */
export function marker(text: string) {
  console.log('JOURNEY ' + text)
}

export function submitName(name: string) {
  name$.set(name)
  submitted$.set(true)
  submitCount$.set(submitCount$.getSnapshot() + 1)
  marker(`SUBMITTED name=${name}`)
}

export function statusText() {
  const name = name$.getSnapshot()

  return name ? `Submitted: ${name}` : 'Waiting for a name'
}

export const MENU_ITEMS = [
  {
    type: 'submenu' as const,
    key: 'journey',
    label: 'Journey',
    items: [
      {
        type: 'action' as const,
        key: 'increment',
        label: 'Increment Counter',
        accelerator: 'Mod+Shift+I',
      },
    ],
  },
]

export const TRAY_MENU = [
  {
    type: 'action' as const,
    key: 'open-inspector',
    label: 'Open Inspector',
  },
]

export const HOTKEY = 'Ctrl+Alt+Shift+KeyJ'
export const HOTKEY_CONFLICT = 'Ctrl+Alt+Shift+KeyJ'
export const HOTKEY_RESERVED = 'Meta+Tab'
