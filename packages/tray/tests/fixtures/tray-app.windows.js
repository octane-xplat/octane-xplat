// Packaged-app fixture for @octane-xplat/tray's windows leaf. Runs inside the
// packaged NativeScript Windows host: creates a real notification-area icon,
// updates it, injects synthetic activation + menu events through the real
// message queue, and destroys it. Evidence lands in console.log plus the
// worker's own Shell_NotifyIconGetRect results (probeRect).
for (const name of ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval']) {
  globalThis[name] ??= globalThis['__ns__' + name]
}

import {
  areAppWindowsVisible,
  createTray,
  getTrayAvailability,
  hideAppWindows,
  keepAppResident,
  showAppWindows,
  toggleAppWindows,
} from '../../src/index.windows.ts'

const log = (m) => console.log('TRAYW ' + m)

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const until = async (cond, label, ms = 15000) => {
  const end = Date.now() + ms

  while (Date.now() < end) {
    if (cond()) {
      return
    }

    await sleep(100)
  }

  throw new Error('timeout waiting for ' + label)
}

const events = []

async function main() {
  const availability = await getTrayAvailability()

  log('availability ' + JSON.stringify(availability))

  const tray = await createTray({
    id: 'xplat-tray-win',
    icon: { type: 'named', name: 'application' },
    tooltip: 'xplat tray one',
    onActivate: () => events.push('activate'),
    menu: [
      { type: 'action', key: 'a', label: '&Act', onSelect: () => events.push('a') },
      {
        type: 'checkbox',
        key: 'c',
        label: '&Check',
        value: true,
        onValueChange: (v) => events.push('c:' + v),
      },
      {
        type: 'radio-group',
        key: 'r',
        label: 'Mode',
        value: 'one',
        items: [
          { key: 'o1', label: '&One', value: 'one' },
          { key: 'o2', label: '&Two', value: 'two' },
        ],
        onValueChange: (v) => events.push('r:' + v),
      },
      {
        type: 'submenu',
        key: 's',
        label: '&Sub',
        items: [{ type: 'action', key: 'sa', label: 'Sub&Act', onSelect: () => events.push('sa') }],
      },
      { type: 'section', key: 'sec', label: 'Sec', items: [{ type: 'separator', key: 'x' }] },
      { type: 'separator', key: 'x2' },
    ],
  })

  log('created')

  // Native evidence: the icon occupies a real rect in the notification area.
  const box = await tray.probeRect('created')

  log('rect ' + JSON.stringify(box))
  if (!box || box[2] <= box[0] || box[3] <= box[1]) {
    throw new Error('icon rect empty: ' + JSON.stringify(box))
  }

  // Left click → activation through the real callback message.
  tray.probeInput({ click: true })
  await until(() => events.includes('activate'), 'activate')
  log('activate-ok')

  // Right click + mnemonic key → menu selection through real TrackPopupMenu.
  tray.probeInput({ menuKey: 0x41 }) // 'A' → &Act
  await until(() => events.includes('a'), 'menu select')
  log('menu-select-ok ' + events.join(','))

  // Update path: tooltip, icon, and menu swap.
  tray.update({ tooltip: 'xplat tray two', icon: { type: 'named', name: 'info' } })
  tray.update({
    menu: [{ type: 'action', key: 'b', label: '&Bump', onSelect: () => events.push('b') }],
  })

  tray.probeInput({ menuKey: 0x42 })
  await until(() => events.includes('b'), 'second menu select')
  log('update-ok ' + events.join(','))

  // Window + residency helpers.
  keepAppResident()

  const hadVisible = areAppWindowsVisible()

  hideAppWindows()

  const afterHide = areAppWindowsVisible()

  toggleAppWindows()

  const afterToggle = areAppWindowsVisible()

  showAppWindows()
  log(`windows had=${hadVisible} hidden=${afterHide} toggled=${afterToggle}`)

  tray.destroy()
  await sleep(1500)
  log('destroyed=' + tray.isDestroyed)
  log('TRAY_WINDOWS_OK')
}

main().catch((error) =>
  log('TRAY_WINDOWS_FAIL ' + (error && error.message ? error.message : error)),
)
