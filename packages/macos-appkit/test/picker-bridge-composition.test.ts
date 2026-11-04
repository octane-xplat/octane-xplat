import { createActionStore } from '../src/action-store.ts'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { registerHooks } from 'node:module'
import { test } from 'node:test'

// Real bridge constructor; only the Objective-C boundary is substituted.
const platform = `
export class NSView {}
export const NSMenuItem = {};
export const NSDatePickerStyle = {};
export const NSDatePickerElementFlags = {};
export const NSDate = { dateWithTimeIntervalSince1970: seconds => ({ timeIntervalSince1970: seconds }) };
export const NSDatePicker = { alloc: () => ({
  init() {
    this.dateValue = { timeIntervalSince1970: 0 };
    for (const edge of ['leadingAnchor', 'trailingAnchor', 'topAnchor', 'bottomAnchor']) {
      this[edge] = { constraintEqualToAnchor: () => {
        const constraint = { active: false }; this.constraints.push(constraint); return constraint;
      } };
    }
    return this;
  },
  constraints: [],
  removeFromSuperview() { this.superview = null },
  get enabled() { return this._enabled },
  set enabled(value) { if (this.failWrite) throw this.failWrite; this._enabled = value },
}) };
`

test('date bridge accepts native class handles and retires acquired resources on detach and failed writes', async () => {
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
    const { createPickerBridge } = await import('../src/picker-bridge.ts')
    const store = createActionStore()
    const actions = { allocate: store.allocate, buttonActionTarget: {} }
    const bridge = createPickerBridge({ actions, pickerElements: { makePopUpControl() { throw Error('not used') } } })
    let picker: any
    const view: any = { window: {}, addSubview(value) { picker = value; value.superview = this } }
    const events: number[] = []
    for (const mode of ['date', 'time', 'dateAndTime']) {
      const handle = bridge.attachDatePicker(view, { mode, selectionMillis: 120000 }, value => events.push(value))
      assert.ok(handle)
      assert.equal(picker.dateValue.timeIntervalSince1970, 120)
      assert.equal(picker.datePickerElements, mode === 'time' ? 12 : mode === 'date' ? 224 : 236)
      const callback = () => store.dispatch(picker.tag)
      callback()
      assert.equal(events.at(-1), 120000)
      const count = events.length
      handle.update({ selectionMillis: 180000 })
      assert.equal(picker.dateValue.timeIntervalSince1970, 180)
      assert.equal(events.length, count)
      handle.detach()
      handle.detach()
      callback()
      assert.equal(events.length, count)
      assert.equal(store.idForView(picker), undefined)
      assert.equal(picker.superview, null)
      assert.equal(picker.target, null)
      assert.equal(picker.action, null)
      assert.ok(picker.constraints.every(constraint => !constraint.active))
    }
    const handle = bridge.attachDatePicker(view, {}, () => {})
    assert.ok(handle)
    const failure = Error('native write')
    picker.failWrite = failure
    assert.throws(() => handle.update({ enabled: false }), error => error === failure)
    assert.equal(store.idForView(picker), undefined)
    assert.equal(picker.superview, null)
    // Partial attachment acquires constraints before failing. They must retire too.
    view.addSubview = value => { picker = value; value.superview = view; throw failure }
    assert.equal(bridge.attachDatePicker(view, {}, () => {}), null)
    assert.equal(picker.superview, null)
    assert.equal(store.idForView(picker), undefined)
  } finally {
    hooks.deregister()
  }
})
