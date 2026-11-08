import { appMenu } from '@octane-xplat/app-menu'
import { getCurrentWindow } from '@nativescript/core/application/window-helper.windows'

for (const name of ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval']) {
  globalThis[name] ??= globalThis['__ns__' + name]
}

const ui = Microsoft.UI.Xaml
// Same window resolver used by NativeScript Application.run; no custom bridge.
const window = getCurrentWindow()
window.Title = 'XplatAppMenu'
const editor = new ui.Controls.TextBox()
editor.Text = 'Menu test editor'
window.Content = editor
window.Activate()
const log = (message) => console.log('APPMENU ' + message)
const counts = { new: 0, nested: 0, check: 0, next: 0, disabled: 0 }
let sidebar = true
let handle
const items = (updated = false) => [
  {
    type: 'action',
    key: 'new',
    label: updated ? 'New File' : 'New',
    accelerator: updated ? 'Mod+M' : 'Mod+N',
    onSelect() {
      counts[updated ? 'next' : 'new']++
      log(updated ? 'NEXT' : 'NEW')
    },
  },
  { type: 'separator', key: 's' },
  {
    type: 'checkbox',
    key: 'sidebar',
    label: 'Sidebar',
    value: sidebar,
    accelerator: 'Mod+Shift+S',
    onValueChange(next) {
      counts.check++
      log('CHECK ' + next)
      sidebar = next
      handle.update(menus(updated))
    },
  },
  {
    type: 'submenu',
    key: 'recent',
    label: 'Recent',
    items: [
      {
        type: 'action',
        key: 'doc',
        label: 'Doc A',
        accelerator: 'Mod+Alt+K',
        onSelect() {
          counts.nested++
          log('NESTED')
        },
      },
    ],
  },
  {
    type: 'action',
    key: 'disabled',
    label: 'Disabled',
    isDisabled: true,
    accelerator: 'Mod+D',
    onSelect() {
      counts.disabled++
      log('DISABLED_FAIL')
    },
  },
  {
    type: 'action',
    key: 'update',
    label: 'Apply update',
    accelerator: 'Mod+U',
    onSelect() {
      handle.update(menus(true))
      log('UPDATED')
    },
  },
  {
    type: 'action',
    key: 'dispose',
    label: 'Dispose',
    accelerator: 'Mod+E',
    onSelect() {
      handle.dispose()
      setTimeout(() => {
        if (window.Content !== editor) {
          throw Error('Original content not restored')
        }
        log('DISPOSED')
        setTimeout(() => {
          log('COUNTS ' + JSON.stringify(counts))
          if (
            JSON.stringify(counts) !==
            JSON.stringify({ new: 2, nested: 1, check: 1, next: 1, disabled: 0 })
          ) {
            log('WINDOWS_FAIL counts')
          } else {
            log('WINDOWS_OK')
          }
        }, 1800)
      }, 50)
    },
  },
]

const menus = (updated = false) => [
  { type: 'submenu', key: 'file', label: 'File', items: items(updated) },
]

setTimeout(() => {
  try {
    log('AVAILABLE ' + appMenu.supported)
    handle = appMenu.install(menus())
    log('READY')
  } catch (error) {
    log('WINDOWS_FAIL ' + error.stack)
  }
}, 400)
