import Gtk from 'gi://Gtk?version=4.0'
import GLib from 'gi://GLib'
import { appMenu } from '../../src/index.gtk.ts'
import { parseAccelerator, toGtk } from '../../src/accelerator.ts'

// Plain Gtk.Application rather than the framework runGtkApp host — bundling
// the universal renderer into this probe is impractical; the adapter only
// needs a GtkApplication, a menubar window and a focused entry.
Gtk.init()
const app = new Gtk.Application({ application_id: 'dev.xplat.AppMenuProbe' })
const entry = new Gtk.Entry({ text: 'hello' })
let window = null
let handle = null
const counts = { new: 0, docA: 0, newWindow: 0, sidebar: 0 }
const failures = []
const check = (value, message) => {
  if (value) {
    print('PASS ' + message)
  } else {
    failures.push(message)
    printerr('CHECK-FAIL ' + message)
  }
}

const fire = (name) => {
  counts[name]++
  print(`FIRED ${name}=${counts[name]}`)
}

const menusFor = (sidebarValue) => [
  {
    type: 'submenu',
    key: 'file',
    label: 'File',
    items: [
      {
        type: 'action',
        key: 'new',
        label: 'New',
        accelerator: 'Mod+N',
        onSelect: () => fire('new'),
      },
      { type: 'separator', key: 's1' },
      {
        type: 'submenu',
        key: 'recent',
        label: 'Open Recent',
        items: [
          {
            type: 'action',
            key: 'docA',
            label: 'Doc A',
            accelerator: 'Mod+Alt+K',
            onSelect: () => fire('docA'),
          },
        ],
      },
      {
        type: 'action',
        key: 'disabled',
        label: 'Disabled',
        accelerator: 'Mod+D',
        isDisabled: true,
        onSelect: () => fire('disabled'),
      },
      { type: 'action', key: 'saveas', label: 'Save_As', onSelect: () => {} },
      { type: 'role', key: 'close', role: 'close' },
      { type: 'role', key: 'quit', role: 'quit' },
    ],
  },
  {
    type: 'submenu',
    key: 'edit',
    label: 'Edit',
    items: [
      { type: 'role', key: 'undo', role: 'undo' },
      { type: 'role', key: 'redo', role: 'redo' },
      { type: 'separator', key: 's2' },
      { type: 'role', key: 'cut', role: 'cut' },
      { type: 'role', key: 'copy', role: 'copy' },
      { type: 'role', key: 'paste', role: 'paste' },
      { type: 'role', key: 'selectAll', role: 'selectAll' },
    ],
  },
  {
    type: 'submenu',
    key: 'view',
    label: 'View',
    items: [
      {
        type: 'checkbox',
        key: 'sidebar',
        label: 'Sidebar',
        value: sidebarValue,
        accelerator: 'Mod+Shift+S',
        onValueChange: (value) => {
          fire('sidebar')
          handle.update(menusFor(value), options)
        },
      },
    ],
  },
]

const options = {
  macos: {
    applicationItems: [
      {
        type: 'action',
        key: 'settings',
        label: 'Settings…',
        accelerator: 'Mod+,',
        onSelect: () => fire('settings'),
      },
    ],
  },
}

const xplatActionNames = () => app.list_actions().filter((name) => name.startsWith('xplat-menu-'))

let previous = null
let oldNames = []

