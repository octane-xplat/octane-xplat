// D-Bus phase of the tray GTK runtime test — runs under dbus-run-session on the
// VM. Exercises the StatusNotifierItem + com.canonical.dbusmenu implementation
// over a real session bus with a test-owned StatusNotifierWatcher.
import Gio from 'gi://Gio'
import GLib from 'gi://GLib'
import System from 'system'

import { createTray, getTrayAvailability } from '../../src/index.gtk.ts'

const ctx = GLib.MainContext.default()
let assertions = 0
const check = (value, name) => {
  assertions += 1
  if (!value) {
    throw new Error('ASSERT ' + name)
  }
}

const pump = (ms = 60) => {
  const deadline = Date.now() + ms

  while (Date.now() < deadline) {
    ctx.iteration(false)
  }
}

const bus = Gio.bus_get_sync(Gio.BusType.SESSION, null)
// Sync calls are only safe against the bus daemon itself; calls into objects
// exported on this same connection must go through the async call API so the
// main context can dispatch both directions while we await.
const callSync = (dest, path, iface, method, params, replySig) =>
  bus
    .call_sync(
      dest,
      path,
      iface,
      method,
      params,
      replySig ? new GLib.VariantType(replySig) : null,
      0,
      -1,
      null,
    )
    .deepUnpack()

const call = (dest, path, iface, method, params, replySig) =>
  new Promise((resolve, reject) =>
    bus.call(
      dest,
      path,
      iface,
      method,
      params,
      replySig ? new GLib.VariantType(replySig) : null,
      0,
      -1,
      null,
      (conn, res) => {
        try {
          resolve(conn.call_finish(res).deepUnpack())
        } catch (error) {
          reject(error)
        }
      },
    ),
  )

const uv = (v) => (v && typeof v.deepUnpack === 'function' ? v.deepUnpack() : v)
const getAll = async (name, path, iface) =>
  (
    await call(
      name,
      path,
      'org.freedesktop.DBus.Properties',
      'GetAll',
      new GLib.Variant('(s)', [iface]),
      '(a{sv})',
    )
  )[0]

// --- Test-owned StatusNotifierWatcher ---------------------------------------
const WATCHER_XML = `<node>
	<interface name="org.kde.StatusNotifierWatcher">
		<method name="RegisterStatusNotifierItem"><arg type="s" direction="in"/></method>
		<method name="RegisterStatusNotifierHost"><arg type="s" direction="in"/></method>
		<property name="IsStatusNotifierHostRegistered" type="b" access="read"/>
		<property name="RegisteredStatusNotifierItems" type="as" access="read"/>
		<property name="ProtocolVersion" type="i" access="read"/>
	</interface>
</node>`

// The watcher must live in a second process: D-Bus calls to an exported object
// on the same connection deadlock (call_sync blocks the context that would
// dispatch the call). Registrations come back through watcher-registered.txt.
const WATCHER_SRC = `
const Gio = imports.gi.Gio; const GLib = imports.gi.GLib;
const XML = ${JSON.stringify(WATCHER_XML)};
const log = Gio.File.new_for_path('watcher-registered.txt')
try { log.delete(null) } catch (e) {}
const exp = Gio.DBusExportedObject.wrapJSObject(XML, {
  get IsStatusNotifierHostRegistered() { return true },
  get RegisteredStatusNotifierItems() {
    try { const [, b] = log.load_contents(null); return new TextDecoder().decode(b).trim().split('\\n').filter(Boolean) } catch (e) { return [] }
  },
  get ProtocolVersion() { return 0 },
  RegisterStatusNotifierItem(name) {
    const s = log.append_to(0, null); s.write_all(String(name) + '\\n', null); s.close(null)
  },
  RegisterStatusNotifierHost(name) {},
})
const bus = Gio.bus_get_sync(Gio.BusType.SESSION, null)
exp.export(bus, '/StatusNotifierWatcher')
Gio.bus_own_name(Gio.BusType.SESSION, 'org.kde.StatusNotifierWatcher', Gio.BusNameOwnerFlags.NONE, null, null, null)
new GLib.MainLoop(null, false).run()`

const readRegistered = () => {
  try {
    const [, bytes] = GLib.file_get_contents('watcher-registered.txt')

    return new TextDecoder().decode(bytes).trim().split('\n').filter(Boolean)
  } catch {
    return []
  }
}

const hasOwner = (name) => {
  try {
    return (
      callSync(
        'org.freedesktop.DBus',
        '/org/freedesktop/DBus',
        'org.freedesktop.DBus',
        'NameHasOwner',
        new GLib.Variant('(s)', [name]),
        '(b)',
      )[0] === true
    )
  } catch {
    return false
  }
}

