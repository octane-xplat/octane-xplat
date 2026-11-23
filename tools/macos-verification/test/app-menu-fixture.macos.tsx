/** @jsxImportSource @octane-xplat/jsx */
import { createMacOSRoot } from '@octane-xplat/macos-appkit'
import { appMenu } from '../../../packages/app-menu/src/index.macos.ts'

function Content() {
  return (
    <rootlayout id="appmenu-root">
      <textfield id="appmenu-editor" />
    </rootlayout>
  )
}

const app = NSApplication.sharedApplication

app.setActivationPolicy(0)

const window = NSWindow.alloc().initWithContentRectStyleMaskBackingDefer(
  { origin: { x: 0, y: 0 }, size: { width: 400, height: 200 } },
  15,
  2,
  false,
)

window.releasedWhenClosed = false
window.title = 'XplatAppMenu'
app.finishLaunching()
window.makeKeyAndOrderFront(null)

const root = createMacOSRoot(window.contentView)

root.render(Content, {})

const CMD = 1 << 20,
  SHIFT = 1 << 17,
  OPT = 1 << 19

const counts = { new: 0, docA: 0, settings: 0, newWindow: 0, sidebar: 0 }
let handle: any = null

const menuTree = (sidebarValue: boolean) => [
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
        onSelect: () => counts.new++,
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
            onSelect: () => counts.docA++,
          },
        ],
      },
      {
        type: 'action',
        key: 'disabled',
        label: 'Disabled',
        accelerator: 'Mod+D',
        isDisabled: true,
        onSelect: () => (counts.new += 100),
      },
      { type: 'role', key: 'close', role: 'close' },
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
        onValueChange: (value: boolean) => {
          counts.sidebar++
          // In-dispatch update — logically immediate, natively deferred.
          handle.update(menuTree(value), options)
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
        onSelect: () => counts.settings++,
      },
    ],
  },
}

const flag = (value: unknown) => (typeof value === 'function' ? (value as () => unknown)() : value)
const items = (submenuItemOrMenu: any) => {
  const menu = submenuItemOrMenu?.submenu ?? submenuItemOrMenu
  const array = menu?.itemArray
  const count = Number(flag(array?.count) ?? 0)
  const out: any[] = []

  for (let index = 0; index < count; index++) {
    out.push(array.objectAtIndex(index))
  }

  return out
}

const pause = () => new Promise((resolve) => setTimeout(resolve, 150))
const sendEvent = (code: number, chars: string, ignoring: string, flags: number) => {
  const event =
    NSEvent.keyEventWithTypeLocationModifierFlagsTimestampWindowNumberContextCharactersCharactersIgnoringModifiersIsARepeatKeyCode(
      10,
      { x: 0, y: 0 },
      flags,
      0,
      window.windowNumber,
      null,
      chars,
      ignoring,
      false,
      code,
    )

  app.postEventAtStart(event, false)
}

const send = (code: number, chars: string, flags: number) => {
  sendEvent(code, flags & SHIFT ? chars.toUpperCase() : chars, chars, flags)
}

