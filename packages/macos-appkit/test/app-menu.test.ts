import { createActionStore } from '../src/action-store.ts'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { registerHooks } from 'node:module'
import { test } from 'node:test'

// Production createAppMenu against a replaced Objective-C platform — menu
// structure, key equivalents, tag dispatch and ownership are real; hit-testing
// and OS delivery are not.
const platform = `
export class NSObject {
  static new() { return new this() }
}
export class NSView extends NSObject {}
export class NSEvent extends NSObject {}
class Menu extends NSObject {
  static alloc() { return new this() }
  init() { this.items = []; return this }
  addItem(item) { this.items.push(item) }
}
class MenuItem extends NSObject {
  static alloc() { return new this() }
  initWithTitleActionKeyEquivalent(title, action, charCode) {
    this.title = title; this.action = action; this.keyEquivalent = charCode ?? ''; return this
  }
  static separatorItem() { const item = new MenuItem(); item.separator = true; return item }
  isEnabled() { return this.enabled }
}
export const NSMenu = { alloc: () => new Menu() }
export const NSMenuItem = { alloc: () => new MenuItem(), separatorItem: MenuItem.separatorItem }
export const NSApplication = { sharedApplication: { mainMenu: null } }
export class NSGestureRecognizer extends NSObject {}
export class NSClickGestureRecognizer extends NSGestureRecognizer {}
export class NSPressGestureRecognizer extends NSGestureRecognizer {}
export const NSGestureRecognizerDelegate = {}
export const NSCursor = {}
export const NSTrackingArea = {}
export const NSTrackingAreaOptions = {}
export const interop = { types: { void: 'void' } }
export function NativeClass(ctor) { return ctor }
`

test('application menu builds the bar, dispatches tag selections, retires old tags and restores the previous menu', async () => {
  const hooks = registerHooks({
    resolve(specifier, owner, next) {
      if (specifier === '@octane-xplat/platform/macos') {
        return { url: 'data:text/javascript,' + encodeURIComponent(platform), shortCircuit: true }
      }
      if (specifier.startsWith('.') && owner.parentURL) {
        const candidate = new URL(specifier + '.ts', owner.parentURL)
        if (existsSync(candidate)) {
          return next(candidate.href, owner)
        }
      }
      return next(specifier, owner)
    },
  })
  try {
    const { createAppMenu } = await import('../src/app-menu.ts')
    const { NSApplication } = await import('@octane-xplat/platform/macos')
    const app = NSApplication.sharedApplication
    const store = createActionStore()
    const menu = createAppMenu({ actions: { allocate: store.allocate, invokeAction: store.dispatch } })

    const previousBar = { foreign: true }
    app.mainMenu = previousBar
    const selected: string[] = []
    const installed = menu.installApplicationMenu([
      {
        type: 'submenu',
        title: 'TestApp',
        children: [
          { type: 'item', title: 'About TestApp', keyEquivalent: '', modifierMask: 0, enabled: true, state: 0, selector: 'orderFrontStandardAboutPanel:' },
          { type: 'separator' },
          { type: 'item', title: 'Quit TestApp', keyEquivalent: 'q', modifierMask: 1 << 20, enabled: true, state: 0, selector: 'terminate:' },
        ],
      },
      {
        type: 'submenu',
        title: 'File',
        children: [
          {
            type: 'item',
            title: 'New',
            keyEquivalent: 'n',
            modifierMask: 1 << 20,
            enabled: true,
            state: 0,
            onSelect: () => selected.push('new'),
          },
          {
            type: 'item',
            title: 'Wrap',
            keyEquivalent: '',
            modifierMask: 0,
            enabled: false,
            state: 1,
            onSelect: () => selected.push('wrap'),
          },
          {
            type: 'submenu',
            title: 'Recent',
            children: [
              {
                type: 'item',
                title: 'One',
                keyEquivalent: '',
                modifierMask: 0,
                enabled: true,
                state: 0,
                onSelect: () => selected.push('one'),
              },
            ],
          },
        ],
      },
    ])

    assert.ok(installed)
    const bar = app.mainMenu
    assert.notEqual(bar, previousBar)
    assert.equal(bar.autoenablesItems, false)
    assert.equal(bar.items.length, 2)
    const [appItem, fileItem] = bar.items
    assert.equal(appItem.title, 'TestApp')
    assert.ok(appItem.submenu)
    assert.equal(appItem.submenu.autoenablesItems, false)
    const [about, separator, quit] = appItem.submenu.items
    // Selector items are nil-target responder-chain rows.
    assert.equal(about.target, null)
    assert.equal(about.action, 'orderFrontStandardAboutPanel:')
    assert.equal(separator.separator, true)
    assert.equal(quit.action, 'terminate:')
    assert.equal(quit.keyEquivalent, 'q')

    const file = fileItem.submenu
    const [newItem, wrapItem, recentItem] = file.items
    assert.equal(newItem.action, 'appMenuItemSelected:')
    assert.equal(newItem.keyEquivalent, 'n')
    assert.equal(newItem.keyEquivalentModifierMask, 1 << 20)
    assert.equal(newItem.enabled, true)
    assert.equal(wrapItem.state, 1)
    assert.equal(wrapItem.enabled, false)
    assert.ok(recentItem.submenu)
    const recentOne = recentItem.submenu.items[0]

    // Dispatch through the real target → tag → action-store → onSelect.
    newItem.target.appMenuItemSelected(newItem)
    recentOne.target.appMenuItemSelected(recentOne)
    assert.deepEqual(selected, ['new', 'one'])
    // Disabled items never dispatch.
    wrapItem.target.appMenuItemSelected(wrapItem)
    assert.deepEqual(selected, ['new', 'one'])

    const staleTag = newItem.tag
    installed!.update([
      {
        type: 'submenu',
        title: 'File',
        children: [
          {
            type: 'item',
            title: 'Open',
            keyEquivalent: 'o',
            modifierMask: 1 << 20,
            enabled: true,
            state: 0,
            onSelect: () => selected.push('open'),
          },
        ],
      },
    ])
    const nextBar = app.mainMenu
    assert.notEqual(nextBar, bar)
    // The retired generation's tags and targets are inert.
    store.dispatch(staleTag)
    assert.equal(newItem.target, null)
    assert.equal(newItem.action, null)
    assert.deepEqual(selected, ['new', 'one'])
    const open = nextBar.items[0].submenu.items[0]
    open.target.appMenuItemSelected(open)
    assert.deepEqual(selected, ['new', 'one', 'open'])

    // A foreign mainMenu is left alone on dispose.
    app.mainMenu = { foreign: 'replacement' }
    installed!.dispose()
    assert.deepEqual(app.mainMenu, { foreign: 'replacement' })

    // …but the bar restores the previous menu while still installed.
    app.mainMenu = previousBar
    const second = menu.installApplicationMenu([
      { type: 'submenu', title: 'Only', children: [] },
    ])
    const secondBar = app.mainMenu
    assert.notEqual(secondBar, previousBar)
    second!.dispose()
    assert.equal(app.mainMenu, previousBar)
  } finally {
    hooks.deregister()
  }
})
