import assert from 'node:assert/strict'
import { test } from 'node:test'
import { bindNativeHostAttachment } from '../src/native-host-lifecycle.android.ts'

test('window attachment scopes native load and unload across repeated dialog hosts', () => {
 const previous = globalThis.android
 globalThis.android = { view: { View: { OnAttachStateChangeListener: class { constructor(callbacks) { Object.assign(this, callbacks) } } } } }
 let listener, attached = false, window = null, observed = null, readers = 0
 const view = { addOnAttachStateChangeListener(next) { listener = next }, removeOnAttachStateChangeListener(next) { assert.equal(next, listener); listener = null }, isAttachedToWindow: () => attached }
 const host = { android: view, isLoaded: false, callLoaded() { this.isLoaded = true; readers++; observed = window }, callUnloaded() { this.isLoaded = false; readers--; observed = null } }
 try {
  const stop = bindNativeHostAttachment(host)
  assert.equal(readers, 0)
  window = {}; attached = true; listener.onViewAttachedToWindow()
  const first = observed
  assert.equal(readers, 1)
  listener.onViewAttachedToWindow(); assert.equal(readers, 1)
  attached = false; listener.onViewDetachedFromWindow()
  assert.equal(readers, 0); assert.equal(observed, null)
  window = {}; attached = true; listener.onViewAttachedToWindow()
  assert.equal(readers, 1); assert.notEqual(observed, first)
  const retired = listener
  stop(); stop(); retired.onViewAttachedToWindow()
  assert.equal(readers, 0); assert.equal(listener, null)
 } finally { if (previous === undefined) delete globalThis.android; else globalThis.android = previous }
})