app.connect('activate', () => {
  // Every key class in the accelerator grammar maps to a GTK-parsable string.
  const accelCases = [
    'Mod+N',
    'Mod+Shift+Z',
    'Control+Q',
    'Alt+ArrowLeft',
    'Meta+A',
    'Option+ArrowRight',
    'F1',
    'F24',
    'Mod+Enter',
    'Mod+Escape',
    'Mod+Tab',
    'Mod+Space',
    'Mod+Backspace',
    'Mod+Delete',
    'Mod+ArrowUp',
    'Mod+ArrowDown',
    'Mod+ArrowLeft',
    'Mod+ArrowRight',
    'Mod+Home',
    'Mod+End',
    'Mod+PageUp',
    'Mod+PageDown',
    'Mod+Plus',
    'Mod+,',
    'Mod+.',
    'Mod+/',
    'Mod+;',
    "Mod+'",
    'Mod+[',
    'Mod+]',
    'Mod+\\',
    'Mod+-',
    'Mod+=',
    'Mod+`',
    'Mod+0',
  ]
  let parseFailures = 0
  for (const source of accelCases) {
    const accel = toGtk(parseAccelerator(source))
    const [keyval] = Gtk.accelerator_parse(accel)
    if (!keyval) {
      parseFailures++
      printerr(`ACCEL-FAIL ${source} → ${accel}`)
    }
  }
  check(
    parseFailures === 0,
    `accelerator grammar → Gtk.accelerator_parse (${accelCases.length} cases)`,
  )

  window = new Gtk.ApplicationWindow({
    application: app,
    title: 'XplatAppMenu',
    default_width: 320,
    default_height: 120,
    show_menubar: true,
  })
  const box = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL })
  box.append(entry)
  window.set_child(box)
  window.present()
  entry.grab_focus()

  check(appMenu.supported === true, 'appMenu.supported')
  previous = app.get_menubar()
  handle = appMenu.install(menusFor(true), options)
  const installNames = xplatActionNames()
  check(installNames.length === 13, `13 registered actions (got ${installNames.length})`)

  // Mnemonic escaping in the installed menubar model; also capture the
  // action name behind 'Select All' for the widget-action check below.
  let saveAsFound = false
  let selectAllName = null
  const walk = (menu) => {
    const n = menu.get_n_items()
    for (let i = 0; i < n; i++) {
      const label = menu.get_item_attribute_value(i, 'label', null)?.deep_unpack()
      const action = menu.get_item_attribute_value(i, 'action', null)?.deep_unpack()
      if (label === 'Save__As') {
        saveAsFound = true
      }

      if (label === 'Select All' && action) {
        selectAllName = String(action).replace(/^app\./, '')
      }

      const sub = menu.get_item_link(i, 'submenu') ?? menu.get_item_link(i, 'section')
      if (sub) {
        walk(sub)
      }
    }
  }
  walk(app.get_menubar())
  check(saveAsFound, 'menubar label escaped to Save__As')

  // Quit role registers <Control>q (driver never sends it — that would quit).
  const quitAccels = installNames.filter(
    (name) => JSON.stringify(app.get_accels_for_action(`app.${name}`)) === '["<Control>q"]',
  )
  check(quitAccels.length === 1, 'quit role accel <Control>q registered')

  // selectAll via app-level action activation — handler-level, not OS input.
  GLib.idle_add(GLib.PRIORITY_DEFAULT, () => {
    entry.select_region(0, 0)
    entry.set_position(0)
    if (selectAllName) {
      app.activate_action(selectAllName, null)
      const bounds = entry.get_selection_bounds()
      check(
        Boolean(bounds) && bounds[bounds.length - 1] === 5,
        'selectAll role covers entry text (action-level)',
      )
    } else {
      check(false, 'selectAll action name not found')
    }
    return GLib.SOURCE_REMOVE
  })

  print('APPMENU_READY')
})

// Self-driving phase machine on the main loop — state advances when the
// observed counters catch up with the driver's real key input.
let phase = 'await-batch1'
let waited = 0
GLib.timeout_add(GLib.PRIORITY_DEFAULT, 100, () => {
  waited += 100
  if (waited > 30000) {
    printerr(`APPMENU_GTK_FAIL timeout in phase ${phase}`)
    app.quit()
    return GLib.SOURCE_REMOVE
  }
  switch (phase) {
    case 'await-batch1':
      if (counts.new >= 1 && counts.sidebar === 1 && counts.docA === 1) {
        check(counts.new === 1 || counts.new === 2, `ctrl+d disabled (new=${counts.new})`)
        phase = 'update'
      }

      return GLib.SOURCE_CONTINUE
    case 'update': {
      // Outside-dispatch update from a timer: New → 'New Window' Mod+Shift+N.
      oldNames = xplatActionNames()
      handle.update(
        menusFor(false).map((menu) =>
          menu.key === 'file'
            ? {
                ...menu,
                items: [
                  {
                    type: 'action',
                    key: 'new',
                    label: 'New Window',
                    accelerator: 'Mod+Shift+N',
                    onSelect: () => fire('newWindow'),
                  },
                  ...menu.items.slice(1),
                ],
              }
            : menu,
        ),
        options,
      )

      GLib.idle_add(GLib.PRIORITY_DEFAULT, () => {
        for (const name of oldNames) {
          check(app.lookup_action(name) === null, `old action ${name} removed`)
          check(
            (app.get_accels_for_action(`app.${name}`) ?? []).length === 0,
            `old accels cleared for ${name}`,
          )
        }
        print('APPMENU_UPDATED')
        return GLib.SOURCE_REMOVE
      })

      phase = 'await-newwindow'
      return GLib.SOURCE_CONTINUE
    }
    case 'await-newwindow':
      if (counts.newWindow === 1) {
        check(true, `stale ctrl+n inert after update (new=${counts.new})`)
        phase = 'dispose'
      }

      return GLib.SOURCE_CONTINUE
    case 'dispose': {
      handle.dispose()
      check(handle.isDisposed === true, 'isDisposed')
      check(app.get_menubar() === previous, 'menubar restored to previous')
      check(xplatActionNames().length === 0, 'all xplat actions removed')
      const second = appMenu.install(menusFor(true), options)
      second.dispose()
      if (failures.length === 0) {
        print(
          'APPMENU_GTK_OK install, accels, sections, mnemonics, controlled checkbox, update, dispose',
        )
      } else {
        printerr(`APPMENU_GTK_FAIL ${failures.join(' | ')}`)
      }

      app.quit()
      return GLib.SOURCE_REMOVE
    }
    default:
      return GLib.SOURCE_CONTINUE
  }
})

app.run([])