let watcherProc = null
const startWatcher = () => {
  // Remove a stale registration file so each phase reads only new entries.
  try {
    Gio.File.new_for_path('watcher-registered.txt').delete(null)
  } catch {}

  const src = Gio.File.new_for_path('watcher-process.js')

  src.replace_contents(WATCHER_SRC, null, false, 0, null)
  watcherProc = Gio.Subprocess.new(['gjs', '-m', 'watcher-process.js'], Gio.SubprocessFlags.NONE)

  // Wait for the watcher to own its bus name.
  const deadline = Date.now() + 5000

  while (Date.now() < deadline && !hasOwner('org.kde.StatusNotifierWatcher')) {
    pump(50)
  }
}

const stopWatcher = () => {
  if (watcherProc) {
    watcherProc.force_exit()
    watcherProc = null
  }

  // Wait until the name is released so later phases see a clean bus.
  const deadline = Date.now() + 3000

  while (Date.now() < deadline && hasOwner('org.kde.StatusNotifierWatcher')) {
    pump(50)
  }
}

// --- Signal capture ---------------------------------------------------------
const signals = []

bus.signal_subscribe(
  null,
  'org.kde.StatusNotifierItem',
  null,
  null,
  null,
  0,
  (_c, _s, _p, _i, signal) => signals.push(signal),
)

bus.signal_subscribe(
  null,
  'com.canonical.dbusmenu',
  'LayoutUpdated',
  null,
  null,
  0,
  (_c, _s, _p, _i, signal) => signals.push(signal),
)

const events = []
const MENU = [
  { type: 'action', key: 'a', label: 'Act', onSelect: () => events.push('a') },
  {
    type: 'checkbox',
    key: 'c',
    label: 'Check',
    value: true,
    onValueChange: (v) => events.push('c:' + v),
  },
  {
    type: 'radio-group',
    key: 'r',
    label: 'Mode',
    value: 'one',
    items: [
      { key: 'o1', label: 'One', value: 'one' },
      { key: 'o2', label: 'Two', value: 'two' },
    ],
    onValueChange: (v) => events.push('r:' + v),
  },
  {
    type: 'submenu',
    key: 's',
    label: 'Sub',
    items: [{ type: 'action', key: 'sa', label: 'SubAct', onSelect: () => events.push('sa') }],
  },
  { type: 'section', key: 'sec', label: 'Sec', items: [{ type: 'separator', key: 'x' }] },
  { type: 'separator', key: 'x2' },
]

const findId = (node, label) => {
  const [id, props, children] = node

  if (props.label && uv(props.label) === label) {
    return id
  }

  for (const child of children) {
    const found = findId(child.deepUnpack(), label)

    if (found !== null) {
      return found
    }
  }

  return null
}