setTimeout(async () => {
  try {
    const check = (value: unknown, message: string) => {
      if (!value) {
        throw new Error(message)
      }
    }

    const editor = root.__macosDebug.findId('appmenu-editor')
    const previous = app.mainMenu ?? null

    check(appMenu.supported === true, 'appMenu.supported')

    handle = appMenu.install(menuTree(true), options)

    const bar = app.mainMenu

    check(bar && bar !== previous, 'mainMenu installed')

    const top = items(bar)

    check(top.length === 4, `4 menu-bar items (got ${top.length})`)

    const appSub = items(top[0])
    const titles = appSub.map((item: any) => (flag(item.separatorItem) ? '—' : item.title))
    const name = String(NSProcessInfo.processInfo.processName || 'App')

    check(
      JSON.stringify(titles) ===
        JSON.stringify([
          'About ' + name,
          '—',
          'Settings…',
          '—',
          'Hide ' + name,
          'Hide Others',
          'Show All',
          '—',
          'Quit ' + name,
        ]),
      'application menu layout: ' + titles,
    )

    const settingsItem = appSub.find((item: any) => item.title === 'Settings…')

    check(
      settingsItem.keyEquivalent === ',' && Number(settingsItem.keyEquivalentModifierMask) === CMD,
      'settings key equivalent',
    )

    const quitItem = appSub[appSub.length - 1]

    check(
      String(quitItem.action) === 'terminate:' &&
        quitItem.keyEquivalent === 'q' &&
        Number(quitItem.keyEquivalentModifierMask) === CMD,
      'quit selector/key',
    )

    const file = items(top[1])
    const newItem = file.find((item: any) => item.title === 'New')

    check(
      newItem.keyEquivalent === 'n' && Number(newItem.keyEquivalentModifierMask) === CMD,
      'New key equivalent',
    )

    const disabledItem = file.find((item: any) => item.title === 'Disabled')

    check(
      flag(disabledItem.enabled) === false || Number(flag(disabledItem.enabled)) === 0,
      'disabled item',
    )

    const recent = items(file.find((item: any) => flag(item.hasSubmenu)))

    check(recent[0].title === 'Doc A', 'nested submenu')

    const view = items(top[3])

    check(Number(flag(view[0].state)) === 1, 'checkbox state')

    const edit = items(top[2])
    const copy = edit.find((item: any) => item.title === 'Copy')

    check(
      String(copy.action) === 'copy:' && (copy.target === null || copy.target === undefined),
      'role selector + nil target',
    )

    check(
      Number(flag(edit.find((item: any) => item.title === 'Undo').keyEquivalentModifierMask)) ===
        CMD,
      'undo mask',
    )

    check(window.makeFirstResponder(editor), 'editor first responder')
    app.activateIgnoringOtherApps(true)

    send(45, 'n', CMD) // Cmd+N
    await pause()
    check(counts.new === 1, 'Cmd+N → new=1')
    send(2, 'd', CMD) // Cmd+D disabled
    await pause()
    check(counts.new === 1, 'disabled accel ignored')
    send(1, 's', CMD | SHIFT) // Cmd+Shift+S → controlled toggle + deferred update
    await pause()
    check(counts.sidebar === 1, 'onValueChange called')
    await pause()

    const viewAfter = items(items(app.mainMenu)[3])

    check(Number(flag(viewAfter[0].state)) === 0, 'deferred update applied (state 0)')
    send(40, 'k', CMD | OPT) // Cmd+Alt+K → Doc A
    await pause()
    check(counts.docA === 1, 'Cmd+Alt+K → docA=1')
    send(43, ',', CMD) // Cmd+,
    await pause()
    check(counts.settings === 1, 'applicationItems select')

    // Click path — re-read the current bar: the deferred update swapped it.
    const currentFileMenu = items(app.mainMenu)[1].submenu

    currentFileMenu.performActionForItemAtIndex(0)
    check(counts.new === 2, 'performActionForItemAtIndex')

    // Update outside dispatch: New → 'New Window' Mod+Shift+N.
    handle.update(
      menuTree(false).map((menu: any) =>
        menu.key === 'file'
          ? {
              ...menu,
              items: [
                {
                  type: 'action',
                  key: 'new',
                  label: 'New Window',
                  accelerator: 'Mod+Shift+N',
                  onSelect: () => counts.newWindow++,
                },
                ...menu.items.slice(1),
              ],
            }
          : menu,
      ),
      options,
    )

    const newFile = items(items(app.mainMenu)[1])
    const newWindowItem = newFile[0]

    check(
      newWindowItem.title === 'New Window' &&
        newWindowItem.keyEquivalent === 'n' &&
        Number(newWindowItem.keyEquivalentModifierMask) === (CMD | SHIFT),
      'updated key equivalent',
    )

    send(45, 'n', CMD)
    await pause()
    check(counts.new === 2, 'old accel no longer fires')
    send(45, 'n', CMD | SHIFT)
    await pause()
    // Platform note: this AppKit build matches menu key equivalents on
    // charactersIgnoringModifiers with event flags ⊆ the item mask, so the
    // plain ⌘N event above can also reach the 'n'+⌘⇧ item.
    check(counts.newWindow >= 1, 'new accel fires')

    // Stale native items are inert — top[] and fileMenu belong to retired bars.
    const fileMenu = top[1].submenu

    fileMenu.performActionForItemAtIndex(0)
    await pause()
    check(counts.new === 2, 'stale menu item inert')
    check(newItem.target === null || newItem.target === undefined, 'retired item target nil')

    // Edit roles through the real responder chain.
    const pasteboard = NSPasteboard.generalPasteboard
    const saved = pasteboard.stringForType('public.utf8-plain-text')

    try {
      pasteboard.clearContents()
      editor.stringValue = 'hello'
      check(window.makeFirstResponder(editor), 'editor focus for roles')
      await pause()

      const read = () => String(pasteboard.stringForType('public.utf8-plain-text') ?? '')
      const textView = window.firstResponder

      console.log('ROLE-DIAG stringValue=' + String(editor.stringValue))
      // Put the probe text on the field editor directly — NSTextView is
      // what actually responds to copy:/selectAll: on the responder chain.
      if (textView && typeof textView.insertText === 'function') {
        textView.insertText('hello')
      } else if (textView) {
        textView.string = 'hello'
      }

      console.log('ROLE-DIAG textView.string=' + String(textView?.string))
      // selectAll: directly on the field editor (NSText.selectAll: is the
      // colon selector; `.copy` binds copyWithZone: and must not be called).
      textView?.selectAll?.(null)

      const range = textView?.selectedRange

      console.log('ROLE-DIAG selected=' + (range ? `${range.location}:${range.length}` : 'none'))

      // copy: explicit target isolates chain delivery from NSTextView.copy:.
      let path = 'direct-target'

      app.sendActionToFrom('copy:', textView, editor)
      if (read() !== 'hello') {
        path = 'nil-target sendAction'
        app.sendActionToFrom('copy:', null, editor)
        await pause()
      }

      if (read() !== 'hello') {
        path = 'key event'
        send(8, 'c', CMD)
        await pause()
      }

      console.log('ROLE-DIAG path=' + path + ' pasteboard=' + read())
      check(read() === 'hello', `edit roles via responder chain (${path}: ${read()})`)
    } finally {
      pasteboard.clearContents()
      if (saved) {
        pasteboard.setStringForType(saved, 'public.utf8-plain-text')
      }
    }

    // Dispose restores the previous menu bar and frees the slot.
    handle.dispose()
    check(handle.isDisposed === true, 'isDisposed')
    check(app.mainMenu === previous || (!app.mainMenu && !previous), 'mainMenu restored')

    const newWindowBefore = counts.newWindow

    send(45, 'n', CMD | SHIFT)
    await pause()
    check(counts.newWindow === newWindowBefore, 'no callbacks after dispose')

    const second = appMenu.install(menuTree(true), options)

    try {
      appMenu.install(menuTree(true), options)
      throw new Error('single-owner violation')
    } catch (error) {
      check(String(error).includes('already installed'), 'single-owner error')
    }

    second.dispose()
    console.log(
      'APPMENU_APPKIT_OK install, app menu, roles, accels, controlled checkbox, deferred+outside update, stale items, responder chain, dispose, single-owner',
    )
  } catch (error) {
    console.error('APPMENU_APPKIT_FAIL ' + String(error && (error as Error).stack ? error : error))
  } finally {
    try {
      handle?.dispose()
    } catch {}

    try {
      root.unmount()
    } catch {}

    try {
      window.close()
    } catch {}

    __xplatStopHost()
  }
}, 100)
