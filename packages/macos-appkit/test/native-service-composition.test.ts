import { createActionStore } from '../src/action-store.ts'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { registerHooks } from 'node:module'
import { test } from 'node:test'

// Exercise production constructors and native target/action dispatch together.
// Only the Objective-C platform is replaced; no factory body is extracted.
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
  cancelTracking() {}
}
class MenuItem extends NSObject {
  static alloc() { return new this() }
  initWithTitleActionKeyEquivalent(title, action) {
    this.title = title; this.action = action; return this
  }
  isEnabled() { return this.enabled }
}
// NativeScript's macOS NAPI class handles are objects with alloc(), not JS functions.
export const NSMenu = { alloc: () => new Menu() };
export const NSMenuItem = { alloc: () => new MenuItem() };
export class NSGestureRecognizer extends NSObject {}
export class NSClickGestureRecognizer extends NSGestureRecognizer {}
export class NSPressGestureRecognizer extends NSGestureRecognizer {}
export const NSGestureRecognizerDelegate = {};
export const NSCursor = {};
export const NSTrackingArea = {};
export const NSTrackingAreaOptions = {};
export const interop = { types: { void: 'void' } };
export function NativeClass(ctor) { return ctor }
`

test('hover and menu constructors own their targets independently and menus dispatch then retire actions', async (context) => {
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
    const { createHover } = await import('../src/hover.ts')
    const { createContextMenu } = await import('../src/context-menu.ts')
    const logs: unknown[][] = []
    context.mock.method(console, 'error', (...args: unknown[]) => logs.push(args))
    const store = createActionStore()
    const actions = { allocate: store.allocate, invokeAction: store.dispatch }
    // This is the runtime's real order: hover is built before contextMenu.
    const hover = createHover()
    const menu = createContextMenu({ actions })
    assert.ok(hover.hoverTrackingTarget)
    assert.deepEqual(logs, [])

    const view: any = { menu: null, window: {} }
    const selected: (string | undefined)[] = []
    const detach = menu.attachContextMenu(view, { items: [{ id: 'open', title: 'Open' }] }, id => selected.push(id))
    assert.equal(typeof detach, 'function')
    const item = view.menu.items[0]
    item.target.menuItemSelected(item)
    assert.deepEqual(selected, ['open'])
    const retainedAction = () => store.dispatch(item.tag)
    detach!()
    assert.equal(view.menu, null)
    retainedAction?.()
    assert.deepEqual(selected, ['open'])
  } finally {
    hooks.deregister()
  }
})