async function main() {
  // (a) No watcher: unavailable + createTray rejects.
  const none = await getTrayAvailability()

  check(
    none.available === false && none.reason === 'no-status-notifier-host',
    'no host availability',
  )

  let rejected = null

  try {
    await createTray({ id: 'early', icon: { type: 'named', name: 'star' } })
  } catch (error) {
    rejected = error
  }

  check(rejected && rejected.code === 'no-status-notifier-host', 'create rejects without host')

  // (b) Watcher + host over real D-Bus.
  startWatcher()
  pump()

  const ready = await getTrayAvailability()

  check(ready.available === true && ready.platform === 'linux', 'available linux')

  const tray = await createTray({
    id: 'xplat-tray-test',
    icon: { type: 'named', name: 'star' },
    title: 'TT',
    tooltip: 'tip',
    menu: MENU,
    onActivate: () => events.push('activate'),
  })

  pump()
  check(readRegistered().length === 1, 'watcher recorded registration')

  const name = readRegistered()[0]

  check(name.startsWith('org.kde.StatusNotifierItem-'), 'well-known name shape')

  const props = await getAll(name, '/StatusNotifierItem', 'org.kde.StatusNotifierItem')

  check(uv(props.Id) === 'xplat-tray-test', 'Id')
  check(uv(props.Title) === 'TT', 'Title')
  check(uv(props.ItemIsMenu) === false, 'ItemIsMenu false with onActivate')
  check(uv(props.Menu) === '/MenuBar', 'Menu path')
  check(uv(props.IconName) === 'star', 'IconName')
  check(uv(props.XAyatanaLabel) === 'TT', 'XAyatanaLabel')

  const tip = uv(props.ToolTip)

  check(tip[2] === 'TT' && tip[3] === 'tip', 'ToolTip tuple')

  await call(
    name,
    '/StatusNotifierItem',
    'org.kde.StatusNotifierItem',
    'Activate',
    new GLib.Variant('(ii)', [0, 0]),
    null,
  )

  pump()
  check(events.includes('activate'), 'Activate dispatches onActivate')

  const [revision, rootLayout] = await call(
    name,
    '/MenuBar',
    'com.canonical.dbusmenu',
    'GetLayout',
    new GLib.Variant('(iias)', [0, -1, []]),
    '(u(ia{sv}av))',
  )

  check(typeof revision === 'number' && revision >= 1, 'layout revision')

  const root = rootLayout

  check(root[0] === 0, 'root id 0')
  check(root[2].length === 11, 'top-level row count (got ' + root[2].length + ')')

  const actId = findId(root, 'Act')
  const checkId = findId(root, 'Check')
  const oneId = findId(root, 'One')
  const twoId = findId(root, 'Two')
  const subActId = findId(root, 'SubAct')

  check(actId && checkId && oneId && twoId && subActId, 'item ids resolve')

  const clicked = (id) =>
    call(
      name,
      '/MenuBar',
      'com.canonical.dbusmenu',
      'Event',
      new GLib.Variant('(isvu)', [id, 'clicked', new GLib.Variant('s', ''), 0]),
      null,
    )

  clicked(actId)
  clicked(checkId)
  clicked(oneId) // already selected → no event
  clicked(twoId)
  clicked(subActId)
  pump()
  check(events.join(',') === 'activate,a,c:false,r:two,sa', 'menu dispatch: ' + events.join(','))

  // update() → signals + new values.
  signals.length = 0
  tray.update({ title: 'T2', tooltip: 'tip2', icon: { type: 'named', name: 'circle' } })
  tray.update({
    menu: [{ type: 'action', key: 'b', label: 'B', onSelect: () => events.push('b') }],
  })

  pump(150)
  check(signals.includes('NewTitle'), 'NewTitle emitted')
  check(signals.includes('NewToolTip'), 'NewToolTip emitted')
  check(signals.includes('NewIcon'), 'NewIcon emitted')
  check(signals.includes('LayoutUpdated'), 'LayoutUpdated emitted')

  const props2 = await getAll(name, '/StatusNotifierItem', 'org.kde.StatusNotifierItem')

  check(uv(props2.Title) === 'T2', 'Title updated')
  check(uv(props2.IconName) === 'circle', 'IconName updated')
  check(uv(props2.ToolTip)[3] === 'tip2', 'ToolTip updated')

  // Two trays at once get distinct names.
  const tray2 = await createTray({
    id: 'xplat-tray-file',
    icon: { type: 'file', path: GLib.getenv('TRAY_ICON_PATH') ?? '/tmp/tray-icon.png' },
    tooltip: 'file',
  })

  pump()
  check(readRegistered().length === 2, 'second registration')

  const name2 = readRegistered()[1]

  check(name2 !== name && name2.startsWith('org.kde.StatusNotifierItem-'), 'distinct names')

  const props3 = await getAll(name2, '/StatusNotifierItem', 'org.kde.StatusNotifierItem')
  const pixmaps = uv(props3.IconPixmap)

  check(pixmaps.length >= 2, 'icon pixmap set present')

  const [w, h, bytes] = pixmaps[0]

  check(w === 4 && h === 4, 'native 4x4 pixmap dims (got ' + w + 'x' + h + ')')
  check(
    bytes[0] === 0xff && bytes[1] === 0xff && bytes[2] === 0 && bytes[3] === 0,
    'ARGB first pixel red',
  )

  const small = pixmaps.find((p) => p[0] === 24 || p[1] === 24)

  check(Boolean(small), '24px scaled pixmap present')

  // (c) Watcher restart → exactly one re-registration.
  stopWatcher()
  pump(150)
  startWatcher()
  pump(250)
  check(
    readRegistered().length === 2,
    'both live trays re-registered after watcher restart (got ' + readRegistered().length + ')',
  )

  // (d) Destroy → name vanishes.
  tray.destroy()
  tray2.destroy()
  pump(150)

  const owned = await call(
    'org.freedesktop.DBus',
    '/org/freedesktop/DBus',
    'org.freedesktop.DBus',
    'NameHasOwner',
    new GLib.Variant('(s)', [name]),
    '(b)',
  )

  check(owned[0] === false, 'name vanished after destroy')

  let destroyed = null

  try {
    tray.update({ title: 'x' })
  } catch (error) {
    destroyed = error
  }

  check(destroyed && destroyed.code === 'destroyed', 'update after destroy')

  print('TRAY_GTK_OK ' + assertions)
}

const loop = GLib.MainLoop.new(null, false)

main()
  .then(() => loop.quit())
  .catch((error) => {
    print('TRAY_GTK_FAIL ' + (error && error.message ? error.message : error))
    loop.quit()
    System.exit(1)
  })

loop.run()
System.exit(0)
